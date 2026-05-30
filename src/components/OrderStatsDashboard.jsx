import { apiUrl } from "@/lib/apiUrl";
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  CreditCard, 
  TrendingUp, 
  AlertCircle,
  DollarSign,
  Users
} from 'lucide-react';
import CollapsiblePanel from './CollapsiblePanel';

export default function OrderStatsDashboard({ userRole, userId }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(apiUrl('/api/orders/my/stats'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
        }
      } catch (error) {
        console.error('Błąd pobierania statystyk:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  if (loading) {
    return <div className="p-4 text-gray-500">Ładowanie statystyk...</div>;
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Statystyki jako Klient */}
      {userRole === 'client' && stats.client && (
        <CollapsiblePanel
          title="Moje zlecenia jako Klient"
          icon={Package}
          storageKey="orderStats:client"
          summary={`${stats.client.total} zleceń · ${stats.client.inProgress} w realizacji`}
          bodyClassName="pt-4"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={<Package className="w-5 h-5" />}
              label="Wszystkie zlecenia"
              value={stats.client.total}
              color="blue"
              link="/account?tab=orders"
            />
            <StatCard
              icon={<Clock className="w-5 h-5" />}
              label="Oczekują na oferty"
              value={stats.client.open}
              color="yellow"
              link="/account?tab=orders&status=open"
            />
            <StatCard
              icon={<CheckCircle2 className="w-5 h-5" />}
              label="Oferta zaakceptowana"
              value={stats.client.accepted}
              color="orange"
              link="/account?tab=orders&status=accepted"
            />
            <StatCard
              icon={<CreditCard className="w-5 h-5" />}
              label="Opłacone"
              value={stats.client.paid}
              color="green"
              link="/account?tab=orders&status=paid"
            />
            <StatCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="W realizacji"
              value={stats.client.inProgress}
              color="purple"
              link="/account?tab=orders&status=in_progress"
            />
            <StatCard
              icon={<CheckCircle2 className="w-5 h-5" />}
              label="Zakończone"
              value={stats.client.completed}
              color="emerald"
              link="/account?tab=orders&status=completed"
            />
            {stats.client.disputed > 0 && (
              <StatCard
                icon={<AlertCircle className="w-5 h-5" />}
                label="Spory"
                value={stats.client.disputed}
                color="red"
                link="/account?tab=orders&status=disputed"
              />
            )}
            <StatCard
              icon={<DollarSign className="w-5 h-5" />}
              label="Wydane łącznie"
              value={`${(stats.client.totalSpent / 100).toFixed(2)} zł`}
              color="indigo"
            />
          </div>
        </CollapsiblePanel>
      )}

      {/* Statystyki jako Provider */}
      {userRole === 'provider' && stats.provider && (
        <CollapsiblePanel
          title="Moje zlecenia jako Wykonawca"
          icon={Users}
          storageKey="orderStats:provider"
          summary={`${stats.provider.total} zleceń · ${stats.provider.accepted} zaakceptowanych · ${stats.provider.inProgress} w realizacji`}
          bodyClassName="pt-4"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={<Package className="w-5 h-5" />}
              label="Wszystkie zlecenia"
              value={stats.provider.total}
              color="blue"
              link="/account?tab=orders"
            />
            <StatCard
              icon={<CheckCircle2 className="w-5 h-5" />}
              label="Oferta zaakceptowana"
              value={stats.provider.accepted}
              color="orange"
              link="/account?tab=orders&status=accepted"
            />
            <StatCard
              icon={<CreditCard className="w-5 h-5" />}
              label="Opłacone"
              value={stats.provider.paid}
              color="green"
              link="/account?tab=orders&status=paid"
            />
            <StatCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="W realizacji"
              value={stats.provider.inProgress}
              color="purple"
              link="/account?tab=orders&status=in_progress"
            />
            <StatCard
              icon={<CheckCircle2 className="w-5 h-5" />}
              label="Zakończone"
              value={stats.provider.completed}
              color="emerald"
              link="/account?tab=orders&status=completed"
            />
            <StatCard
              icon={<DollarSign className="w-5 h-5" />}
              label="Rozliczone"
              value={stats.provider.released}
              color="green"
              link="/account?tab=orders&status=released"
            />
            {stats.provider.disputed > 0 && (
              <StatCard
                icon={<AlertCircle className="w-5 h-5" />}
                label="Spory"
                value={stats.provider.disputed}
                color="red"
                link="/account?tab=orders&status=disputed"
              />
            )}
            <StatCard
              icon={<DollarSign className="w-5 h-5" />}
              label="Zarobki łącznie"
              value={`${(stats.provider.totalEarnings / 100).toFixed(2)} zł`}
              color="indigo"
            />
          </div>
        </CollapsiblePanel>
      )}

      {/* Statystyki firmy */}
      {stats.company && (
        <CollapsiblePanel
          title="Statystyki firmy"
          icon={Users}
          storageKey="orderStats:company"
          summary={`${stats.company.total} zleceń firmowych`}
          bodyClassName="pt-4"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={<Package className="w-5 h-5" />}
              label="Wszystkie zlecenia"
              value={stats.company.total}
              color="blue"
            />
            <StatCard
              icon={<Users className="w-5 h-5" />}
              label="Wykonawcy w firmie"
              value={stats.company.providersCount}
              color="indigo"
            />
            <StatCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="W realizacji"
              value={stats.company.inProgress}
              color="purple"
            />
            <StatCard
              icon={<CheckCircle2 className="w-5 h-5" />}
              label="Zakończone"
              value={stats.company.completed}
              color="emerald"
            />
            <StatCard
              icon={<DollarSign className="w-5 h-5" />}
              label="Rozliczone"
              value={stats.company.released}
              color="green"
            />
            <StatCard
              icon={<DollarSign className="w-5 h-5" />}
              label="Zarobki firmy"
              value={`${(stats.company.totalEarnings / 100).toFixed(2)} zł`}
              color="indigo"
            />
          </div>
        </CollapsiblePanel>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color, link }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
  };

  const content = (
    <div className={`p-4 rounded-lg border ${colorClasses[color] || colorClasses.blue} transition-all hover:shadow-md`}>
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium opacity-80">{label}</div>
          <div className="text-2xl font-bold mt-1">{value}</div>
        </div>
      </div>
    </div>
  );

  if (link) {
    return <Link to={link}>{content}</Link>;
  }

  return content;
}

