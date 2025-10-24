import { BookmarkIcon, ArrowTopRightOnSquareIcon, CalendarIcon, TagIcon } from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { formatDistanceToNow } from 'date-fns';

function ArticleCard({ article, onToggleSave, isSaved }) {
  const getCategoryColor = (category) => {
    const colors = {
      'International': 'bg-purple-100 text-purple-800',
      'Portugal': 'bg-green-100 text-green-800',
      'Spain': 'bg-yellow-100 text-yellow-800',
      'Germany': 'bg-gray-700 text-white',
      'Japan': 'bg-red-100 text-red-800',
      'Technology': 'bg-blue-100 text-blue-800',
      'Apple & Productivity AI': 'bg-indigo-100 text-indigo-800',
      'Soccer': 'bg-emerald-100 text-emerald-800',
      'US Football': 'bg-orange-100 text-orange-800',
      'US Basketball': 'bg-amber-100 text-amber-800',
      'US Baseball': 'bg-teal-100 text-teal-800',
      'US to Europe Expat': 'bg-pink-100 text-pink-800',
      'Uncategorized': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors['Uncategorized'];
  };

  const getSourceLogo = (source) => {
    const logos = {
      'BBC': '🇬🇧',
      'Reuters': '📰',
      'AP': '🗞️',
      'France 24': '🇫🇷',
      'DW': '🇩🇪',
      'elDiario.es': '🇪🇸',
      'Ars Technica': '💻',
      '9to5Mac': '🍎'
    };
    return logos[source] || '📄';
  };

  const timeAgo = article.published_at 
    ? formatDistanceToNow(new Date(article.published_at), { addSuffix: true })
    : 'Recently';

  return (
    <article className="article-card group">
      <div className="p-6">
        {/* Header with source and category */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getSourceLogo(article.source)}</span>
            <div>
              <span className="source-badge">{article.source}</span>
              <span className={`category-badge ml-2 ${getCategoryColor(article.category)}`}>
                {article.category}
              </span>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              onToggleSave(article.id);
            }}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label={isSaved ? 'Remove from Read Later' : 'Save for Later'}
          >
            {isSaved ? (
              <BookmarkSolidIcon className="h-5 w-5 text-blue-600" />
            ) : (
              <BookmarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            )}
          </button>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
          <a 
            href={article.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:underline"
          >
            {article.title}
          </a>
        </h3>

        {/* Description */}
        {article.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {article.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <CalendarIcon className="h-3 w-3 mr-1" />
              {timeAgo}
            </span>
            {article.author && (
              <span className="truncate max-w-[150px]">
                By {article.author}
              </span>
            )}
          </div>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-blue-600 hover:text-blue-700 font-medium"
          >
            Read
            <ArrowTopRightOnSquareIcon className="h-3 w-3 ml-1" />
          </a>
        </div>
      </div>
    </article>
  );
}

export default ArticleCard;
