import { apiUrl } from "@/lib/apiUrl";
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function GamificationBadges() {
  const { user } = useAuth();
  const [gamification, setGamification] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGamification = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(apiUrl(`/api/gamification/me`), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setGamification(data);
        }
      } catch (error) {
        console.error('Error fetching gamification:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchGamification();
    }
  }, [user]);

  if (loading || !gamification) {
    return null;
  }

  const { badges, loginStreak, tier, points } = gamification;
  
  // tier może być stringiem (stary format) lub obiektem (nowy format)
  const tierData = typeof tier === 'string' 
    ? { current: tier, name: tier, icon: tier === 'platinum' ? '👑' : tier === 'gold' ? '🥇' : tier === 'silver' ? '🥈' : '🥉' }
    : tier;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        🏆 Gamification
      </h2>
      
      {/* Login Streak */}
      {loginStreak > 0 && (
        <div className="mb-4 p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <div>
              <div className="font-semibold text-orange-900">Serie logowań</div>
              <div className="text-sm text-orange-700">{loginStreak} dni z rzędu</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Tier */}
      <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{tierData.icon}</span>
            <div>
              <div className="font-semibold text-purple-900">Poziom lojalności: {tierData.name}</div>
              {tierData.discount > 0 && (
                <div className="text-sm text-purple-700">{tierData.discount}% zniżki na wszystkie płatności</div>
              )}
              {tierData.prioritySupport && (
                <div className="text-sm text-purple-700">✨ Priority Support</div>
              )}
            </div>
          </div>
        </div>
        {tierData.nextTier && (
          <div className="mt-3 pt-3 border-t border-purple-200">
            <div className="text-xs text-purple-600 mb-1">
              Do {tierData.nextTier.name}: {tierData.nextTier.pointsNeeded} punktów
            </div>
            <div className="w-full bg-purple-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all"
                style={{ 
                  width: `${Math.min(100, ((tierData.points - (tierData.nextTier.threshold - tierData.nextTier.pointsNeeded)) / tierData.nextTier.pointsNeeded) * 100)}%` 
                }}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Points */}
      <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💎</span>
          <div>
            <div className="font-semibold text-blue-900">Punkty lojalnościowe</div>
            <div className="text-sm text-blue-700">{points} punktów</div>
          </div>
        </div>
      </div>
      
      {/* Badges */}
      {badges && badges.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Otrzymane odznaki</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {badges.map((badge, index) => (
              <div
                key={index}
                className="p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 text-center hover:shadow-md transition-shadow"
              >
                <div className="text-3xl mb-2">{badge.icon}</div>
                <div className="font-semibold text-sm text-gray-900">{badge.name}</div>
                <div className="text-xs text-gray-600 mt-1">{badge.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {(!badges || badges.length === 0) && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🎯</div>
          <div>Zacznij działać, aby zdobyć odznaki!</div>
        </div>
      )}
    </div>
  );
}

