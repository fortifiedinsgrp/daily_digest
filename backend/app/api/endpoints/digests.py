"""
Digest API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date
from app.db.database import get_db
from app.models.models import Digest, Article
from app.schemas.schemas import DigestSummary, DigestWithArticles
from app.api.endpoints.auth import get_current_user
from app.services.curation import CurationService

router = APIRouter(prefix="/digests", tags=["digests"])


@router.get("/", response_model=List[DigestSummary])
def get_digests(
    skip: int = 0,
    limit: int = 10,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get list of published digests"""
    digests = db.query(Digest).filter(
        Digest.is_published == True
    ).order_by(
        Digest.date.desc()
    ).offset(skip).limit(limit).all()
    
    # Add article count for each digest
    for digest in digests:
        digest.article_count = db.query(Article).filter(
            Article.digest_id == digest.id
        ).count()
    
    return digests


@router.get("/latest/{edition}", response_model=DigestWithArticles)
def get_latest_digest(
    edition: str,
    background_tasks: BackgroundTasks,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the latest digest for morning or evening edition"""
    if edition not in ["morning", "evening"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Edition must be 'morning' or 'evening'"
        )
    
    digest = db.query(Digest).filter(
        Digest.edition == edition,
        Digest.is_published == True
    ).order_by(
        Digest.date.desc()
    ).first()
    
    if not digest:
        # Create a new digest in the background if none exists
        def run_curation():
            curation_service = CurationService(db)
            curation_service.create_digest(edition)
        
        background_tasks.add_task(run_curation)

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"The '{edition}' digest is being created. Please check back in a moment."
        )
    
    # Get articles grouped by category
    articles = db.query(Article).filter(
        Article.digest_id == digest.id
    ).all()
    
    # Check which articles are saved by the user
    saved_article_ids = [sa.id for sa in current_user.saved_articles]
    for article in articles:
        article.is_saved = article.id in saved_article_ids
    
    # Group articles by category
    articles_by_category = {}
    for article in articles:
        if article.category not in articles_by_category:
            articles_by_category[article.category] = []
        articles_by_category[article.category].append(article)
    
    digest.articles = articles
    digest.articles_by_category = articles_by_category
    
    return digest


@router.get("/today", response_model=DigestWithArticles)
def get_todays_digest(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the current digest based on time of day"""
    current_hour = datetime.utcnow().hour
    
    # Determine edition based on time (EST is UTC-5)
    est_hour = (current_hour - 5) % 24
    edition = "morning" if est_hour < 12 else "evening"
    
    return get_latest_digest(edition, current_user, db)


@router.post("/create/{edition}", status_code=status.HTTP_202_ACCEPTED)
def create_digest_manual(
    edition: str,
    background_tasks: BackgroundTasks,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Manually trigger digest creation as a background task"""
    if edition not in ["morning", "evening"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Edition must be 'morning' or 'evening'"
        )
    
    def run_curation():
        curation_service = CurationService(db)
        curation_service.create_digest(edition)

    background_tasks.add_task(run_curation)
    
    return {"message": f"Digest creation for '{edition}' edition started in the background."}


@router.get("/{digest_id}", response_model=DigestWithArticles)
def get_digest(
    digest_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific digest by ID"""
    digest = db.query(Digest).filter(
        Digest.id == digest_id,
        Digest.is_published == True
    ).first()
    
    if not digest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Digest not found"
        )
    
    # Get articles
    articles = db.query(Article).filter(
        Article.digest_id == digest.id
    ).all()
    
    # Check saved status
    saved_article_ids = [sa.id for sa in current_user.saved_articles]
    for article in articles:
        article.is_saved = article.id in saved_article_ids
    
    # Group by category
    articles_by_category = {}
    for article in articles:
        if article.category not in articles_by_category:
            articles_by_category[article.category] = []
        articles_by_category[article.category].append(article)
    
    digest.articles = articles
    digest.articles_by_category = articles_by_category
    
    return digest
