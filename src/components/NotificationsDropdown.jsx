import { apiUrl } from "@/lib/apiUrl";
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotificationsDropdown({ userId, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;

    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }
        const url = apiUrl("/api/notifications?limit=10");
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
          setUnreadCount(data.pagination?.unreadCount || 0);
        }
      } catch (_error) {
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Odśwież co 30s
    
    return () => clearInterval(interval);
  }, [userId]);

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

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification._id);
    }
    
    if (notification.link) {
      // Wyciągnij ścieżkę z pełnego URL
      const url = new URL(notification.link, window.location.origin);
      navigate(url.pathname);
    }
    
    if (onClose) onClose();
  };

  const getNotificationIcon = (type) => {
    const icons = {
      order_accepted: '✅',
      order_funded: '💰',
      order_completed: '🎉',
      order_disputed: '⚠️',
      order_updated: '📝',
      new_quote: '💬',
      new_offer: '💼',
      new_order: '📋',
      payment_received: '💵',
      new_direct_order: '📋',
      subscription_expiring: '⏰',
      subscription_expired: '❌',
      subscription_renewed: '🔄',
      referral_reward: '🎁',
      system_announcement: '📢',
      limit_warning: '⚠️',
      limit_exceeded: '🚫',
      chat_message: '💬'
    };
    return icons[type] || '🔔';
  };

  return (
    <div 
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-96 max-h-[500px] bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
        <h3 className="font-semibold text-gray-900">Powiadomienia</h3>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Oznacz wszystkie jako przeczytane
          </button>
        )}
      </div>

      {/* Lista powiadomień */}
      <div className="overflow-y-auto flex-1">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-sm">Ładowanie...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-2">🔔</div>
            <p className="text-sm">Brak powiadomień</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <button
                key={notification._id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                  !notification.read ? 'bg-indigo-50/50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                        {notification.title}
                      </h4>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-indigo-600 rounded-full flex-shrink-0"></span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notification.createdAt).toLocaleString('pl-PL', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => {
              navigate('/notifications');
              if (onClose) onClose();
            }}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium w-full text-center"
          >
            Zobacz wszystkie powiadomienia
          </button>
        </div>
      )}
    </div>
  );
}







