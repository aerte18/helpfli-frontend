import { apiUrl } from "@/lib/apiUrl";
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    const category = searchParams.get('category') || '';
    setSelectedCategory(category);
    fetchPosts(category);
    fetchCategories();
  }, [searchParams]);

  const fetchPosts = async (category = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      params.append('limit', '9');
      params.append('page', searchParams.get('page') || '1');
      
      const res = await fetch(apiUrl(`/api/blog?${params}`));
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching blog posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(apiUrl(`/api/blog/categories/list`));
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleCategoryChange = (category) => {
    const newParams = new URLSearchParams();
    if (category) newParams.set('category', category);
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handlePageChange = (page) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', page);
    setSearchParams(newParams);
  };

  if (loading && !posts.length) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">Ładowanie...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Blog Helpfli</h1>
          <p className="text-xl text-gray-600">Porady, case studies i najnowsze informacje</p>
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => handleCategoryChange('')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                !selectedCategory
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Wszystkie
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-4 py-2 rounded-lg transition-colors capitalize ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Posts Grid */}
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {posts.map((post) => (
              <Link
                key={post._id}
                to={`/blog/${post.slug}`}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                {post.featuredImage && (
                  <img
                    src={post.featuredImage}
                    alt={post.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-indigo-600 uppercase">
                      {post.category}
                    </span>
                    {post.readingTime && (
                      <span className="text-xs text-gray-500">
                        {post.readingTime} min czytania
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                    {post.title}
                  </h2>
                  <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {new Date(post.publishedAt).toLocaleDateString('pl-PL')}
                    </span>
                    {post.views > 0 && (
                      <span className="text-sm text-gray-500">{post.views} wyświetleń</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">Brak postów w tej kategorii.</p>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center gap-2">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  pagination.page === page
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}










