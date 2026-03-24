import { useEffect, useState } from 'react';

export default function AdminCoupons() {
  const API = import.meta.env.VITE_API_URL || '';
  const token = localStorage.getItem('token');
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    type: 'percent',
    value: 0,
    active: true,
    validFrom: '',
    validTo: '',
    products: '',
    maxUses: 0,
  });

  const loadCoupons = async () => {
    try {
      const res = await fetch(`${API}/api/coupons`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCoupons(data);
      }
    } catch (error) {
      console.error('Error loading coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const body = {
        ...formData,
        products: formData.products ? formData.products.split(',').map(p => p.trim()).filter(Boolean) : [],
        validFrom: formData.validFrom ? new Date(formData.validFrom) : null,
        validTo: formData.validTo ? new Date(formData.validTo) : null,
      };

      const url = editingCoupon ? `${API}/api/coupons/${editingCoupon._id}` : `${API}/api/coupons`;
      const method = editingCoupon ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setShowModal(false);
        setEditingCoupon(null);
        setFormData({
          code: '',
          type: 'percent',
          value: 0,
          active: true,
          validFrom: '',
          validTo: '',
          products: '',
          maxUses: 0,
        });
        loadCoupons();
      } else {
        const error = await res.json();
        alert(error.message || 'Błąd zapisywania kuponu');
      }
    } catch (error) {
      console.error('Error saving coupon:', error);
      alert('Błąd zapisywania kuponu');
    }
  };

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      active: coupon.active,
      validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().slice(0, 16) : '',
      validTo: coupon.validTo ? new Date(coupon.validTo).toISOString().slice(0, 16) : '',
      products: coupon.products?.join(', ') || '',
      maxUses: coupon.maxUses || 0,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Czy na pewno chcesz usunąć ten kupon?')) return;
    try {
      const res = await fetch(`${API}/api/coupons/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        loadCoupons();
      }
    } catch (error) {
      console.error('Error deleting coupon:', error);
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pl-PL');
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Zarządzanie kuponami</h1>
        <button
          onClick={() => {
            setEditingCoupon(null);
            setFormData({
              code: '',
              type: 'percent',
              value: 0,
              active: true,
              validFrom: '',
              validTo: '',
              products: '',
              maxUses: 0,
            });
            setShowModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Nowy kupon
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">Ładowanie...</div>
      ) : (
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kod</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Typ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wartość</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Użycia</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ważny od</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ważny do</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Akcje</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {coupons.map((coupon) => (
                <tr key={coupon._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{coupon.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {coupon.type === 'percent' ? 'Procent' : 'Kwota'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {coupon.type === 'percent' ? `${coupon.value}%` : `${(coupon.value / 100).toFixed(2)} zł`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${coupon.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {coupon.active ? 'Aktywny' : 'Nieaktywny'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {coupon.used || 0} / {coupon.maxUses || '∞'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(coupon.validFrom)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(coupon.validTo)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleEdit(coupon)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      Edytuj
                    </button>
                    <button
                      onClick={() => handleDelete(coupon._id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Usuń
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">
              {editingCoupon ? 'Edytuj kupon' : 'Nowy kupon'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Kod kuponu</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Typ</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="percent">Procent</option>
                  <option value="amount">Kwota (w groszach)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Wartość</label>
                <input
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Produkty (oddzielone przecinkami, puste = wszystkie)</label>
                <input
                  type="text"
                  value={formData.products}
                  onChange={(e) => setFormData({ ...formData, products: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="highlight_24h, top_7d"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Maksymalna liczba użyć (0 = bez limitu)</label>
                <input
                  type="number"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ważny od</label>
                <input
                  type="datetime-local"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ważny do</label>
                <input
                  type="datetime-local"
                  value={formData.validTo}
                  onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="mr-2"
                  />
                  Aktywny
                </label>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingCoupon ? 'Zapisz' : 'Utwórz'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCoupon(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Anuluj
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}










