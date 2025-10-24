import React, { useState, useEffect } from 'react';
import { articlesAPI } from '../services/api';

const ReadLater = () => {
  const [savedArticles, setSavedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSavedArticles();
  }, []);

  const fetchSavedArticles = async () => {
    try {
      setLoading(true);
      const response = await articlesAPI.getSavedArticles();
      setSavedArticles(response.data);
    } catch (error) {
      console.error('Error fetching saved articles:', error);
      setError('Failed to load saved articles');
    } finally {
      setLoading(false);
    }
  };

  const removeSavedArticle = async (articleId) => {
    try {
      await articlesAPI.unsaveArticle(articleId);
      setSavedArticles(prev => prev.filter(article => article.id !== articleId));
    } catch (error) {
      console.error('Error removing saved article:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Read Later</h1>
        <p className="text-gray-600">
          {savedArticles.length} saved article{savedArticles.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Saved Articles */}
      {error ? (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-red-600">{error}</p>
        </div>
      ) : savedArticles.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="space-y-4">
            {savedArticles.map((article) => (
              <SavedArticleCard
                key={article.id}
                article={article}
                onRemove={removeSavedArticle}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No saved articles yet</h2>
          <p className="text-gray-600">
            Articles you save for later reading will appear here.
          </p>
        </div>
      )}
    </div>
  );
};

const SavedArticleCard = ({ article, onRemove }) => {
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    setRemoving(true);
    await onRemove(article.id);
    setRemoving(false);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 transition-colors"
            >
              {article.title}
            </a>
          </h3>
          <div className="flex items-center text-sm text-gray-600 mb-2 space-x-2">
            <span>{article.source}</span>
            <span>•</span>
            <span>{article.category}</span>
            <span>•</span>
            <span>
              Saved {new Date(article.saved_at).toLocaleDateString()}
            </span>
          </div>
          {article.description && (
            <p className="text-gray-700 text-sm line-clamp-3">
              {article.description}
            </p>
          )}
        </div>
        <button
          onClick={handleRemove}
          disabled={removing}
          className={`ml-4 p-2 rounded-full text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors ${
            removing ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          title="Remove from Read Later"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ReadLater;
