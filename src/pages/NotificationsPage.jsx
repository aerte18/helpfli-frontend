import { apiUrl } from "@/lib/apiUrl";
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNotificationNavigateTarget } from '../utils/notificationNavigation';
import { useAuth } from '../context/AuthContext';
import { Helmet } from 'react-helmet-async';

const API = import.meta.env.VITE_API_URL || '';

export default function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const limit = 20;

  useEffect(() => {
    if (!user?._id) return;

    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        const skip = (page - 1) * limit;
        const res = await fetch(apiUrl(`/api/notifications?limit=${limit}&skip=${skip}`), {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          if (page === 1) {
            setNotifications(data.notifications || []);
          } else {
            setNotifications(prev => [...prev, ...(data.notifications || [])]);
          }
          setUnreadCount(data.pagination?.unreadCount || 0);
          setHasMore(data.pagination?.hasMore || false);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user?._id, page]);

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(apiUrl(`/api/notifications/${notificationId}/read`), {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, read: true, readAt: new Date() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(apiUrl(`/api/notifications/read-all`), {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true, readAt: new Date() })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(apiUrl(`/api/notifications/${notificationId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification._id);
    }

    const target = getNotificationNavigateTarget(notification);
    if (target) {
      navigate({
        pathname: target.pathname,
        search: target.search || undefined,
      });
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      order_accepted: '✅',
      order_funded: '💰',
      order_completed: '🎉',
      order_disputed: '⚠️',
      new_quote: '💬',
      new_offer: '💼',
      order_updated: '📝',
      chat_message: '💬',
      payment_received: '💵',
      new_direct_order: '📋',
      subscription_expiring: '⏰',
      subscription_expired: '❌',
      subscription_renewed: '🔄',
      referral_reward: '🎁',
      system_announcement: '📢'
    };
    return icons[type] || '🔔';
  };

  const getNotificationLabel = (type) => {
    if (!type) return 'Inne';
    if (type.startsWith('order_')) return 'Zlecenia';
    if (type.startsWith('payment_')) return 'Płatności';
    if (type.startsWith('subscription_')) return 'Subskrypcje';
    if (type === 'chat_message') return 'Wiadomości';
    if (type === 'system_announcement') return 'System';
    return 'Inne';
  };

  const visibleNotifications = useMemo(
    () => (filter === 'unread' ? notifications.filter((n) => !n.read) : notifications),
    [filter, notifications]
  );

  return (
    <>
      <Helmet>
        <title>Powiadomienia | Helpfli</title>
      </Helmet>
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Powiadomienia</h1>
            <p className="text-sm text-gray-500 mt-1">
              {unreadCount > 0
                ? `Masz ${unreadCount} nieprzeczytanych powiadomień.`
                : 'Wszystkie powiadomienia są przeczytane.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-full border border-gray-200 bg-gray-50 p-1 text-xs">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-full ${
                  filter === 'all'
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Wszystkie
              </button>
              <button
                type="button"
                onClick={() => setFilter('unread')}
                className={`px-3 py-1.5 rounded-full ${
                  filter === 'unread'
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Nieprzeczytane
              </button>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-3 py-1.5 text-xs sm:text-sm text-indigo-600 hover:text-indigo-800 font-medium border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                Oznacz wszystkie jako przeczytane
              </button>
            )}
          </div>
        </div>

        {loading && notifications.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : visibleNotifications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <div className="text-6xl mb-4">🔔</div>
            <p className="text-gray-500 text-lg">Brak powiadomień</p>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleNotifications.map((notification) => (
              <div
                key={notification._id}
                className={`bg-white rounded-lg border p-4 hover:shadow-md transition-shadow ${
                  !notification.read ? 'border-indigo-300 bg-indigo-50/30' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <button
                        onClick={() => handleNotificationClick(notification)}
                        className="text-left flex-1"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`text-base font-semibold ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-indigo-600 rounded-full flex-shrink-0"></span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                            {getNotificationLabel(notification.type)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(notification.createdAt).toLocaleString('pl-PL', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </button>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!notification.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification._id);
                            }}
                            className="text-xs text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded hover:bg-indigo-50"
                            title="Oznacz jako przeczytane"
                          >
                            ✓
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification._id);
                          }}
                          className="text-xs text-gray-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50"
                          title="Usuń"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {hasMore && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setPage(prev => prev + 1)}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Pokaż więcej
            </button>
          </div>
        )}
      </div>
    </>
  );
}
