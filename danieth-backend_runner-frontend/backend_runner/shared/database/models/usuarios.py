from sqlalchemy import Column, BigInteger, String, Text
from shared.database.base import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(BigInteger, primary_key=True)
    nombre = Column(String, nullable=False)
    email = Column(String, nullable=False)
    password_hash = Column(Text, nullable=False)
    rol = Column(String, nullable=False)