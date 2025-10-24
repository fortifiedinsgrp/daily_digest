"""
News curation service - fetches and processes articles from RSS feeds
"""
import feedparser
import requests
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Set
from bs4 import BeautifulSoup
from sqlalchemy.orm import Session
from app.models.models import Article, Digest
from app.services.news_sources import NEWS_SOURCES, CATEGORY_MAPPINGS
import hashlib
import re
from difflib import SequenceMatcher


class CurationService:
    """Service for curating news articles from configured sources"""
    
    def __init__(self, db: Session):
        self.db = db
        self.articles_per_category = 15  # Increased for better selection
        self.max_age_hours = 48  # Extended to 48 hours for more content
        self.min_description_length = 50  # Minimum description length
        self.similarity_threshold = 0.7  # For duplicate detection
    
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
                        'image_url': article_data.get('image_url'),
                        'quality_score': article_data.get('quality_score', 0)
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
            # Add timeout and user agent
            feed = feedparser.parse(
                feed_url,
                agent='The Daily Digest News Aggregator/1.0',
                timeout=10
            )
            
            cutoff_time = datetime.utcnow() - timedelta(hours=self.max_age_hours)
            
            for entry in feed.entries[:30]:  # Increased to 30 for better selection
                # Parse published date
                published_date = None
                if hasattr(entry, 'published_parsed') and entry.published_parsed:
                    published_date = datetime(*entry.published_parsed[:6])
                elif hasattr(entry, 'updated_parsed') and entry.updated_parsed:
                    published_date = datetime(*entry.updated_parsed[:6])
                else:
                    # If no date, assume it's recent
                    published_date = datetime.utcnow()
                
                # Skip very old articles
                if published_date and published_date < cutoff_time:
                    continue
                
                # Check for paywall indicators
                if self.is_likely_paywalled(entry):
                    continue
                
                # Clean and extract description
                description = self.extract_best_description(entry)
                
                article = {
                    'title': self.clean_title(entry.get('title', '')),
                    'url': entry.get('link', ''),
                    'source': source,
                    'category': category,
                    'description': description,
                    'published_date': published_date,
                    'author': self.extract_author(entry),
                    'guid': entry.get('id', entry.get('link', '')),
                    'quality_score': self.calculate_quality_score(entry, description)
                }
                
                # Extract image if available
                article['image_url'] = self.extract_image(entry)
                
                # Only add if meets quality threshold
                if article['quality_score'] > 0.3:
                    articles.append(article)
                
        except Exception as e:
            print(f"Error parsing feed {feed_url}: {e}")
        
        return articles
    
    def extract_best_description(self, entry) -> str:
        """Extract the best available description from an entry"""
        # Try multiple fields for description
        description = ''
        
        # Try summary first
        if hasattr(entry, 'summary') and entry.summary:
            description = entry.summary
        # Try content if available
        elif hasattr(entry, 'content') and entry.content:
            if isinstance(entry.content, list) and len(entry.content) > 0:
                description = entry.content[0].get('value', '')
            else:
                description = str(entry.content)
        # Try description field
        elif hasattr(entry, 'description') and entry.description:
            description = entry.description
        
        # Clean HTML and truncate if too long
        description = self.clean_html(description)
        if len(description) > 500:
            description = description[:497] + '...'
        
        return description
    
    def extract_author(self, entry) -> str:
        """Extract author information from entry"""
        if hasattr(entry, 'author') and entry.author:
            return entry.author
        elif hasattr(entry, 'author_detail') and hasattr(entry.author_detail, 'name'):
            return entry.author_detail.name
        elif hasattr(entry, 'dc_creator'):
            return entry.dc_creator
        return ''
    
    def extract_image(self, entry) -> str:
        """Extract image URL from entry"""
        # Try media content
        if hasattr(entry, 'media_content') and entry.media_content:
            for media in entry.media_content:
                if 'image' in media.get('type', '').lower():
                    return media.get('url', '')
        
        # Try media thumbnail
        if hasattr(entry, 'media_thumbnail') and entry.media_thumbnail:
            return entry.media_thumbnail[0].get('url', '')
        
        # Try enclosures
        if hasattr(entry, 'enclosures') and entry.enclosures:
            for enclosure in entry.enclosures:
                if 'image' in enclosure.get('type', '').lower():
                    return enclosure.get('href', '')
        
        # Try links
        if hasattr(entry, 'links'):
            for link in entry.links:
                if link.get('rel') == 'enclosure' and 'image' in link.get('type', '').lower():
                    return link.get('href', '')
        
        return ''
    
    def calculate_quality_score(self, entry, description: str) -> float:
        """Calculate a quality score for the article"""
        score = 0.0
        
        # Has substantial description
        if len(description) > self.min_description_length:
            score += 0.3
        if len(description) > 150:
            score += 0.2
        
        # Has author
        if self.extract_author(entry):
            score += 0.2
        
        # Has image
        if self.extract_image(entry):
            score += 0.1
        
        # Has proper date
        if hasattr(entry, 'published_parsed') and entry.published_parsed:
            score += 0.1
        
        # Title quality
        title = entry.get('title', '')
        if len(title) > 20 and len(title) < 200:
            score += 0.1
        
        return min(score, 1.0)
    
    def clean_title(self, title: str) -> str:
        """Clean and normalize article title"""
        # Remove extra whitespace
        title = ' '.join(title.split())
        # Remove common suffixes
        title = re.sub(r'\s*\|\s*.*$', '', title)  # Remove "| Source Name"
        title = re.sub(r'\s*-\s*[A-Z][a-z]+\s*\d{4}$', '', title)  # Remove "- Month Year"
        return title.strip()
    
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
            
            # Remove duplicates and near-duplicates
            unique_articles = self.remove_duplicates(category_articles)
            
            # Sort by quality score and recency
            unique_articles.sort(
                key=lambda x: (
                    x.get('quality_score', 0) * 0.7 +  # 70% weight on quality
                    (1.0 if x.get('published_date') and 
                     (datetime.utcnow() - x['published_date']).total_seconds() < 3600 * 6 
                     else 0.3) * 0.3  # 30% weight on recency (last 6 hours)
                ),
                reverse=True
            )
            
            # Take top N articles
            curated[prd_category] = unique_articles[:self.articles_per_category]
        
        return curated
    
    def remove_duplicates(self, articles: List[Dict]) -> List[Dict]:
        """Remove duplicate and near-duplicate articles"""
        if not articles:
            return []
        
        unique = []
        seen_titles = set()
        seen_urls = set()
        
        for article in articles:
            # Skip if exact URL match
            if article['url'] in seen_urls:
                continue
            
            # Check for similar titles
            is_duplicate = False
            article_title_lower = article['title'].lower()
            
            for seen_title in seen_titles:
                similarity = SequenceMatcher(None, article_title_lower, seen_title).ratio()
                if similarity > self.similarity_threshold:
                    is_duplicate = True
                    break
            
            if not is_duplicate:
                unique.append(article)
                seen_titles.add(article_title_lower)
                seen_urls.add(article['url'])
        
        return unique
    
    def matches_category_filter(self, article: Dict, category: str) -> bool:
        """Apply category-specific filters"""
        title_lower = article['title'].lower()
        desc_lower = (article.get('description') or '').lower()
        combined = title_lower + ' ' + desc_lower
        
        # Country-specific filters
        if category == "Portugal":
            keywords = ['portugal', 'portuguese', 'lisbon', 'porto', 'madeira', 'azores']
            return any(kw in combined for kw in keywords)
        
        elif category == "Spain":
            keywords = ['spain', 'spanish', 'madrid', 'barcelona', 'valencia', 'seville', 'españa']
            return any(kw in combined for kw in keywords)
        
        elif category == "Germany":
            keywords = ['germany', 'german', 'berlin', 'munich', 'frankfurt', 'hamburg', 'deutsch']
            return any(kw in combined for kw in keywords)
        
        elif category == "Japan":
            keywords = ['japan', 'japanese', 'tokyo', 'osaka', 'kyoto', 'nippon']
            return any(kw in combined for kw in keywords)
        
        elif category == "US to Europe Expat":
            keywords = ['expat', 'expatriate', 'immigration', 'visa', 'residency', 'moving to',
                       'relocat', 'american in', 'us citizen', 'tax', 'remote work']
            return any(kw in combined for kw in keywords)
        
        elif category == "Apple & Productivity AI":
            keywords = ['apple', 'mac', 'iphone', 'ipad', 'ios', 'macos', 'app store',
                       'productivity', 'notion', 'ai tool', 'chatgpt', 'claude', 'copilot',
                       'automation', 'workflow', 'artificial intelligence']
            return any(kw in combined for kw in keywords)
        
        # Sports require more specific matching
        elif category == "Soccer":
            keywords = ['soccer', 'football', 'premier league', 'la liga', 'bundesliga', 
                       'champions league', 'world cup', 'uefa', 'fifa']
            return any(kw in combined for kw in keywords)
        
        elif category == "US Football":
            keywords = ['nfl', 'football', 'touchdown', 'quarterback', 'super bowl',
                       'draft', 'yards', 'patriots', 'cowboys', 'chiefs', 'bills']
            # Exclude soccer/international football
            exclude = ['soccer', 'premier', 'uefa', 'fifa']
            return any(kw in combined for kw in keywords) and not any(ex in combined for ex in exclude)
        
        elif category == "US Basketball":
            keywords = ['nba', 'basketball', 'lakers', 'celtics', 'warriors', 'lebron',
                       'three-pointer', 'dunk', 'playoffs', 'finals']
            return any(kw in combined for kw in keywords)
        
        elif category == "US Baseball":
            keywords = ['mlb', 'baseball', 'yankees', 'dodgers', 'world series', 
                       'home run', 'pitcher', 'batting', 'innings']
            return any(kw in combined for kw in keywords)
        
        # Default categories don't need additional filtering
        return True
    
    def is_likely_paywalled(self, entry) -> bool:
        """Check if an article is likely behind a paywall"""
        indicators = [
            'subscriber', 'subscription', 'paywall', 'premium',
            'exclusive', 'members only', 'sign up to read',
            'limited access', 'register to continue'
        ]
        
        title = entry.get('title', '').lower()
        summary = entry.get('summary', '').lower()
        
        # Check for paywall indicators
        for indicator in indicators:
            if indicator in title or indicator in summary:
                return True
        
        # Check for truncated content (often indicates paywall)
        if summary and len(summary) < 100 and summary.endswith('...'):
            return True
        
        return False
    
    def clean_html(self, text: str) -> str:
        """Remove HTML tags and clean text"""
        if not text:
            return ""
        
        # Parse with BeautifulSoup
        soup = BeautifulSoup(text, 'html.parser')
        
        # Remove script and style elements
        for script in soup(['script', 'style']):
            script.decompose()
        
        # Get text
        text = soup.get_text()
        
        # Clean up whitespace
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = ' '.join(chunk for chunk in chunks if chunk)
        
        return text