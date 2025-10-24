import React, { useState, useEffect } from 'react';
import { digestsAPI, articlesAPI } from '../services/api';

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
        setError("No digest available yet. Click 'Create Digest' to generate one.");
      } else {
        setError('Failed to load digest. Please try again.');
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
      setError("✨ Digest is being created! This may take 1-2 minutes. Please refresh the page.");
      
      setTimeout(() => {
        fetchTodaysDigest();
        setRefreshing(false);
      }, 10000);
    } catch (error) {
      console.error('Error creating digest:', error);
      setError('Failed to create digest. Please try again.');
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

  const getCategoryColor = (category) => {
    const colors = {
      'International': 'bg-purple-100 text-purple-800',
      'Portugal': 'bg-green-100 text-green-800',
      'Spain': 'bg-yellow-100 text-yellow-800',
      'Germany': 'bg-gray-200 text-gray-800',
      'Japan': 'bg-red-100 text-red-800',
      'Technology': 'bg-blue-100 text-blue-800',
      'Apple & Productivity AI': 'bg-indigo-100 text-indigo-800',
      'Soccer': 'bg-emerald-100 text-emerald-800',
      'US Football': 'bg-orange-100 text-orange-800',
      'US Basketball': 'bg-amber-100 text-amber-800',
      'US Baseball': 'bg-teal-100 text-teal-800',
      'US to Europe Expat': 'bg-pink-100 text-pink-800',
      'Uncategorized': 'bg-gray-100 text-gray-600'
    };
    return colors[category] || colors['Uncategorized'];
  };

  const getSourceIcon = (source) => {
    const icons = {
      'BBC': '🇬🇧',
      'Reuters': '📰',
      'AP': '🗞️',
      'France 24': '🇫🇷',
      'DW': '🇩🇪',
      'elDiario.es': '🇪🇸',
      'Ars Technica': '💻',
      '9to5Mac': '🍎'
    };
    return icons[source] || '📄';
  };

  // Filter articles
  const filteredArticles = digest?.articles?.filter(article => {
    const categoryMatch = selectedCategory === 'all' || article.category === selectedCategory;
    const sourceMatch = selectedSource === 'all' || article.source === selectedSource;
    return categoryMatch && sourceMatch;
  }) || [];

  // Get unique categories and sources
  const categories = digest?.articles 
    ? ['all', ...new Set(digest.articles.map(a => a.category))]
    : ['all'];
  
  const sources = digest?.articles
    ? ['all', ...new Set(digest.articles.map(a => a.source))]
    : ['all'];

  // Group articles by category
  const groupedArticles = filteredArticles.reduce((acc, article) => {
    const category = article.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(article);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading your digest...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              {digest ? "Today's Digest" : "The Daily Digest"}
            </h1>
            {digest && (
              <p className="text-gray-600 flex items-center gap-2">
                <span className="text-2xl">📅</span>
                {new Date(digest.created_at).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
                <span className="mx-2">•</span>
                <span className="text-2xl">{digest.edition === 'morning' ? '☀️' : '🌙'}</span>
                {digest.edition === 'morning' ? 'Morning' : 'Evening'} Edition
              </p>
            )}
          </div>
          <button
            onClick={createNewDigest}
            disabled={refreshing}
            className="btn-primary flex items-center gap-2"
          >
            <span className="text-xl">{refreshing ? '⏳' : '✨'}</span>
            {refreshing ? 'Creating...' : (digest ? 'Refresh' : 'Create Digest')}
          </button>
        </div>

        {/* Filters */}
        {digest && digest.articles && digest.articles.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200 flex flex-wrap gap-4 items-center">
            <span className="text-sm font-semibold text-gray-700">Filter:</span>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">📚 All Categories</option>
              {categories.filter(c => c !== 'all').map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">🌐 All Sources</option>
              {sources.filter(s => s !== 'all').map(source => (
                <option key={source} value={source}>
                  {getSourceIcon(source)} {source}
                </option>
              ))}
            </select>

            <span className="ml-auto text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className={`rounded-xl p-4 mb-6 flex items-start gap-3 ${
          error.includes('being created') 
            ? 'bg-blue-50 border border-blue-200 text-blue-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <span className="text-xl">{error.includes('being created') ? '⏳' : '⚠️'}</span>
          <p>{error}</p>
        </div>
      )}

      {/* Articles Grid */}
      {digest && digest.articles && digest.articles.length > 0 ? (
        selectedCategory === 'all' && selectedSource === 'all' ? (
          // Show articles grouped by category
          <div className="space-y-8">
            {Object.entries(groupedArticles).map(([category, articles]) => (
              <div key={category}>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">{category}</h2>
                  <span className={`category-pill ${getCategoryColor(category)}`}>
                    {articles.length} article{articles.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {articles.map(article => (
                    <div key={article.id} className="card p-6 flex flex-col">
                      {/* Article Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{getSourceIcon(article.source)}</span>
                          <span className="text-sm font-medium text-gray-600">{article.source}</span>
                        </div>
                        <button
                          onClick={() => toggleSaveArticle(article.id)}
                          className={`text-2xl transition-transform hover:scale-110 ${
                            savedArticles.has(article.id) 
                              ? 'text-yellow-500' 
                              : 'text-gray-300 hover:text-yellow-500'
                          }`}
                          title={savedArticles.has(article.id) ? 'Remove from Read Later' : 'Save for Later'}
                        >
                          {savedArticles.has(article.id) ? '⭐' : '☆'}
                        </button>
                      </div>

                      {/* Article Title */}
                      <h3 className="flex-grow">
                        <a 
                          href={article.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="article-title"
                        >
                          {article.title}
                        </a>
                      </h3>

                      {/* Article Description */}
                      {article.description && (
                        <p className="text-gray-600 text-sm mt-2 mb-4 line-clamp-3">
                          {article.description}
                        </p>
                      )}

                      {/* Article Footer */}
                      <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-100">
                        <span className={`category-pill text-xs ${getCategoryColor(article.category)}`}>
                          {article.category}
                        </span>
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1 hover:gap-2 transition-all"
                        >
                          Read
                          <span>→</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Show filtered articles in a grid
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredArticles.map(article => (
              <div key={article.id} className="card p-6 flex flex-col">
                {/* Article Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getSourceIcon(article.source)}</span>
                    <span className="text-sm font-medium text-gray-600">{article.source}</span>
                  </div>
                  <button
                    onClick={() => toggleSaveArticle(article.id)}
                    className={`text-2xl transition-transform hover:scale-110 ${
                      savedArticles.has(article.id) 
                        ? 'text-yellow-500' 
                        : 'text-gray-300 hover:text-yellow-500'
                    }`}
                    title={savedArticles.has(article.id) ? 'Remove from Read Later' : 'Save for Later'}
                  >
                    {savedArticles.has(article.id) ? '⭐' : '☆'}
                  </button>
                </div>

                {/* Article Title */}
                <h3 className="flex-grow">
                  <a 
                    href={article.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="article-title"
                  >
                    {article.title}
                  </a>
                </h3>

                {/* Article Description */}
                {article.description && (
                  <p className="text-gray-600 text-sm mt-2 mb-4 line-clamp-3">
                    {article.description}
                  </p>
                )}

                {/* Article Footer */}
                <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-100">
                  <span className={`category-pill text-xs ${getCategoryColor(article.category)}`}>
                    {article.category}
                  </span>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1 hover:gap-2 transition-all"
                  >
                    Read
                    <span>→</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        !error && !loading && (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
            <span className="text-6xl mb-4 block">📰</span>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No digest yet</h2>
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