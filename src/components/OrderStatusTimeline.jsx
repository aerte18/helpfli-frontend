import { apiUrl } from "@/lib/apiUrl";
import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, CreditCard, Package, AlertCircle, XCircle } from 'lucide-react';

export default function OrderStatusTimeline({ orderId }) {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(apiUrl(`/api/orders/${orderId}/timeline`), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setTimeline(data.timeline || []);
        }
      } catch (error) {
        console.error('Błąd pobierania timeline:', error);
        // Fallback - generuj timeline z danych zlecenia
        generateTimelineFromOrder();
      } finally {
        setLoading(false);
      }
    };

    fetchTimeline();
  }, [orderId]);

  const generateTimelineFromOrder = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl(`/api/orders/${orderId}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const order = await res.json();
        const events = [];
        
        if (order.createdAt) {
          events.push({
            type: 'created',
            label: 'Zlecenie utworzone',
            date: order.createdAt,
            icon: Package,
            color: 'blue'
          });
        }
        
        if (order.offers && order.offers.length > 0) {
          events.push({
            type: 'offers',
            label: `${order.offers.length} ${order.offers.length === 1 ? 'oferta złożona' : 'oferty złożone'}`,
            date: order.offers[0].date || order.createdAt,
            icon: Package,
            color: 'yellow'
          });
        }
        
        if (order.status === 'accepted' || order.acceptedOfferId) {
          events.push({
            type: 'accepted',
            label: 'Oferta zaakceptowana',
            date: order.updatedAt,
            icon: CheckCircle2,
            color: 'orange'
          });
        }
        
        if (order.paymentStatus === 'succeeded' || order.paidInSystem) {
          events.push({
            type: 'paid',
            label: 'Opłacone',
            date: order.updatedAt,
            icon: CreditCard,
            color: 'green'
          });
        }
        
        if (order.status === 'in_progress') {
          events.push({
            type: 'in_progress',
            label: 'W realizacji',
            date: order.updatedAt,
            icon: Clock,
            color: 'purple'
          });
        }
        
        if (order.status === 'completed') {
          events.push({
            type: 'completed',
            label: 'Zakończone',
            date: order.completedAt || order.updatedAt,
            icon: CheckCircle2,
            color: 'emerald'
          });
        }
        
        if (order.disputeStatus && order.disputeStatus !== 'none') {
          events.push({
            type: 'disputed',
            label: 'Spór zgłoszony',
            date: order.disputeReportedAt || order.updatedAt,
            icon: AlertCircle,
            color: 'red'
          });
        }
        
        setTimeline(events.sort((a, b) => new Date(a.date) - new Date(b.date)));
      }
    } catch (error) {
      console.error('Błąd generowania timeline:', error);
    }
  };

  if (loading) {
    return <div className="p-4 text-gray-500">Ładowanie historii...</div>;
  }

  if (timeline.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4">Historia zmian statusu</h3>
      <div className="space-y-4">
        {timeline.map((event, index) => {
          const Icon = event.icon || Clock;
          const isLast = index === timeline.length - 1;
          
          const colorClasses = {
            blue: 'bg-blue-100 text-blue-600 border-blue-300',
            yellow: 'bg-yellow-100 text-yellow-600 border-yellow-300',
            orange: 'bg-orange-100 text-orange-600 border-orange-300',
            green: 'bg-green-100 text-green-600 border-green-300',
            purple: 'bg-purple-100 text-purple-600 border-purple-300',
            emerald: 'bg-emerald-100 text-emerald-600 border-emerald-300',
            red: 'bg-red-100 text-red-600 border-red-300',
          };

          return (
            <div key={index} className="flex items-start gap-4">
              {/* Linia pionowa */}
              {!isLast && (
                <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-200" />
              )}
              
              {/* Ikona */}
              <div className={`relative z-10 w-12 h-12 rounded-full border-2 flex items-center justify-center ${colorClasses[event.color] || colorClasses.blue}`}>
                <Icon className="w-6 h-6" />
              </div>
              
              {/* Treść */}
              <div className="flex-1 pt-2">
                <div className="font-medium text-gray-900">{event.label}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {new Date(event.date).toLocaleString('pl-PL', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

