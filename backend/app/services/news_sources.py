"""
News sources configuration and RSS feeds
Based on research.md - 6 curated international news sources
"""

NEWS_SOURCES = {
    "BBC News": {
        "name": "BBC News",
        "base_url": "https://www.bbc.com",
        "specialization": "Global news leader with comprehensive international coverage",
        "categories": {
            "international": "http://feeds.bbci.co.uk/news/world/rss.xml",
            "technology": "http://feeds.bbci.co.uk/news/technology/rss.xml",
            "europe": "http://feeds.bbci.co.uk/news/world/europe/rss.xml",
        }
    },
    "Reuters": {
        "name": "Reuters",
        "base_url": "https://www.reuters.com",
        "specialization": "Breaking news and financial markets",
        "categories": {
            "international": "https://www.reutersagency.com/feed/?best-topics=international",
            "technology": "https://www.reutersagency.com/feed/?best-topics=tech",
            "business": "https://www.reutersagency.com/feed/?best-topics=business-finance",
        }
    },
    "Associated Press": {
        "name": "Associated Press",
        "base_url": "https://apnews.com",
        "specialization": "Fact-based, unbiased reporting",
        "categories": {
            "international": "https://apnews.com/apf-intlnews/feed",
            "technology": "https://apnews.com/apf-technology/feed",
            "sports": "https://apnews.com/apf-sports/feed",
            "soccer": "https://apnews.com/apf-soccer/feed",
        }
    },
    "France 24": {
        "name": "France 24",
        "base_url": "https://www.france24.com",
        "specialization": "European and international perspective",
        "categories": {
            "international": "https://www.france24.com/en/rss",
            "europe": "https://www.france24.com/en/europe/rss",
            "technology": "https://www.france24.com/en/technology/rss",
        }
    },
    "DW (Deutsche Welle)": {
        "name": "DW",
        "base_url": "https://www.dw.com",
        "specialization": "German and European news",
        "categories": {
            "international": "https://rss.dw.com/rdf/rss-en-all",
            "europe": "https://rss.dw.com/rdf/rss-en-eu",
            "germany": "https://rss.dw.com/rdf/rss-en-ger",
        }
    },
    "elDiario.es": {
        "name": "elDiario.es",
        "base_url": "https://www.eldiario.es",
        "specialization": "Spanish independent journalism",
        "categories": {
            "spain": "https://www.eldiario.es/rss/",
            "international": "https://www.eldiario.es/internacional/rss",
            "technology": "https://www.eldiario.es/tecnologia/rss",
        }
    }
}

# Category mappings for the PRD requirements
CATEGORY_MAPPINGS = {
    "International News": ["international"],
    "Portugal": ["portugal", "europe"],  # Will filter for Portugal mentions
    "Spain": ["spain", "europe"],  # Will filter for Spain mentions
    "Germany": ["germany", "europe"],  # Will filter for Germany mentions
    "Japan": ["japan", "international"],  # Will filter for Japan mentions
    "Technology": ["technology", "tech"],
    "Soccer": ["soccer", "football"],
    "US Sports": ["sports"],  # Will filter for US Football, Basketball, Baseball
    "Expat/Immigration": ["europe", "international"]  # Will filter for expat content
}
