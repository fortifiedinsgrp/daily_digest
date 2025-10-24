import React, { useState, useEffect } from 'react';
import { digestsAPI, articlesAPI } from '../services/api';

function Home() {
  const [digest, setDigest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedArticles, setSavedArticles] = useState(new Set());
  const [selectedCategory, setSelectedCategory] = useState('all');
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
      setError("Digest is being created! This may take 1-2 minutes. Please refresh the page.");
      
      // Poll for the new digest
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

  // Filter articles by category
  const filteredArticles = digest?.articles?.filter(article => {
    return selectedCategory === 'all' || article.category === selectedCategory;
  }) || [];

  // Get unique categories
  const categories = digest?.articles 
    ? ['all', ...new Set(digest.articles.map(a => a.category))]
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
        <div className="text-center">
          <div className="text-lg text-gray-600">Loading your digest...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900">
            {digest ? "Today's Digest" : "The Daily Digest"}
          </h1>
          <button
            onClick={createNewDigest}
            disabled={refreshing}
            className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ${
              refreshing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {refreshing ? 'Creating...' : (digest ? 'Refresh Digest' : 'Create Digest')}
          </button>
        </div>

        {digest && (
          <p className="text-gray-600">
            {new Date(digest.created_at).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })} • {digest.edition === 'morning' ? 'Morning' : 'Evening'} Edition
          </p>
        )}
      </div>

      {/* Category Filter */}
      {digest && digest.articles && digest.articles.length > 0 && (
        <div className="mb-6">
          <label className="mr-2 text-sm font-medium text-gray-700">Filter by category:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>
          <span className="ml-4 text-sm text-gray-600">
            {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className={`p-4 mb-6 rounded-lg ${
          error.includes('being created') 
            ? 'bg-blue-50 border border-blue-200 text-blue-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {error}
        </div>
      )}

      {/* Articles */}
      {digest && digest.articles && digest.articles.length > 0 ? (
        selectedCategory === 'all' ? (
          // Show articles grouped by category
          <div className="space-y-8">
            {Object.entries(groupedArticles).map(([category, articles]) => (
              <div key={category}>
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {category} ({articles.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {articles.map(article => (
                    <div key={article.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-sm font-medium text-gray-500">{article.source}</span>
                        <button
                          onClick={() => toggleSaveArticle(article.id)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          {savedArticles.has(article.id) ? '★' : '☆'}
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
              </div>
            ))}
          </div>
        ) : (
          // Show filtered articles in a grid
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredArticles.map(article => (
              <div key={article.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-sm font-medium text-gray-500">{article.source}</span>
                  <button
                    onClick={() => toggleSaveArticle(article.id)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    {savedArticles.has(article.id) ? '★' : '☆'}
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
        )
      ) : (
        !error && !loading && (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No digest yet</h2>
            <p className="text-gray-600">
              Click the button above to create your first news digest
            </p>
          </div>
        )
      )}
    </div>
  );
}

export default Home;