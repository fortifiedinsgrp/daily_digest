import React, { useState, useEffect } from 'react';
import { articlesAPI } from '../services/api';

function ReadLater() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

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
  const filteredArticles = articles.filter(article => {
    return selectedCategory === 'all' || article.category === selectedCategory;
  });

  // Get unique categories
  const categories = articles.length > 0
    ? ['all', ...new Set(articles.map(a => a.category))]
    : ['all'];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading saved articles...</p>
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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent mb-2">
              Read Later
            </h1>
            <p className="text-gray-600 flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              {articles.length > 0 
                ? `${filteredArticles.length} saved article${filteredArticles.length !== 1 ? 's' : ''} to read`
                : "No saved articles yet"
              }
            </p>
          </div>
        </div>

        {/* Filter */}
        {articles.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200 flex items-center gap-4">
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
            <span className="ml-auto text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 mb-6 flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <p>{error}</p>
        </div>
      )}

      {/* Articles Grid */}
      {filteredArticles.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredArticles.map(article => (
            <div key={article.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 p-6 flex flex-col">
              {/* Article Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{getSourceIcon(article.source)}</span>
                  <span className="text-sm font-medium text-gray-600">{article.source}</span>
                </div>
                <button
                  onClick={() => removeArticle(article.id)}
                  className="text-red-500 hover:text-red-600 text-xl transition-transform hover:scale-110"
                  title="Remove from Read Later"
                >
                  ✕
                </button>
              </div>

              {/* Article Title */}
              <h3 className="flex-grow">
                <a 
                  href={article.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2"
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
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(article.category)}`}>
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
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
          <span className="text-6xl mb-4 block">📚</span>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No saved articles</h2>
          <p className="text-gray-600">
            Articles you save from your daily digest will appear here
          </p>
        </div>
      )}
    </div>
  );
}

export default ReadLater;