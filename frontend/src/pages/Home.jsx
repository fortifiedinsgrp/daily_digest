import React from 'react';

const Home = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Daily Digests</h1>
        <p className="text-gray-600">
          Curated news delivered twice daily at 6 AM and 6 PM Eastern Time
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          🎉 Authentication System Complete!
        </h2>
        <p className="text-gray-600 mb-4">
          Your account system is working. Next steps:
        </p>
        <ul className="text-left text-gray-600 space-y-2 max-w-md mx-auto">
          <li>✅ Backend API deployed and running</li>
          <li>✅ User registration and login working</li>
          <li>✅ Database connected to Supabase</li>
          <li>✅ Frontend deployed to Netlify</li>
          <li>🔄 News curation service (next step)</li>
          <li>🔄 Article display and bookmarking (next step)</li>
        </ul>
      </div>
    </div>
  );
};

export default Home;
