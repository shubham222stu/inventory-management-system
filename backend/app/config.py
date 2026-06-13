import os
from dotenv import load_dotenv

# Load environment variables from .env file if present
load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "sqlite:///./inventory.db"
)
