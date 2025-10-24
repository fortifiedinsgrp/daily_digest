import React, { useState, useEffect } from 'react';
import { digestsAPI, articlesAPI } from '../services/api';
import ArticleCard from '../components/ArticleCard';
import { 
  NewspaperIcon, 
  ArrowPathIcon, 
  FunnelIcon,
  SparklesIcon,
  GlobeAltIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

function Home() {
  const [digest, setDigest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedArticles, setSavedArticles] = useState(new Set());
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTodaysDigest();
    fetchSavedArticles();
  }, []);

  const fetchTodaysDigest = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await digestsAPI.getLatestDigest('morning');
      setDigest(response.data);
    } catch (error) {
      console.error('Error fetching digest:', error);
      if (error.response && error.response.status === 404) {
        setError("Your digest is being created! This may take a minute. Please refresh the page shortly.");
      } else {
        setError('Failed to load today\'s digest. Please try refreshing.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedArticles = async () => {
    try {
      const response = await articlesAPI.getSavedArticles();
      const savedIds = new Set(response.data.map(article => article.id));
      setSavedArticles(savedIds);
    } catch (error) {
      console.error('Error fetching saved articles:', error);
    }
  };

  const createNewDigest = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const currentHour = new Date().getHours();
      const edition = currentHour < 12 ? 'morning' : 'evening';
      
      await digestsAPI.createDigest(edition);
      // Show message to user
      setError("Your new digest is being created! This may take a minute. The page will refresh automatically.");
      
      // Poll for the new digest
      const pollInterval = setInterval(async () => {
        try {
          const response = await digestsAPI.getLatestDigest(edition);
          if (response.data && response.data.articles && response.data.articles.length > 0) {
            setDigest(response.data);
            setError(null);
            clearInterval(pollInterval);
            setRefreshing(false);
          }
        } catch (err) {
          // Still creating, keep polling
        }
      }, 5000); // Check every 5 seconds

      // Stop polling after 2 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        setRefreshing(false);
        if (!digest || !digest.articles || digest.articles.length === 0) {
          setError("Digest creation is taking longer than expected. Please refresh the page manually.");
        }
      }, 120000);
    } catch (error) {
      console.error('Error creating digest:', error);
      setError('Failed to create new digest. Please try again.');
      setRefreshing(false);
    }
  };

  const toggleSaveArticle = async (articleId) => {
    try {
      if (savedArticles.has(articleId)) {
        await articlesAPI.unsaveArticle(articleId);
        setSavedArticles(prev => {
          const newSet = new Set(prev);
          newSet.delete(articleId);
          return newSet;
        });
      } else {
        await articlesAPI.saveArticle(articleId);
        setSavedArticles(prev => new Set([...prev, articleId]));
      }
    } catch (error) {
      console.error('Error toggling save status:', error);
    }
  };

  // Get unique categories and sources
  const categories = digest?.articles 
    ? ['all', ...new Set(digest.articles.map(a => a.category))]
    : ['all'];
  
  const sources = digest?.articles
    ? ['all', ...new Set(digest.articles.map(a => a.source))]
    : ['all'];

  // Filter articles
  const filteredArticles = digest?.articles?.filter(article => {
    const categoryMatch = selectedCategory === 'all' || article.category === selectedCategory;
    const sourceMatch = selectedSource === 'all' || article.source === selectedSource;
    return categoryMatch && sourceMatch;
  }) || [];

  // Group articles by category for display
  const groupedArticles = filteredArticles.reduce((acc, article) => {
    const category = article.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(article);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="inline-flex items-center space-x-2">
            <ArrowPathIcon className="h-8 w-8 text-blue-600 animate-spin" />
            <span className="text-lg text-gray-600">Loading your digest...</span>
          </div>
        </div>
        {/* Skeleton loaders */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-48 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {digest ? "Today's Digest" : "Welcome to The Daily Digest"}
            </h1>
            <p className="text-lg text-gray-600">
              {digest 
                ? `${new Date(digest.created_at).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })} • ${digest.edition === 'morning' ? 'Morning' : 'Evening'} Edition`
                : "Your personalized news, curated twice daily"
              }
            </p>
          </div>
          <button
            onClick={createNewDigest}
            disabled={refreshing}
            className={`btn-primary flex items-center space-x-2 ${
              refreshing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {refreshing ? (
              <>
                <ArrowPathIcon className="h-5 w-5 animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <SparklesIcon className="h-5 w-5" />
                <span>{digest ? 'Refresh Digest' : 'Create Your First Digest'}</span>
              </>
            )}
          </button>
        </div>

        {/* Filters */}
        {digest && digest.articles && digest.articles.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center space-x-4">
              <FunnelIcon className="h-5 w-5 text-gray-500" />
              
              {/* Category Filter */}
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="appearance-none bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  {categories.filter(c => c !== 'all').map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <ChevronDownIcon className="absolute right-2 top-3 h-4 w-4 text-gray-500 pointer-events-none" />
              </div>

              {/* Source Filter */}
              <div className="relative">
                <select
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="appearance-none bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Sources</option>
                  {sources.filter(s => s !== 'all').map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
                <ChevronDownIcon className="absolute right-2 top-3 h-4 w-4 text-gray-500 pointer-events-none" />
              </div>

              {/* Results count */}
              <div className="ml-auto text-sm text-gray-600">
                {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className={`rounded-lg p-4 mb-6 ${
          error.includes('being created') 
            ? 'bg-blue-50 border border-blue-200 text-blue-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center">
            {error.includes('being created') ? (
              <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <GlobeAltIcon className="h-5 w-5 mr-2" />
            )}
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Articles Grid */}
      {digest && digest.articles && digest.articles.length > 0 ? (
        selectedCategory === 'all' && selectedSource === 'all' ? (
          // Show articles grouped by category
          <div className="space-y-8">
            {Object.entries(groupedArticles).map(([category, articles]) => (
              <div key={category}>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">{category}</span>
                  <span className="text-sm font-normal text-gray-500">
                    ({articles.length} article{articles.length !== 1 ? 's' : ''})
                  </span>
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {articles.map(article => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      onToggleSave={toggleSaveArticle}
                      isSaved={savedArticles.has(article.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Show filtered articles in a grid
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredArticles.map(article => (
              <ArticleCard
                key={article.id}
                article={article}
                onToggleSave={toggleSaveArticle}
                isSaved={savedArticles.has(article.id)}
              />
            ))}
          </div>
        )
      ) : (
        !error && !loading && (
          <div className="text-center py-12">
            <NewspaperIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No digest yet</h2>
            <p className="text-gray-600 mb-6">
              Click the button above to create your first personalized news digest
            </p>
          </div>
        )
      )}
    </div>
  );
}

export default Home;