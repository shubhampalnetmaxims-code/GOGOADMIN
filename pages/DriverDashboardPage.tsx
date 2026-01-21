
import React, { useState } from 'react';
import { 
  Navigation, Wallet, TrendingUp, LogOut, 
  ChevronRight, Star, ShieldCheck, Mail, Phone, 
  ArrowUpRight, ArrowDownLeft, Clock, History,
  LayoutGrid, User, Bell
} from 'lucide-react';
import { Button } from '../components/Button';
import { PayoutType, PaymentMethod } from '../types';

interface DriverDashboardProps {
  onLogout: () => void;
}

export const DriverDashboardPage: React.FC<DriverDashboardProps> = ({ onLogout }) => {
  const [isActive, setIsActive] = useState(true);

  // Mock Driver Data
  const driverData = {
    name: 'Nolan Walker',
    id: 'D-9021',
    rating: 4.9,
    walletBalance: 2450.75, 
    totalEarned: 12840.50, 
    completedTrips: 124,
    avatarUrl: 'https://i.pravatar.cc/150?u=D-9021',
    email: 'nolan.walker@gogo.com',
    phone: '+250 788 000 000'
  };

  const mockWalletHistory = [
    { 
      id: 'TX-883', 
      date: 'Today, 2:45 PM', 
      type: PayoutType.TRIP_EARNING_ONLINE, 
      amount: 36.00, 
      note: 'Online Trip #T-1001', 
      isAddition: true
    },
    { 
      id: 'TX-882', 
      date: 'Today, 11:30 AM', 
      type: PayoutType.TRIP_COMMISSION_CASH, 
      amount: 2.50, 
      note: 'Cash Trip Comm. #T-1002', 
      isAddition: false
    },
    { 
      id: 'TX-881', 
      date: 'Yesterday', 
      type: PayoutType.PAYOUT_TO_DRIVER, 
      amount: 1000.00, 
      note: 'Admin Weekly Payout', 
      isAddition: false
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      {/* Mobile App Viewport */}
      <div className="w-full max-w-[480px] bg-white min-h-screen flex flex-col shadow-xl relative overflow-y-auto no-scrollbar pb-10">
        
        {/* Simple Header */}
        <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-30 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={driverData.avatarUrl} alt="" className="w-10 h-10 rounded-full border border-gray-200" />
              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
            </div>
            <div>
              <h1 className="text-sm font-black text-gray-900 leading-none">Hello, Nolan</h1>
              <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">{driverData.id}</p>
            </div>
          </div>
          <button 
            onClick={() => setIsActive(!isActive)}
            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}
          >
            {isActive ? 'Active' : 'Offline'}
          </button>
        </header>

        <div className="p-6 space-y-6">
          
          {/* Main Wallet Card */}
          <section className="bg-gray-900 rounded-[32px] p-8 text-white shadow-2xl shadow-blue-900/10 relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Current Balance</span>
                <Wallet size={16} className="text-blue-400" />
              </div>
              
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-4xl font-black tracking-tighter">${driverData.walletBalance.toLocaleString()}</span>
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Available</span>
              </div>

              <div className="flex gap-2">
                <Button variant="primary" fullWidth className="bg-blue-600 hover:bg-blue-500 text-white h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest border-none">
                  Request Payout
                </Button>
                <button onClick={onLogout} className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-red-500/20 transition-all">
                   <LogOut size={18} className="text-white/60" />
                </button>
              </div>
            </div>
          </section>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-3xl p-5 border border-gray-100">
              <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-1">Total Earnings</p>
              <p className="text-lg font-black text-gray-900">${driverData.totalEarned.toLocaleString()}</p>
              <div className="flex items-center gap-1 mt-2 text-green-600">
                <TrendingUp size={10} />
                <span className="text-[9px] font-black uppercase tracking-tighter">+12.5%</span>
              </div>
            </div>
            <div className="bg-gray-50 rounded-3xl p-5 border border-gray-100">
              <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-1">Trips Done</p>
              <p className="text-lg font-black text-gray-900">{driverData.completedTrips}</p>
              <div className="flex items-center gap-1 mt-2 text-blue-600">
                <Navigation size={10} />
                <span className="text-[9px] font-black uppercase tracking-tighter">Lifetime</span>
              </div>
            </div>
          </div>

          {/* Wallet History */}
          <section className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                <History size={14} className="text-gray-400" /> Recent Activity
              </h3>
              <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest">See All</button>
            </div>

            <div className="space-y-2">
              {mockWalletHistory.map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:border-gray-200 transition-all active:scale-[0.98]">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.isAddition ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                      {item.isAddition ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-tight">{item.note}</h4>
                      <p className="text-[10px] font-bold text-gray-400">{item.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-black tracking-tighter ${item.isAddition ? 'text-green-600' : 'text-red-500'}`}>
                      {item.isAddition ? '+' : '-'}${item.amount.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Support Section */}
          <section className="pt-6 border-t border-gray-100 space-y-3">
             <div className="p-5 bg-blue-50/50 rounded-3xl flex items-center justify-between group cursor-pointer active:bg-blue-100 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                    <Phone size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-tight">Support Center</h4>
                    <p className="text-[10px] font-bold text-blue-400">Call us anytime</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-blue-200 group-hover:translate-x-1 transition-transform" />
             </div>
             
             <div className="flex items-center justify-center gap-6 py-4">
                <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                  <ShieldCheck size={12} className="text-green-500" /> Account Verified
                </div>
                <div className="w-1 h-1 rounded-full bg-gray-200" />
                <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                  <Star size={12} className="text-yellow-500" fill="currentColor" /> {driverData.rating} Rating
                </div>
             </div>
          </section>
        </div>
      </div>
    </div>
  );
};
