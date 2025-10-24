import React, { useState, useEffect } from 'react';
import { articlesAPI } from '../services/api';

function ReadLater() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-lg text-gray-600">Loading saved articles...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Read Later</h1>
        <p className="text-gray-600">
          {articles.length > 0 
            ? `${articles.length} saved article${articles.length !== 1 ? 's' : ''}`
            : "No saved articles yet"
          }
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
          {error}
        </div>
      )}

      {/* Articles Grid */}
      {articles.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {articles.map(article => (
            <div key={article.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm font-medium text-gray-500">{article.source}</span>
                <button
                  onClick={() => removeArticle(article.id)}
                  className="text-red-600 hover:text-red-700"
                  title="Remove from Read Later"
                >
                  ✕
                </button>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                <a 
                  href={article.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-blue-600"
                >
                  {article.title}
                </a>
              </h3>
              {article.description && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                  {article.description}
                </p>
              )}
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>{article.category}</span>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700"
                >
                  Read →
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No saved articles</h2>
          <p className="text-gray-600">
            Articles you save from your daily digest will appear here
          </p>
        </div>
      )}
    </div>
  );
}

export default ReadLater;