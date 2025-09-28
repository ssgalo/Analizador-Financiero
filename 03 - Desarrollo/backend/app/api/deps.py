from typing import Generator
from sqlalchemy.orm import Session
from app.crud.session import get_db as session_get_db

def get_db() -> Generator[Session, None, None]:
    """
    Dependency function to get database session
    """
    yield from session_get_db()