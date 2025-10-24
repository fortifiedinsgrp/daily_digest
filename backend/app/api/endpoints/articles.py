"""
Articles API endpoints - includes Read Later functionality
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.db.database import get_db
from app.models.models import Article, User, user_saved_articles
from app.schemas.schemas import Article as ArticleSchema, SaveArticleRequest, SavedArticle
from app.api.endpoints.auth import get_current_user

router = APIRouter(prefix="/articles", tags=["articles"])


@router.get("/saved", response_model=List[SavedArticle])
def get_saved_articles(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all saved articles for the current user"""
    # Get saved articles with saved_at timestamp
    saved_articles = db.query(
        Article,
        user_saved_articles.c.saved_at
    ).join(
        user_saved_articles,
        Article.id == user_saved_articles.c.article_id
    ).filter(
        user_saved_articles.c.user_id == current_user.id
    ).order_by(
        user_saved_articles.c.saved_at.desc()
    ).all()
    
    # Format response
    result = []
    for article, saved_at in saved_articles:
        article_dict = {
            'id': article.id,
            'title': article.title,
            'url': article.url,
            'source': article.source,
            'category': article.category,
            'description': article.description,
            'published_date': article.published_date,
            'created_at': article.created_at,
            'is_saved': True,
            'metadata_json': article.metadata_json,
            'saved_at': saved_at
        }
        result.append(article_dict)
    
    return result


@router.post("/save", response_model=dict)
def save_article(
    request: SaveArticleRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save an article to the user's Read Later list"""
    # Check if article exists
    article = db.query(Article).filter(Article.id == request.article_id).first()
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found"
        )
    
    # Check if already saved
    existing = db.query(user_saved_articles).filter(
        user_saved_articles.c.user_id == current_user.id,
        user_saved_articles.c.article_id == request.article_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Article already saved"
        )
    
    # Save the article
    db.execute(
        user_saved_articles.insert().values(
            user_id=current_user.id,
            article_id=request.article_id,
            saved_at=datetime.utcnow()
        )
    )
    db.commit()
    
    return {"message": "Article saved successfully", "article_id": request.article_id}


@router.delete("/save/{article_id}", response_model=dict)
def unsave_article(
    article_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove an article from the user's Read Later list"""
    # Check if saved
    existing = db.query(user_saved_articles).filter(
        user_saved_articles.c.user_id == current_user.id,
        user_saved_articles.c.article_id == article_id
    ).first()
    
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not in saved list"
        )
    
    # Remove from saved
    db.execute(
        user_saved_articles.delete().where(
            user_saved_articles.c.user_id == current_user.id,
            user_saved_articles.c.article_id == article_id
        )
    )
    db.commit()
    
    return {"message": "Article removed from saved list", "article_id": article_id}


@router.get("/{article_id}", response_model=ArticleSchema)
def get_article(
    article_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific article by ID"""
    article = db.query(Article).filter(Article.id == article_id).first()
    
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found"
        )
    
    # Check if saved by user
    saved = db.query(user_saved_articles).filter(
        user_saved_articles.c.user_id == current_user.id,
        user_saved_articles.c.article_id == article_id
    ).first()
    
    article.is_saved = saved is not None
    
    return article
