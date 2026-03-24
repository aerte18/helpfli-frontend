// Portfolio wykonawcy
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  getPortfolio, 
  getMyPortfolio, 
  createPortfolioItem, 
  updatePortfolioItem, 
  deletePortfolioItem,
  likePortfolioItem,
  uploadPortfolioImages
} from '../api/social';
import { useAuth } from '../context/AuthContext';

export default function Portfolio({ providerId: propProviderId, compact = false }) {
  const { providerId: paramProviderId } = useParams();
  const { user } = useAuth();
  const providerId = propProviderId || paramProviderId;
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    service: '',
    images: [],
    beforeAfter: { before: '', after: '' },
    location: { city: '', address: '' },
    completedAt: '',
    tags: [],
    featured: false
  });
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);

  // Portfolio należy do zalogowanego użytkownika TYLKO jeśli:
  // 1. Nie ma providerId (oglądamy własne portfolio)
  // 2. providerId === user._id (oglądamy własne portfolio)
  // 3. providerId === 'me' (oglądamy własne portfolio)
  // 4. Użytkownik jest zalogowany jako provider i providerId pasuje
  const isMyPortfolio = user?.role === 'provider' && (
    !providerId || 
    providerId === user._id || 
    providerId === user.id ||
    providerId === 'me'
  );

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        setLoading(true);
        // Sprawdź czy to portfolio właściciela
        const isOwner = user?.role === 'provider' && (
          !providerId || 
          providerId === user._id || 
          providerId === user.id ||
          providerId === 'me'
        );
        
        const data = providerId && !isOwner 
          ? await getPortfolio(providerId)
          : await getMyPortfolio();
        // Backend zwraca items, nie portfolio
        setPortfolio(data.items || data.portfolio || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPortfolio();
  }, [providerId, user?._id, user?.id, user?.role]);

  const handleImageUpload = async (files) => {
    if (!files || files.length === 0) return;
    
    try {
      setUploadingImages(true);
      const result = await uploadPortfolioImages(Array.from(files));
      const newImages = [...formData.images, ...result.urls];
      setFormData({ ...formData, images: newImages });
      setImageFiles([]);
    } catch (err) {
      alert(`Błąd przesyłania zdjęć: ${err.message}`);
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Jeśli są pliki do przesłania, najpierw je prześlij
      if (imageFiles.length > 0) {
        const result = await uploadPortfolioImages(imageFiles);
        const newImages = [...formData.images, ...result.urls];
        setFormData({ ...formData, images: newImages });
        setImageFiles([]);
        // Kontynuuj z przesłanymi zdjęciami
      }

      if (formData.images.length === 0) {
        alert('Dodaj przynajmniej jedno zdjęcie');
        return;
      }

      // Mapuj images na photos (backend oczekuje photos)
      const portfolioData = {
        title: formData.title,
        description: formData.description,
        service: formData.service,
        photos: formData.images,
        beforeAfter: formData.beforeAfter,
        location: formData.location,
        completedAt: formData.completedAt,
        tags: formData.tags,
        featured: formData.featured
      };

      if (editingItem) {
        await updatePortfolioItem(editingItem._id, portfolioData);
      } else {
        await createPortfolioItem(portfolioData);
      }
      setShowCreateModal(false);
      setEditingItem(null);
      setFormData({
        title: '', description: '', service: '', images: [],
        beforeAfter: { before: '', after: '' },
        location: { city: '', address: '' }, completedAt: '', tags: [], featured: false
      });
      setImageFiles([]);
      fetchPortfolio();
    } catch (err) {
      alert(`Błąd: ${err.message}`);
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Czy na pewno chcesz usunąć ten element portfolio?')) return;
    try {
      await deletePortfolioItem(itemId);
      fetchPortfolio();
    } catch (err) {
      alert(`Błąd: ${err.message}`);
    }
  };

  const handleLike = async (itemId) => {
    try {
      await likePortfolioItem(itemId);
      fetchPortfolio();
    } catch (err) {
      console.error('Failed to like:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Ładowanie portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Portfolio</h1>
          <p className="text-gray-600 mt-1">
            {isMyPortfolio ? 'Twoje portfolio' : 'Portfolio wykonawcy'}
          </p>
        </div>
        {isMyPortfolio && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            ➕ Dodaj projekt
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Portfolio Grid */}
      {portfolio.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">
            {isMyPortfolio ? 'Brak projektów w portfolio. Dodaj pierwszy projekt!' : 'Brak projektów w portfolio.'}
          </p>
        </div>
      ) : (
        <div className={`grid grid-cols-1 ${compact ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'} gap-6`}>
          {portfolio.map((item) => (
            <div key={item._id} className="bg-white rounded-lg shadow overflow-hidden">
              {item.thumbnail && (
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  {item.featured && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      ⭐ Wyróżnione
                    </span>
                  )}
                </div>
                {item.service && (
                  <p className="text-sm text-gray-500 mb-2">{item.service}</p>
                )}
                {item.description && (
                  <p className="text-sm text-gray-700 mb-3 line-clamp-2">{item.description}</p>
                )}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {item.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {item.likes > 0 && (
                      <span>❤️ {item.likes}</span>
                    )}
                    {item.views > 0 && (
                      <span>👁️ {item.views}</span>
                    )}
                  </div>
                  {!isMyPortfolio && (
                    <button
                      onClick={() => handleLike(item._id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ❤️
                    </button>
                  )}
                </div>
                {isMyPortfolio && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setFormData({
                          title: item.title || '',
                          description: item.description || '',
                          service: item.service || '',
                          images: item.images || [],
                          beforeAfter: item.beforeAfter || { before: '', after: '' },
                          location: item.location || { city: '', address: '' },
                          completedAt: item.completedAt ? new Date(item.completedAt).toISOString().split('T')[0] : '',
                          tags: item.tags || [],
                          featured: item.featured || false
                        });
                        setShowCreateModal(true);
                      }}
                      className="flex-1 px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                    >
                      Edytuj
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="flex-1 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                    >
                      Usuń
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium mb-4">
              {editingItem ? 'Edytuj projekt' : 'Dodaj projekt do portfolio'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tytuł *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Opis</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Usługa</label>
                  <input
                    type="text"
                    value={formData.service}
                    onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zdjęcia
                  </label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        const files = Array.from(e.target.files);
                        setImageFiles(files);
                      }}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      disabled={uploadingImages}
                    />
                    {uploadingImages && (
                      <p className="text-sm text-gray-600">Przesyłanie zdjęć...</p>
                    )}
                    {formData.images.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {formData.images.map((url, idx) => (
                          <div key={idx} className="relative">
                            <img
                              src={url.startsWith('http') ? url : `${import.meta.env.VITE_API_URL || ''}${url}`}
                              alt={`Zdjęcie ${idx + 1}`}
                              className="w-full h-24 object-cover rounded border"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  images: formData.images.filter((_, i) => i !== idx)
                                });
                              }}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="text-sm text-gray-500">
                      Lub wprowadź URL (oddzielone przecinkami):
                    </div>
                    <input
                      type="text"
                      value={formData.images.filter(img => img.startsWith('http')).join(', ')}
                      onChange={(e) => {
                        const urls = e.target.value.split(',').map(url => url.trim()).filter(url => url);
                        const uploadedImages = formData.images.filter(img => !img.startsWith('http'));
                        setFormData({
                          ...formData,
                          images: [...uploadedImages, ...urls]
                        });
                      }}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tagi (oddzielone przecinkami)</label>
                  <input
                    type="text"
                    value={formData.tags.join(', ')}
                    onChange={(e) => setFormData({
                      ...formData,
                      tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                    })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="remont, łazienka, nowoczesny"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="mr-2"
                  />
                  <label className="text-sm text-gray-700">Wyróżnij projekt</label>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingItem ? 'Zapisz' : 'Dodaj'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

