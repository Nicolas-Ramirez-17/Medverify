from collections.abc import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import settings


def crear_engine(url: str):
    kwargs = {'pool_pre_ping': True}
    if url.startswith('sqlite'):
        kwargs = {'connect_args': {'check_same_thread': False}}
    return create_engine(url, **kwargs)


engine = crear_engine(settings.database_url)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
