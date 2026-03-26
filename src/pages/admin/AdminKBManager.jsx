import { apiUrl } from "@/lib/apiUrl";
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, Filter, Eye, EyeOff } from 'lucide-react';

export default function AdminKBManager() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    tags: '',
    isActive: true,
    priority: 1
  });

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const response = await fetch(apiUrl('/api/kb/articles'));
      if (response.ok) {
        const data = await response.json();
        setArticles(data);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingArticle ? `/api/kb/articles/${editingArticle._id}` : '/api/kb/articles';
      const method = editingArticle ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        }),
      });

      if (response.ok) {
        setShowModal(false);
        setEditingArticle(null);
        setFormData({
          title: '',
          content: '',
          category: '',
          tags: '',
          isActive: true,
          priority: 1
        });
        fetchArticles();
      }
    } catch (error) {
      console.error('Error saving article:', error);
    }
  };

  const handleEdit = (article) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      content: article.content,
      category: article.category,
      tags: article.tags.join(', '),
      isActive: article.isActive,
      priority: article.priority
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten artykuł?')) {
      try {
        const response = await fetch(apiUrl(`/api/kb/articles/${id}`), {
          method: 'DELETE',
        });
        if (response.ok) {
          fetchArticles();
        }
      } catch (error) {
        console.error('Error deleting article:', error);
      }
    }
  };

  const toggleActive = async (id, currentStatus) => {
    try {
      const response = await fetch(apiUrl(`/api/kb/articles/${id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (response.ok) {
        fetchArticles();
      }
    } catch (error) {
      console.error('Error toggling article status:', error);
    }
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || article.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(articles.map(article => article.category))];

  return (
    <div className="max-w-[1200px] mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-[240px,1fr] gap-4">
        {/* Left nav */}
        <aside className="bg-white rounded-2xl shadow">
          <div className="p-4 text-lg font-semibold">Helpfli</div>
          <nav className="px-2 pb-3 space-y-1">
            <Link to="/admin" className="block px-3 py-2 rounded-xl hover:bg-slate-50">
              Dashboard
            </Link>
            <Link to="/admin/ranking" className="block px-3 py-2 rounded-xl hover:bg-slate-50">
              Konfiguracja rankingu
            </Link>
            <Link to="/admin/verifications" className="block px-3 py-2 rounded-xl hover:bg-slate-50">
              Weryfikacje
            </Link>
            <Link to="/admin/analytics" className="block px-3 py-2 rounded-xl hover:bg-slate-50">
              Analityka
            </Link>
            <Link to="/admin/settings" className="block px-3 py-2 rounded-xl hover:bg-slate-50">
              Ustawienia
            </Link>
            <div className="px-3 py-2 rounded-xl bg-slate-100 font-medium">
              Baza wiedzy
            </div>
          </nav>
        </aside>

        {/* Main */}
        <main className="space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold">Zarządzanie bazą wiedzy</h1>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus size={20} />
              Nowy artykuł
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Szukaj artykułów..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter size={20} className="text-gray-400" />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Wszystkie kategorie</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Articles Table */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Ładowanie...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tytuł
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kategoria
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priorytet
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data utworzenia
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Akcje
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredArticles.map((article) => (
                      <tr key={article._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {article.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {article.tags.slice(0, 3).join(', ')}
                            {article.tags.length > 3 && '...'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {article.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => toggleActive(article._id, article.isActive)}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              article.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {article.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                            {article.isActive ? 'Aktywny' : 'Nieaktywny'}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {article.priority}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(article.createdAt).toLocaleDateString('pl-PL')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(article)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(article._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {filteredArticles.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm || filterCategory ? 'Brak artykułów spełniających kryteria' : 'Brak artykułów w bazie wiedzy'}
            </div>
          )}
        </main>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {editingArticle ? 'Edytuj artykuł' : 'Nowy artykuł'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tytuł
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategoria
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="">Wybierz kategorię</option>
                  <option value="ogólne">Ogólne</option>
                  <option value="hydraulika">Hydraulika</option>
                  <option value="elektryka">Elektryka</option>
                  <option value="remont">Remont</option>
                  <option value="ogrodnictwo">Ogrodnictwo</option>
                  <option value="sprzątanie">Sprzątanie</option>
                  <option value="IT">IT</option>
                  <option value="inne">Inne</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Treść
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tagi (oddzielone przecinkami)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="np. hydraulik, kran, naprawa"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priorytet
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value={1}>1 - Niski</option>
                    <option value={2}>2 - Średni</option>
                    <option value={3}>3 - Wysoki</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                    Artykuł aktywny
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingArticle(null);
                    setFormData({
                      title: '',
                      content: '',
                      category: '',
                      tags: '',
                      isActive: true,
                      priority: 1
                    });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  {editingArticle ? 'Zapisz zmiany' : 'Utwórz artykuł'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
