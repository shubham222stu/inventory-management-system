from sqlalchemy.orm import Session
from fastapi import HTTPException
from . import models, schemas

# --- Product CRUD ---

def get_product(db: Session, product_id: int):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail=f"Product with ID {product_id} not found.")
    return product

def get_products(db: Session):
    return db.query(models.Product).order_by(models.Product.created_at.desc()).all()

def create_product(db: Session, product: schemas.ProductCreate):
    # Verify unique SKU
    db_product = db.query(models.Product).filter(models.Product.sku == product.sku).first()
    if db_product:
        raise HTTPException(
            status_code=400, 
            detail=f"Product SKU code '{product.sku}' is already in use."
        )
    
    new_product = models.Product(
        name=product.name,
        sku=product.sku,
        price=product.price,
        quantity=product.quantity
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

def update_product(db: Session, product_id: int, product_update: schemas.ProductUpdate):
    db_product = get_product(db, product_id)
    
    # Verify unique SKU if SKU is being updated
    if product_update.sku is not None and product_update.sku != db_product.sku:
        dup = db.query(models.Product).filter(models.Product.sku == product_update.sku).first()
        if dup:
            raise HTTPException(
                status_code=400, 
                detail=f"Product SKU code '{product_update.sku}' is already in use."
            )
            
    # Apply changes
    update_data = product_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_product, key, value)
        
    db.commit()
    db.refresh(db_product)
    return db_product

def delete_product(db: Session, product_id: int):
    db_product = get_product(db, product_id)
    
    # Check if product is in any orders
    in_orders = db.query(models.OrderItem).filter(models.OrderItem.product_id == product_id).first()
    if in_orders:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete product. It has already been ordered and is linked to order history."
        )
        
    db.delete(db_product)
    db.commit()
    return {"message": f"Product '{db_product.name}' was successfully deleted."}


# --- Customer CRUD ---

def get_customer(db: Session, customer_id: int):
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail=f"Customer with ID {customer_id} not found.")
    return customer

def get_customers(db: Session):
    return db.query(models.Customer).order_by(models.Customer.created_at.desc()).all()

def create_customer(db: Session, customer: schemas.CustomerCreate):
    # Verify unique Email
    db_customer = db.query(models.Customer).filter(models.Customer.email == customer.email).first()
    if db_customer:
        raise HTTPException(
            status_code=400, 
            detail=f"Customer email '{customer.email}' is already registered."
        )
        
    new_customer = models.Customer(
        name=customer.name,
        email=customer.email,
        phone=customer.phone
    )
    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)
    return new_customer

def delete_customer(db: Session, customer_id: int):
    db_customer = get_customer(db, customer_id)
    
    # Check if customer has active orders
    has_orders = db.query(models.Order).filter(models.Order.customer_id == customer_id).first()
    if has_orders:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete customer. They have placed orders in the system."
        )
        
    db.delete(db_customer)
    db.commit()
    return {"message": f"Customer '{db_customer.name}' was successfully deleted."}


# --- Order CRUD ---

def get_orders(db: Session):
    return db.query(models.Order).order_by(models.Order.created_at.desc()).all()

def get_order(db: Session, order_id: int):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail=f"Order with ID {order_id} not found.")
    return order

def create_order(db: Session, order_data: schemas.OrderCreate):
    # Verify customer exists
    get_customer(db, order_data.customer_id)
    
    # We will compute stock deduction and totals
    items_to_create = []
    total_amount = 0.0
    
    try:
        for item in order_data.items:
            db_product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
            if not db_product:
                raise HTTPException(
                    status_code=404, 
                    detail=f"Product with ID {item.product_id} does not exist."
                )
            
            # Verify inventory stock
            if db_product.quantity < item.quantity:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient inventory stock for '{db_product.name}'. Available: {db_product.quantity}, Requested: {item.quantity}."
                )
                
            # Deduct stock
            db_product.quantity -= item.quantity
            
            # Sum totals
            item_cost = db_product.price * item.quantity
            total_amount += item_cost
            
            # Create OrderItem object
            order_item = models.OrderItem(
                product_id=db_product.id,
                quantity=item.quantity,
                price_at_order=db_product.price
            )
            items_to_create.append(order_item)
            
        # Create Order record
        db_order = models.Order(
            customer_id=order_data.customer_id,
            total_amount=total_amount
        )
        db.add(db_order)
        db.flush()  # Flush to get the order's auto-increment ID
        
        # Link order items
        for order_item in items_to_create:
            order_item.order_id = db_order.id
            db.add(order_item)
            
        db.commit()
        db.refresh(db_order)
        return db_order
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred while processing the order: {str(e)}"
        )

def delete_order(db: Session, order_id: int):
    db_order = get_order(db, order_id)
    
    try:
        # Restore stock for each product in the order
        for item in db_order.items:
            db_product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
            if db_product:
                db_product.quantity += item.quantity
                
        db.delete(db_order)
        db.commit()
        return {"message": f"Order #{db_order.id} cancelled/deleted. Product stock restored."}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to cancel order: {str(e)}"
        )


# --- Dashboard Summary ---

def get_dashboard_summary(db: Session):
    total_products = db.query(models.Product).count()
    total_customers = db.query(models.Customer).count()
    total_orders = db.query(models.Order).count()
    
    # Low stock products (quantity <= 5)
    low_stock = db.query(models.Product).filter(models.Product.quantity <= 5).order_by(models.Product.quantity.asc()).all()
    
    return {
        "total_products": total_products,
        "total_customers": total_customers,
        "total_orders": total_orders,
        "low_stock_products": low_stock
    }
