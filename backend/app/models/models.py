"""
Database models for The Daily Digest
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey, Table, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

# Association table for many-to-many relationship between users and saved articles
user_saved_articles = Table(
    'user_saved_articles',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id')),
    Column('article_id', Integer, ForeignKey('articles.id')),
    Column('saved_at', DateTime, default=datetime.utcnow)
)


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    saved_articles = relationship("Article", secondary=user_saved_articles, back_populates="saved_by_users")


class Digest(Base):
    __tablename__ = "digests"
    
    id = Column(Integer, primary_key=True, index=True)
    edition = Column(String, nullable=False)  # "morning" or "evening"
    date = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_published = Column(Boolean, default=False)
    
    # Relationships
    articles = relationship("Article", back_populates="digest")


class Article(Base):
    __tablename__ = "articles"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    url = Column(String, nullable=False, unique=True)
    source = Column(String, nullable=False)  # BBC, Reuters, etc.
    category = Column(String, nullable=False)  # International, Portugal, Tech, etc.
    description = Column(Text)
    published_date = Column(DateTime)
    digest_id = Column(Integer, ForeignKey('digests.id'))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Additional metadata
    metadata_json = Column(JSON, default={})
    
    # Relationships
    digest = relationship("Digest", back_populates="articles")
    saved_by_users = relationship("User", secondary=user_saved_articles, back_populates="saved_articles")
