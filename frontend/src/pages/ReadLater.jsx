import React, { useState, useEffect } from 'react';
import { articlesAPI } from '../services/api';
import ArticleCard from '../components/ArticleCard';
import { 
  BookmarkIcon, 
  ArrowPathIcon,
  FunnelIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

function ReadLater() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');

  useEffect(() => {
    fetchSavedArticles();
  }, []);

  const fetchSavedArticles = async () => {
    try {
      setLoading(true);
      const response = await articlesAPI.getSavedArticles();
      setArticles(response.data);
    } catch (error) {
      console.error('Error fetching saved articles:', error);
      setError('Failed to load saved articles');
    } finally {
      setLoading(false);
    }
  };

  const removeArticle = async (articleId) => {
    try {
      await articlesAPI.unsaveArticle(articleId);
      setArticles(prev => prev.filter(article => article.id !== articleId));
    } catch (error) {
      console.error('Error removing article:', error);
    }
  };

  // Get unique categories and sources
  const categories = articles.length > 0
    ? ['all', ...new Set(articles.map(a => a.category))]
    : ['all'];
  
  const sources = articles.length > 0
    ? ['all', ...new Set(articles.map(a => a.source))]
    : ['all'];

  // Filter articles
  const filteredArticles = articles.filter(article => {
    const categoryMatch = selectedCategory === 'all' || article.category === selectedCategory;
    const sourceMatch = selectedSource === 'all' || article.source === selectedSource;
    return categoryMatch && sourceMatch;
  });

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
            <span className="text-lg text-gray-600">Loading saved articles...</span>
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
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Read Later</h1>
            <p className="text-lg text-gray-600">
              {articles.length > 0 
                ? `${filteredArticles.length} saved article${filteredArticles.length !== 1 ? 's' : ''} to read`
                : "Save articles to read them later"
              }
            </p>
          </div>
        </div>

        {/* Filters */}
        {articles.length > 0 && (
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
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
          <p>{error}</p>
        </div>
      )}

      {/* Articles Grid */}
      {filteredArticles.length > 0 ? (
        selectedCategory === 'all' && selectedSource === 'all' ? (
          // Show articles grouped by category
          <div className="space-y-8">
            {Object.entries(groupedArticles).map(([category, categoryArticles]) => (
              <div key={category}>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">{category}</span>
                  <span className="text-sm font-normal text-gray-500">
                    ({categoryArticles.length} article{categoryArticles.length !== 1 ? 's' : ''})
                  </span>
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {categoryArticles.map(article => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      onToggleSave={removeArticle}
                      isSaved={true}
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
                onToggleSave={removeArticle}
                isSaved={true}
              />
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-12">
          <BookmarkIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">No saved articles</h2>
          <p className="text-gray-600">
            Articles you save from your daily digest will appear here
          </p>
        </div>
      )}
    </div>
  );
}

export default ReadLater;