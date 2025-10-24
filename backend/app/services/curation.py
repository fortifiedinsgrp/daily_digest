"""
News curation service - fetches and processes articles from RSS feeds
"""
import feedparser
import requests
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from bs4 import BeautifulSoup
from sqlalchemy.orm import Session
from app.models.models import Article, Digest
from app.services.news_sources import NEWS_SOURCES, CATEGORY_MAPPINGS
import hashlib
import re


class CurationService:
    """Service for curating news articles from configured sources"""
    
    def __init__(self, db: Session):
        self.db = db
        self.articles_per_category = 10  # Number of articles per category
        self.max_age_hours = 24  # Only include articles from last 24 hours
    
    def create_digest(self, edition: str = "morning") -> Digest:
        """Create a new digest and populate it with curated articles"""
        # Create new digest
        digest = Digest(
            edition=edition,
            date=datetime.utcnow(),
            is_published=False
        )
        self.db.add(digest)
        self.db.commit()
        
        # Fetch and curate articles
        all_articles = self.fetch_all_articles()
        curated_articles = self.curate_articles(all_articles)
        
        # Save articles to database
        for category, articles in curated_articles.items():
            for article_data in articles:
                article = Article(
                    title=article_data['title'],
                    url=article_data['url'],
                    source=article_data['source'],
                    category=category,
                    description=article_data.get('description'),
                    published_date=article_data.get('published_date'),
                    digest_id=digest.id,
                    metadata_json={
                        'author': article_data.get('author'),
                        'image_url': article_data.get('image_url')
                    }
                )
                self.db.add(article)
        
        # Mark digest as published
        digest.is_published = True
        self.db.commit()
        
        return digest
    
    def fetch_all_articles(self) -> List[Dict]:
        """Fetch articles from all configured RSS feeds"""
        all_articles = []
        
        for source_name, source_config in NEWS_SOURCES.items():
            for category, feed_url in source_config['categories'].items():
                try:
                    articles = self.fetch_rss_feed(
                        feed_url, 
                        source_name, 
                        category
                    )
                    all_articles.extend(articles)
                except Exception as e:
                    print(f"Error fetching {source_name} - {category}: {e}")
                    continue
        
        return all_articles
    
    def fetch_rss_feed(self, feed_url: str, source: str, category: str) -> List[Dict]:
        """Fetch and parse a single RSS feed"""
        articles = []
        
        try:
            feed = feedparser.parse(feed_url)
            cutoff_time = datetime.utcnow() - timedelta(hours=self.max_age_hours)
            
            for entry in feed.entries[:20]:  # Limit to 20 entries per feed
                # Parse published date
                published_date = None
                if hasattr(entry, 'published_parsed'):
                    published_date = datetime(*entry.published_parsed[:6])
                    
                    # Skip old articles
                    if published_date < cutoff_time:
                        continue
                
                # Check for paywall indicators
                if self.is_likely_paywalled(entry):
                    continue
                
                article = {
                    'title': entry.get('title', ''),
                    'url': entry.get('link', ''),
                    'source': source,
                    'category': category,
                    'description': self.clean_html(entry.get('summary', '')),
                    'published_date': published_date,
                    'author': entry.get('author', ''),
                    'guid': entry.get('id', entry.get('link', '')),
                }
                
                # Extract image if available
                if hasattr(entry, 'media_content'):
                    article['image_url'] = entry.media_content[0].get('url')
                elif hasattr(entry, 'enclosures') and entry.enclosures:
                    article['image_url'] = entry.enclosures[0].get('href')
                
                articles.append(article)
                
        except Exception as e:
            print(f"Error parsing feed {feed_url}: {e}")
        
        return articles
    
    def curate_articles(self, articles: List[Dict]) -> Dict[str, List[Dict]]:
        """
        Curate articles by category based on PRD requirements
        Returns dict with categories as keys and article lists as values
        """
        curated = {}
        
        for prd_category, search_categories in CATEGORY_MAPPINGS.items():
            category_articles = []
            
            for article in articles:
                # Check if article matches this category
                if article['category'] in search_categories:
                    # Apply additional filters for specific categories
                    if self.matches_category_filter(article, prd_category):
                        category_articles.append(article)
            
            # Remove duplicates based on URL
            seen_urls = set()
            unique_articles = []
            for article in category_articles:
                if article['url'] not in seen_urls:
                    seen_urls.add(article['url'])
                    unique_articles.append(article)
            
            # Sort by published date (newest first) and limit
            unique_articles.sort(
                key=lambda x: x.get('published_date') or datetime.min,
                reverse=True
            )
            
            curated[prd_category] = unique_articles[:self.articles_per_category]
        
        return curated
    
    def matches_category_filter(self, article: Dict, prd_category: str) -> bool:
        """Apply specific filters for certain categories"""
        text_to_search = (
            article.get('title', '') + ' ' + 
            article.get('description', '')
        ).lower()
        
        # Country-specific filters
        if prd_category == "Portugal":
            return any(term in text_to_search for term in 
                      ['portugal', 'portuguese', 'lisbon', 'porto'])
        
        elif prd_category == "Spain":
            return any(term in text_to_search for term in 
                      ['spain', 'spanish', 'madrid', 'barcelona', 'españa'])
        
        elif prd_category == "Germany":
            return any(term in text_to_search for term in 
                      ['germany', 'german', 'berlin', 'munich', 'deutschland'])
        
        elif prd_category == "Japan":
            return any(term in text_to_search for term in 
                      ['japan', 'japanese', 'tokyo', 'nippon'])
        
        elif prd_category == "US Sports":
            # Filter for US sports
            return any(term in text_to_search for term in 
                      ['nfl', 'nba', 'mlb', 'football', 'basketball', 'baseball',
                       'touchdown', 'quarterback', 'lakers', 'yankees'])
        
        elif prd_category == "Expat/Immigration":
            return any(term in text_to_search for term in 
                      ['expat', 'immigration', 'visa', 'residence', 'emigrat',
                       'moving to', 'living in', 'relocat'])
        
        # Default: include all articles for this category
        return True
    
    def is_likely_paywalled(self, entry: Dict) -> bool:
        """
        Check if an article is likely behind a paywall
        This is a heuristic approach - not 100% accurate
        """
        indicators = [
            'subscriber', 'subscription', 'paywall', 'premium',
            'members only', 'exclusive content', 'sign up to read'
        ]
        
        text_to_check = (
            entry.get('title', '') + ' ' + 
            entry.get('summary', '')
        ).lower()
        
        return any(indicator in text_to_check for indicator in indicators)
    
    def clean_html(self, text: str) -> str:
        """Remove HTML tags from text"""
        if not text:
            return ""
        
        soup = BeautifulSoup(text, 'html.parser')
        return soup.get_text().strip()[:500]  # Limit to 500 chars
