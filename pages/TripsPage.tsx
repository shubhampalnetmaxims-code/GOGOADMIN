
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, Calendar, MapPin, Navigation, Clock, CreditCard, ChevronRight, 
  ArrowUpRight, ArrowDownLeft, Filter, CheckCircle2, XCircle, MoreVertical,
  Car, User
} from 'lucide-react';
import { Button } from '../components/Button';

interface Trip {
  id: string;
  date: string;
  time: string;
  driverName: string;
  customerName: string;
  pickup: string;
  dropoff: string;
  fare: number;
  status: 'COMPLETED' | 'CANCELLED' | 'ONGOING';
  paymentMethod: 'CASH' | 'WALLET' | 'CARD';
}

const MOCK_TRIPS: Trip[] = [
  { id: 'T-8821', date: '2024-03-20', time: '14:30', driverName: 'Nolan Walker', customerName: 'Alice Johnson', pickup: 'Downtown Plaza', dropoff: 'City Airport', fare: 45.00, status: 'COMPLETED', paymentMethod: 'WALLET' },
  { id: 'T-8822', date: '2024-03-20', time: '15:15', driverName: 'Sarah Jenkins', customerName: 'Bob Smith', pickup: 'West End', dropoff: 'Central Station', fare: 12.50, status: 'COMPLETED', paymentMethod: 'CASH' },
  { id: 'T-8823', date: '2024-03-19', time: '10:00', driverName: 'Nolan Walker', customerName: 'Charlie Brown', pickup: 'Green Park', dropoff: 'Tech Hub', fare: 28.00, status: 'CANCELLED', paymentMethod: 'CARD' },
  { id: 'T-8824', date: '2024-03-19', time: '18:45', driverName: 'Marcus Chen', customerName: 'David Lee', pickup: 'Shopping Mall', dropoff: 'Residence A', fare: 15.20, status: 'COMPLETED', paymentMethod: 'CASH' },
  { id: 'T-8825', date: '2024-03-18', time: '08:20', driverName: 'Sarah Jenkins', customerName: 'Eva Garcia', pickup: 'Hotel Grand', dropoff: 'Office Park', fare: 32.00, status: 'ONGOING', paymentMethod: 'WALLET' },
];

interface TripsPageProps {
  initialFilter?: string;
  onFilterChange?: (filter: string) => void;
}

export const TripsPage: React.FC<TripsPageProps> = ({ initialFilter = '', onFilterChange }) => {
  const [search, setSearch] = useState(initialFilter);

  useEffect(() => {
    setSearch(initialFilter);
  }, [initialFilter]);

  const filteredTrips = useMemo(() => {
    return MOCK_TRIPS.filter(t => 
      t.driverName.toLowerCase().includes(search.toLowerCase()) ||
      t.customerName.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
             <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <Navigation size={18} />
             </div>
             <h1 className="text-2xl font-black text-gray-900 tracking-tight">Fleet Operations</h1>
          </div>
          <p className="text-sm text-gray-500 font-medium italic">Monitor real-time and historical trip data across all markets.</p>
        </div>
        
        <div className="flex gap-4">
           <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl flex flex-col min-w-[140px]">
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Total Trips</span>
              <span className="text-xl font-black text-gray-900">{MOCK_TRIPS.length}</span>
           </div>
           <div className="bg-green-50 border border-green-100 p-4 rounded-2xl flex flex-col min-w-[140px]">
              <span className="text-[10px] font-black uppercase text-green-400 tracking-widest mb-1">Completed</span>
              <span className="text-xl font-black text-green-600">{MOCK_TRIPS.filter(t => t.status === 'COMPLETED').length}</span>
           </div>
        </div>
      </header>

      <div className="bg-white rounded-[40px] shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 bg-gray-50/50 border-b flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by Driver, Customer or Trip ID..." 
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                if (onFilterChange) onFilterChange(e.target.value);
              }}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-[18px] focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm font-medium"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" icon={<Filter size={18} />} className="rounded-xl font-black text-[10px] uppercase tracking-widest">Filter</Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/80 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">
                <th className="px-8 py-5">Trip Identity</th>
                <th className="px-6 py-5">Participants</th>
                <th className="px-6 py-5">Route Details</th>
                <th className="px-6 py-5 text-center">Amount</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredTrips.map(trip => (
                <tr key={trip.id} className="hover:bg-indigo-50/10 transition-all cursor-pointer group">
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-gray-900 leading-none mb-1">{trip.id}</span>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase">
                        <Calendar size={12} /> {trip.date} • {trip.time}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center gap-2">
                        <Car size={14} className="text-indigo-500" />
                        <span className="text-xs font-bold text-gray-700">{trip.driverName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-400" />
                        <span className="text-[11px] font-medium text-gray-500">{trip.customerName}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <span className="text-[11px] font-bold text-gray-600 truncate max-w-[150px]">{trip.pickup}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        <span className="text-[11px] font-bold text-gray-600 truncate max-w-[150px]">{trip.dropoff}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-gray-900">${trip.fare.toFixed(2)}</span>
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">{trip.paymentMethod}</span>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <StatusBadge status={trip.status} />
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="p-2 text-gray-300 hover:text-indigo-600 transition-colors">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredTrips.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center opacity-30 grayscale">
                      <Search size={40} className="mb-2" />
                      <p className="text-[10px] font-black uppercase tracking-widest">No matching trip logs found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: Trip['status'] }) => {
  const styles = {
    COMPLETED: 'bg-green-50 text-green-600 border-green-100',
    CANCELLED: 'bg-red-50 text-red-600 border-red-100',
    ONGOING: 'bg-blue-50 text-blue-600 border-blue-100',
  };
  const Icons = {
    COMPLETED: <CheckCircle2 size={12} />,
    CANCELLED: <XCircle size={12} />,
    ONGOING: <Clock size={12} />,
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${styles[status]}`}>
      {Icons[status]} {status}
    </span>
  );
};
