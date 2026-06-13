# StockFlow: Production-Ready Inventory & Order Management System

StockFlow is a production-ready, fully containerized full-stack **Inventory & Order Management System** designed for modern businesses to manage products, customers, and orders. It tracks real-time inventory levels, blocks orders with insufficient stock, and automatically calculates order totals in the backend database.

## Architecture & Technology Stack

The application is structured as a multi-container Docker Compose application:

- **Frontend**: React SPA built with **Vite** and styled using custom, responsive **Vanilla CSS** featuring dark mode glassmorphism aesthetics.
- **Backend API**: Python **FastAPI** web framework with database interaction using **SQLAlchemy ORM** and request validation using **Pydantic**.
- **Database**: **PostgreSQL 15** for ACID-compliant, persistent relational data storage.
- **Containerization**: **Docker** & **Docker Compose** orchestration.

---

## Folder Structure

```text
├── backend/
│   ├── app/
│   │   ├── config.py       # Configuration and .env loading
│   │   ├── database.py     # SQLAlchemy DB sessions
│   │   ├── models.py       # SQLAlchemy Database models
│   │   ├── schemas.py      # Pydantic schema validation
│   │   ├── crud.py         # Business logic and query validations
│   │   └── main.py         # FastAPI main initialization and router setup
│   ├── Dockerfile          # Multi-stage slim backend image
│   ├── requirements.txt    # Python library requirements
│   └── .dockerignore
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # Core React layout and views logic
│   │   ├── main.jsx        # Bootstrap entrypoint
│   │   └── index.css       # Custom dark-mode glassmorphic CSS rules
│   ├── index.html          # HTML entry with font imports
│   ├── package.json        # Frontend node packages
│   ├── vite.config.js      # Vite dev/build server configuration
│   ├── nginx.conf          # Nginx configurations for deployment
│   ├── Dockerfile          # Multi-stage build and web-server image
│   └── .dockerignore
├── docker-compose.yml      # Docker compose configuration
├── .env.example            # Environment variables configuration template
└── README.md               # Setup and deployment guidelines
```

---

## Local Setup Instructions

Ensure you have [Docker and Docker Compose](https://www.docker.com/products/docker-desktop/) installed on your machine.

### 1. Configure environment variables
Copy the `.env.example` file to create a `.env` file:
```bash
copy .env.example .env
```
*(On Unix-like shells, run: `cp .env.example .env`)*

### 2. Start the application
Run the following command in the root folder to compile and run all containers:
```bash
docker compose up --build
```

### 3. Access the services
Once the build is complete and the postgres database passes its health checks, the services will be available at:
- **React Frontend**: [http://localhost:3000](http://localhost:3000)
- **FastAPI Backend (API Root)**: [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs) (Use this to test the API endpoints interactively)

---

## Database Schema Design

The postgres database runs four relational structures:
1. **`products`**: Stores inventory items. Contains unique `sku` checks, non-negative price validations, and non-negative stock counts.
2. **`customers`**: Stores profile records. Validates unique emails.
3. **`orders`**: Tracks purchases. Calculates total amount on the server.
4. **`order_items`**: Line items linked to individual orders. Cascades delete on order cancellations and restricts deletion on products to prevent data orphanages.

---

## Submission & Deployment Guidelines

To complete the requirements, follow the steps below to push your images, repository, and deploy live online.

### 1. Push Code to GitHub
Initialize your git repository, commit the files, and push:
```bash
git init
git add .
git commit -m "feat: initial commit of StockFlow inventory system"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Push Backend Image to Docker Hub
Build, tag, and upload your backend image to Docker Hub so it can be reference-pulled:
```bash
# Login to Docker Hub
docker login

# Build the backend image
docker build -t <your-dockerhub-username>/stockflow-backend:latest ./backend

# Push image to Docker Hub registry
docker push <your-dockerhub-username>/stockflow-backend:latest
```

### 3. Deploy Backend API (Render)
Deploying to **Render** (free tier Web Service):
1. Create a new account at [Render](https://render.com/).
2. Click **New +** > **Web Service**.
3. Select your GitHub repository or enter the Docker Hub image reference: `docker.io/<your-dockerhub-username>/stockflow-backend:latest`.
4. In settings, choose **Docker** runtime (if deploying from Git) or configure the Docker Hub image directly.
5. Create a **Render PostgreSQL database** first, copy its internal connection string, and set it as an Environment Variable in the Backend Web Service:
   - `DATABASE_URL`: `postgresql://<user>:<password>@<db-host>/<db-name>`
6. Deploy the service. Note down the public URL (e.g. `https://stockflow-backend.onrender.com`).

### 4. Deploy Frontend (Vercel)
Deploying to **Vercel** (free tier hosting):
1. Sign in to [Vercel](https://vercel.com/) and click **Add New** > **Project**.
2. Select your GitHub repository containing the React frontend.
3. Set the root directory of Vercel to `frontend`.
4. Configure build settings:
   - **Framework Preset**: `Vite` (Vercel detects this automatically).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. In **Environment Variables**, add the connection string pointing to your deployed backend URL:
   - Key: `VITE_API_URL`
   - Value: `https://stockflow-backend.onrender.com` (your live Render API URL)
6. Click **Deploy**. Note down the public URL (e.g. `https://stockflow.vercel.app`).
