import React, { useState, useEffect } from 'react';
import { digestsAPI, articlesAPI } from '../services/api';

const Home = () => {
  const [digest, setDigest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTodaysDigest();
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
        setError("Your first digest is being created! Please refresh in a minute.");
      } else {
        setError('Failed to load today\'s digest. Please try refreshing.');
      }
    } finally {
      setLoading(false);
    }
  };

  const createNewDigest = async () => {
    try {
      setLoading(true);
      setError(null);
      const currentHour = new Date().getHours();
      const edition = currentHour < 12 ? 'morning' : 'evening';
      
      const response = await digestsAPI.createDigest(edition);
      // Give the background task a moment to start
      setTimeout(() => {
        fetchTodaysDigest();
      }, 5000); // 5-second delay before refetching
      // Optionally, show the message from the backend
      // alert(response.data.message);

    } catch (error) {
      console.error('Error creating digest:', error);
      setError('Failed to create new digest');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Welcome to The Daily Digest!</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={createNewDigest}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Create Your First Digest
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {digest?.edition === 'morning' ? '🌅 Morning' : '🌆 Evening'} Digest
            </h1>
            <p className="text-gray-600">
              {new Date(digest?.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <button
            onClick={createNewDigest}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            Refresh Digest
          </button>
        </div>
      </div>

      {/* Articles by Category */}
      {digest?.articles_by_category && Object.keys(digest.articles_by_category).length > 0 ? (
        Object.entries(digest.articles_by_category).map(([category, articles]) => (
          <div key={category} className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">
              {category}
            </h2>
            <div className="space-y-4">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            No articles found
          </h2>
          <p className="text-gray-600 mb-6">
            It looks like there are no articles in today's digest yet.
          </p>
          <button
            onClick={createNewDigest}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Create Today's Digest
          </button>
        </div>
      )}
    </div>
  );
};

const ArticleCard = ({ article }) => {
  const [saved, setSaved] = useState(article.is_saved);
  const [saving, setSaving] = useState(false);

  const toggleSaved = async () => {
    try {
      setSaving(true);
      if (saved) {
        await articlesAPI.unsaveArticle(article.id);
        setSaved(false);
      } else {
        await articlesAPI.saveArticle(article.id);
        setSaved(true);
      }
    } catch (error) {
      console.error('Error toggling save:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
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
          <p className="text-sm text-gray-600 mb-2">
            {article.source} • {new Date(article.published_date).toLocaleDateString()}
          </p>
          {article.description && (
            <p className="text-gray-700 text-sm line-clamp-2">
              {article.description}
            </p>
          )}
        </div>
        <button
          onClick={toggleSaved}
          disabled={saving}
          className={`ml-4 p-2 rounded-full transition-colors ${
            saved
              ? 'text-blue-600 hover:bg-blue-50'
              : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
          } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={saved ? 'Remove from Read Later' : 'Save for Later'}
        >
          <svg className="w-5 h-5" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Home;
