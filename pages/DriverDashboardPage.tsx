
import React from 'react';
import { 
  Car, Navigation, Banknote, CreditCard, 
  Clock, CheckCircle2, MapPin, TrendingUp, 
  User, Bell, LogOut, ChevronRight, History, Wallet,
  Star, ShieldCheck, Mail, Phone
} from 'lucide-react';
import { Button } from '../components/Button';

interface DriverDashboardProps {
  onLogout: () => void;
}

export const DriverDashboardPage: React.FC<DriverDashboardProps> = ({ onLogout }) => {
  // Mock Driver Data
  const driverData = {
    name: 'Nolan Walker',
    id: 'D-9021',
    rating: 4.9,
    balance: 3825.50,
    totalEarned: 4500.50,
    completedTrips: 124,
    avatarUrl: 'https://i.pravatar.cc/150?u=D-9021',
    email: 'nolan.walker@gogo.com',
    phone: '+250 788 000 000'
  };

  const mockTrips = [
    { id: 'T-1001', date: 'Today, 2:30 PM', pickup: 'Downtown Plaza', dropoff: 'City Airport', fare: 45.00, status: 'COMPLETED', method: 'WALLET' },
    { id: 'T-1002', date: 'Today, 11:15 AM', pickup: 'West End Mall', dropoff: 'Central Station', fare: 12.50, status: 'COMPLETED', method: 'CASH' },
  ];

  const mockTransactions = [
    { id: 'TX-882', date: '21 Mar, 2024', type: 'PAYOUT', amount: -1000.00, method: 'BANK_TRANSFER' },
    { id: 'TX-881', date: '20 Mar, 2024', type: 'EARNING', amount: 45.00, method: 'TRIP_FARE' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center overflow-x-hidden">
      {/* Mobile Frame Container */}
      <div className="w-full max-w-[480px] bg-white min-h-screen flex flex-col shadow-2xl relative overflow-y-auto no-scrollbar">
        
        {/* Unified Profile Header */}
        <div className="bg-gray-900 pt-14 pb-20 px-8 rounded-b-[60px] text-white relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/20 rounded-full -mr-24 -mt-24 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-500/10 rounded-full -ml-16 -mb-16 blur-3xl"></div>
          
          <div className="flex justify-between items-start mb-10 relative z-10">
            <h1 className="text-2xl font-black tracking-tighter uppercase">My Profile</h1>
            <button 
              onClick={onLogout}
              className="p-3 bg-white/10 rounded-2xl hover:bg-red-500/20 transition-all active:scale-95 group border border-white/5"
            >
              <LogOut size={20} className="text-white/60 group-hover:text-white" />
            </button>
          </div>

          <div className="flex flex-col items-center relative z-10">
            <div className="relative">
              <div className="w-28 h-28 rounded-[36px] border-4 border-white/10 p-1.5 shadow-2xl relative overflow-hidden bg-gray-800">
                <img src={driverData.avatarUrl} alt="" className="w-full h-full object-cover rounded-[28px]" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-gray-900 px-3 py-1 rounded-xl text-[10px] font-black border-4 border-gray-900 flex items-center gap-1">
                <Star size={10} fill="currentColor" /> {driverData.rating}
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <h2 className="text-2xl font-black tracking-tight">{driverData.name}</h2>
              <p className="text-[11px] font-black uppercase tracking-widest text-blue-400 mt-1">Gogo Partner • {driverData.id}</p>
            </div>

            <div className="flex gap-4 mt-8 w-full">
              <div className="flex-1 bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center">
                <p className="text-[9px] font-black uppercase text-white/40 tracking-widest mb-1">Trips</p>
                <p className="text-xl font-black">{driverData.completedTrips}</p>
              </div>
              <div className="flex-1 bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center">
                <p className="text-[9px] font-black uppercase text-white/40 tracking-widest mb-1">Status</p>
                <div className="flex items-center justify-center gap-1 text-green-400">
                  <ShieldCheck size={14} />
                  <p className="text-xs font-black uppercase">Verified</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Content Body */}
        <div className="px-6 -mt-10 relative z-20 space-y-8 pb-12">
          
          {/* Section: Finance Summary */}
          <div className="bg-white rounded-[40px] p-8 shadow-xl shadow-gray-200/50 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400">Wallet Balance</h3>
               <Wallet size={16} className="text-blue-600" />
            </div>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-black tracking-tighter text-gray-900">${driverData.balance.toLocaleString()}</span>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Available</span>
            </div>
            <Button variant="black" fullWidth className="h-14 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-gray-200">
              Request Disbursement
            </Button>
          </div>

          {/* Section: My Payouts & Payments */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <Banknote size={14} /> Payouts & Payments
              </h3>
              <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest">See All</button>
            </div>
            <div className="space-y-3">
              {mockTransactions.map(tx => (
                <div key={tx.id} className="bg-white p-5 rounded-[28px] border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${tx.type === 'PAYOUT' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                      {tx.type === 'PAYOUT' ? <History size={16} /> : <TrendingUp size={16} />}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-gray-900 uppercase tracking-tight">{tx.type === 'PAYOUT' ? 'Settlement' : 'Trip Revenue'}</h4>
                      <p className="text-[10px] font-bold text-gray-400 mt-0.5">{tx.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-black tracking-tighter ${tx.amount < 0 ? 'text-red-500' : 'text-gray-900'}`}>
                      {tx.amount < 0 ? '' : '+'}${Math.abs(tx.amount).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: My Trips */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <Navigation size={14} /> My Recent Trips
              </h3>
              <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest">History</button>
            </div>
            <div className="space-y-3">
              {mockTrips.map(trip => (
                <div key={trip.id} className="bg-gray-50/50 p-5 rounded-[32px] border border-gray-100 flex flex-col gap-3 group active:scale-[0.98] transition-all">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">{trip.id} • {trip.date}</span>
                    <p className="text-sm font-black text-gray-900">${trip.fare.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center gap-0.5 shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      <div className="w-0.5 h-2 bg-gray-200" />
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-gray-600 truncate">{trip.pickup}</p>
                      <p className="text-[10px] font-bold text-gray-600 truncate mt-0.5">{trip.dropoff}</p>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-gray-100">
                      <ChevronRight size={14} className="text-gray-300" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Contact & Support */}
          <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400 px-2 mb-2">Account Contact</h3>
            <div className="flex items-center gap-4 px-2">
              <div className="p-3 bg-gray-100 rounded-xl text-gray-400"><Mail size={16} /></div>
              <p className="text-xs font-bold text-gray-700">{driverData.email}</p>
            </div>
            <div className="flex items-center gap-4 px-2">
              <div className="p-3 bg-gray-100 rounded-xl text-gray-400"><Phone size={16} /></div>
              <p className="text-xs font-bold text-gray-700">{driverData.phone}</p>
            </div>
          </div>

        </div>

        {/* Mobile Safe Area Bottom Padding */}
        <div className="h-10 shrink-0"></div>

      </div>
    </div>
  );
};
