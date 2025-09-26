from typing import Generator
from sqlalchemy.orm import Session
from app.crud.session import get_db

def get_database() -> Generator:
    return get_db()