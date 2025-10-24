"""
Pydantic schemas for The Daily Digest
"""
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List, Dict, Any


# User schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserInDB(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class User(UserInDB):
    pass


# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


# Article schemas
class ArticleBase(BaseModel):
    title: str
    url: str
    source: str
    category: str
    description: Optional[str] = None
    published_date: Optional[datetime] = None


class ArticleCreate(ArticleBase):
    digest_id: int


class Article(ArticleBase):
    id: int
    created_at: datetime
    is_saved: Optional[bool] = False
    metadata_json: Optional[Dict[str, Any]] = {}
    
    class Config:
        from_attributes = True


# Digest schemas
class DigestBase(BaseModel):
    edition: str
    date: datetime


class DigestCreate(DigestBase):
    pass


class DigestSummary(DigestBase):
    id: int
    is_published: bool
    article_count: Optional[int] = 0
    
    class Config:
        from_attributes = True


class DigestWithArticles(DigestBase):
    id: int
    is_published: bool
    articles: List[Article]
    articles_by_category: Optional[Dict[str, List[Article]]] = {}
    
    class Config:
        from_attributes = True


# Saved article schemas
class SaveArticleRequest(BaseModel):
    article_id: int


class SavedArticle(Article):
    saved_at: datetime
