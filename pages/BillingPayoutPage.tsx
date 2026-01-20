
import React, { useState, useMemo } from 'react';
import { 
  Plus, Search, FileDown, History, DollarSign, ArrowUpRight, ArrowDownLeft, 
  ChevronDown, ChevronUp, Calendar, CheckCircle2, Wallet, Receipt, AlertCircle,
  TrendingUp, ArrowRight, Download, FileText, Settings, Bell, Ban, UserCheck, 
  MoreVertical, CheckSquare, Square, Navigation, Banknote, Smartphone, CreditCard,
  Clock, Filter
} from 'lucide-react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { DriverBilling, PayoutLog, PayoutType, PaymentMethod } from '../types';

interface BillingPayoutPageProps {
  onNavigateToTrips?: (filter: string) => void;
}

type BillingFilter = 'ALL' | 'READY_PAYOUT' | 'HIGH_RISK' | 'BLOCKED';

const MOCK_BILLING_DATA: DriverBilling[] = [
  {
    id: 'D-9021',
    name: 'Nolan Walker',
    avatarUrl: 'https://i.pravatar.cc/150?u=D-9021',
    completedTrips: 124,
    totalEarned: 4500.50,
    totalCommission: 675.00,
    payoutAmount: 3825.50,
    ownedMoney: 0.00,
    isBlocked: false,
    logs: [
      { id: 'l1', date: '2024-03-01', amount: 1000.00, type: PayoutType.PAYOUT_TO_DRIVER, paymentMethod: PaymentMethod.BANK_TRANSFER, note: 'Partial Monthly Settlement', adminName: 'Admin Mike' }
    ]
  },
  {
    id: 'D-8842',
    name: 'Sarah Jenkins',
    avatarUrl: 'https://i.pravatar.cc/150?u=D-8842',
    completedTrips: 89,
    totalEarned: 3100.20,
    totalCommission: 465.00,
    payoutAmount: 0.00,
    ownedMoney: 850.00,
    debtStartedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
    isBlocked: false,
    logs: [
      { id: 'l2', date: '2024-03-10', amount: 50.00, type: PayoutType.COLLECT_FROM_DRIVER, paymentMethod: PaymentMethod.CASH, note: 'Cash deposit at office', adminName: 'Admin Sarah' },
    ]
  },
  {
    id: 'D-7710',
    name: 'Marcus Chen',
    avatarUrl: 'https://i.pravatar.cc/150?u=D-7710',
    completedTrips: 210,
    totalEarned: 7800.00,
    totalCommission: 1170.00,
    payoutAmount: 0.00,
    ownedMoney: 0.00,
    isBlocked: true,
    logs: [
      { id: 'l3', date: '2024-02-28', amount: 6630.00, type: PayoutType.PAYOUT_TO_DRIVER, paymentMethod: PaymentMethod.BANK_TRANSFER, note: 'February Full Clearance', adminName: 'Admin Mike' },
    ]
  }
];

export const BillingPayoutPage: React.FC<BillingPayoutPageProps> = ({ onNavigateToTrips }) => {
  const [drivers, setDrivers] = useState<DriverBilling[]>(MOCK_BILLING_DATA);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<BillingFilter>('ALL');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedDrivers, setSelectedDrivers] = useState<Set<string>>(new Set());
  
  const [debtThreshold, setDebtThreshold] = useState(500);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [logModal, setLogModal] = useState<{ open: boolean; driverId?: string }>({ open: false });
  const [logFormData, setLogFormData] = useState<Partial<PayoutLog>>({
    amount: 0,
    type: PayoutType.PAYOUT_TO_DRIVER,
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    note: '',
  });

  const getDebtAge = (startDate?: string) => {
    if (!startDate) return 0;
    const start = new Date(startDate);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const filteredDrivers = useMemo(() => {
    return drivers.filter(d => {
      const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.id.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      switch (activeFilter) {
        case 'READY_PAYOUT': return d.payoutAmount > 0;
        case 'HIGH_RISK': return d.ownedMoney > debtThreshold;
        case 'BLOCKED': return d.isBlocked;
        default: return true;
      }
    });
  }, [drivers, searchQuery, activeFilter, debtThreshold]);

  const activeDriverForModal = useMemo(() => {
    return drivers.find(d => d.id === logModal.driverId);
  }, [drivers, logModal.driverId]);

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedRows(newExpanded);
  };

  const toggleSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelected = new Set(selectedDrivers);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedDrivers(newSelected);
  };

  const selectAll = () => {
    if (selectedDrivers.size === filteredDrivers.length) {
      setSelectedDrivers(new Set());
    } else {
      setSelectedDrivers(new Set(filteredDrivers.map(d => d.id)));
    }
  };

  const handleBlockToggle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDrivers(drivers.map(d => d.id === id ? { ...d, isBlocked: !d.isBlocked } : d));
  };

  const notifySelected = () => {
    if (selectedDrivers.size === 0) return;
    const targets = drivers.filter(d => selectedDrivers.has(d.id));
    const names = targets.map(d => d.name).join(', ');
    alert(`Sending Payment Reminders to: ${names}\nTotal debt being notified: $${targets.reduce((acc, d) => acc + d.ownedMoney, 0).toFixed(2)}`);
    setSelectedDrivers(new Set());
  };

  const handleOpenLog = (driverId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const driver = drivers.find(d => d.id === driverId);
    setLogModal({ open: true, driverId });
    
    if (driver) {
      if (driver.payoutAmount > 0) {
        setLogFormData({ amount: driver.payoutAmount, type: PayoutType.PAYOUT_TO_DRIVER, paymentMethod: PaymentMethod.BANK_TRANSFER, note: 'Settlement' });
      } else if (driver.ownedMoney > 0) {
        setLogFormData({ amount: driver.ownedMoney, type: PayoutType.COLLECT_FROM_DRIVER, paymentMethod: PaymentMethod.CASH, note: 'Collection' });
      } else {
        setLogFormData({ amount: 0, type: PayoutType.PAYOUT_TO_DRIVER, paymentMethod: PaymentMethod.BANK_TRANSFER, note: '' });
      }
    }
  };

  const handleSaveLog = () => {
    if (!logModal.driverId || !logFormData.amount) return;

    const newLog: PayoutLog = {
      id: `TX-${Math.floor(Math.random() * 10000)}`,
      date: new Date().toISOString().split('T')[0],
      amount: logFormData.amount!,
      type: logFormData.type!,
      paymentMethod: logFormData.paymentMethod!,
      note: logFormData.note || 'Manual Settlement',
      adminName: 'Super Admin',
    };

    setDrivers(drivers.map(d => {
      if (d.id === logModal.driverId) {
        let newPayout = d.payoutAmount;
        let newOwned = d.ownedMoney;
        let newDebtStart = d.debtStartedAt;

        if (newLog.type === PayoutType.PAYOUT_TO_DRIVER) {
          newPayout = Math.max(0, newPayout - newLog.amount);
          if (newLog.amount > d.payoutAmount) {
             newOwned += (newLog.amount - d.payoutAmount);
          }
        } else {
          newOwned = Math.max(0, newOwned - newLog.amount);
          if (newLog.amount > d.ownedMoney) {
             newPayout += (newLog.amount - d.ownedMoney);
          }
        }

        // Handle debt aging logic
        if (newOwned > 0 && !newDebtStart) {
          newDebtStart = new Date().toISOString();
        } else if (newOwned === 0) {
          newDebtStart = undefined;
        }

        return {
          ...d,
          payoutAmount: Number(newPayout.toFixed(2)),
          ownedMoney: Number(newOwned.toFixed(2)),
          debtStartedAt: newDebtStart,
          logs: [newLog, ...d.logs]
        };
      }
      return d;
    }));

    setLogModal({ open: false });
  };

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.BANK_TRANSFER: return <Banknote size={14} />;
      case PaymentMethod.CASH: return <Wallet size={14} />;
      case PaymentMethod.MOBILE_MONEY: return <Smartphone size={14} />;
      case PaymentMethod.STRIPE: return <CreditCard size={14} />;
      default: return <History size={14} />;
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500 overflow-x-hidden">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="flex-1 relative z-10">
          <div className="flex items-center gap-2 mb-1">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-200">
                <Receipt size={18} />
             </div>
             <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Settlements & Billing</h1>
          </div>
          <p className="text-xs md:text-sm text-gray-500 font-medium italic">Monitor compliance and aging debt.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 relative z-10">
           <div className="flex items-center gap-2">
             <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-3 bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl border border-transparent transition-all shadow-sm"
             >
                <Settings size={22} />
             </button>
             <div className="hidden sm:block w-px h-10 bg-gray-100 mx-2" />
           </div>
           
           <div className="flex-1 sm:flex-none flex items-center gap-3">
             <div className="flex-1 bg-blue-50 border border-blue-100 p-3 md:p-4 rounded-2xl flex flex-col min-w-[120px]">
                <span className="text-[9px] md:text-[10px] font-black uppercase text-blue-400 tracking-widest mb-1">Payouts</span>
                <span className="text-lg md:text-xl font-black text-blue-600">${drivers.reduce((acc, d) => acc + d.payoutAmount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
             </div>
             <div className="flex-1 bg-amber-50 border border-amber-100 p-3 md:p-4 rounded-2xl flex flex-col min-w-[120px]">
                <span className="text-[9px] md:text-[10px] font-black uppercase text-amber-400 tracking-widest mb-1">Owed</span>
                <span className="text-lg md:text-xl font-black text-amber-600">${drivers.reduce((acc, d) => acc + d.ownedMoney, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
             </div>
           </div>
        </div>
      </header>

      <div className="bg-white rounded-[24px] md:rounded-[40px] shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        {/* Smart Filters & Search Bar */}
        <div className="p-4 md:p-6 bg-gray-50/50 border-b space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-2 px-2">
             <button 
               onClick={() => setActiveFilter('ALL')}
               className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all border ${activeFilter === 'ALL' ? 'bg-gray-900 text-white border-gray-900 shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
             >
                <Filter size={14} /> All
             </button>
             <button 
               onClick={() => setActiveFilter('READY_PAYOUT')}
               className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all border ${activeFilter === 'READY_PAYOUT' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'}`}
             >
                <DollarSign size={14} /> Payout
             </button>
             <button 
               onClick={() => setActiveFilter('HIGH_RISK')}
               className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all border ${activeFilter === 'HIGH_RISK' ? 'bg-red-600 text-white border-red-600 shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:border-red-300'}`}
             >
                <AlertCircle size={14} /> High Risk
             </button>
             <button 
               onClick={() => setActiveFilter('BLOCKED')}
               className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all border ${activeFilter === 'BLOCKED' ? 'bg-amber-600 text-white border-amber-600 shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:border-amber-300'}`}
             >
                <Ban size={14} /> Blocked
             </button>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 w-full">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Find driver..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-[14px] md:rounded-[18px] focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium shadow-inner"
                />
              </div>
              {selectedDrivers.size > 0 && (
                <button 
                  onClick={notifySelected}
                  className="shrink-0 p-2.5 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100 flex items-center justify-center animate-in slide-in-from-left-4"
                  title={`Notify ${selectedDrivers.size} drivers`}
                >
                  <Bell size={18} />
                </button>
              )}
            </div>
            <div className="hidden md:flex gap-3">
               <Button variant="ghost" icon={<Download size={18} />} className="text-[10px] font-black rounded-xl px-5 uppercase tracking-widest">Full Ledger</Button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-gray-50/80 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">
                <th className="px-6 py-4 w-12 text-center">
                   <button onClick={selectAll} className="text-gray-300 hover:text-blue-600 transition-colors">
                      {selectedDrivers.size === filteredDrivers.length && filteredDrivers.length > 0 ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} />}
                   </button>
                </th>
                <th className="px-4 py-4">Driver Entity</th>
                <th className="px-4 py-4 text-center">Trips</th>
                <th className="px-6 py-4">Gross Earned</th>
                <th className="px-6 py-4">Comm & Tax</th>
                <th className="px-6 py-4">Payout Due</th>
                <th className="px-6 py-4">Owned Money</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredDrivers.map(driver => {
                const debtAge = getDebtAge(driver.debtStartedAt);
                const isOverThreshold = driver.ownedMoney > debtThreshold;
                const isVeryOldDebt = debtAge > 14;

                return (
                  <React.Fragment key={driver.id}>
                    <tr 
                      onClick={() => toggleRow(driver.id)}
                      className={`transition-all cursor-pointer group 
                        ${expandedRows.has(driver.id) ? 'bg-blue-50/10' : 'bg-white'} 
                        ${driver.isBlocked ? 'opacity-70 grayscale-[0.5]' : 'opacity-100'} 
                        ${isOverThreshold ? 'bg-red-50/30 hover:bg-red-50/50' : 'hover:bg-blue-50/20'}`}
                    >
                      <td className="relative px-6 py-5 w-12 text-center overflow-hidden">
                        {isOverThreshold && (
                          <div className="absolute left-0 top-0 bottom-0 w-[5px] bg-red-600" />
                        )}
                        <button onClick={(e) => toggleSelection(driver.id, e)} className="text-gray-300 hover:text-blue-600 transition-colors">
                           {selectedDrivers.has(driver.id) ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} />}
                        </button>
                      </td>
                      <td className="px-4 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <div className="relative shrink-0">
                            <img src={driver.avatarUrl} alt="" className="w-10 h-10 rounded-xl object-cover border-2 border-white shadow-sm" />
                            {isOverThreshold && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />}
                          </div>
                          <div>
                            <p className="text-sm font-black text-gray-900 leading-none mb-1">{driver.name}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">ID: {driver.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-5 text-center">
                         <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onNavigateToTrips) onNavigateToTrips(driver.name);
                          }}
                          className="inline-flex items-center justify-center min-w-[48px] text-[10px] font-black text-blue-600 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all shadow-sm"
                         >
                            {driver.completedTrips}
                         </button>
                      </td>
                      <td className="px-6 py-5 text-sm font-black text-gray-900 whitespace-nowrap tracking-tight">${driver.totalEarned.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-5 text-sm font-bold text-red-500 whitespace-nowrap tracking-tight">-${driver.totalCommission.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-5 text-sm font-black text-blue-600 whitespace-nowrap tracking-tight">
                         ${driver.payoutAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                         <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                               <span className={`text-sm font-black ${isOverThreshold ? 'text-red-600' : driver.ownedMoney > 0 ? 'text-amber-600' : 'text-gray-300'}`}>
                                 ${driver.ownedMoney.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                               </span>
                               {isOverThreshold && <AlertCircle size={14} className="text-red-500" />}
                            </div>
                            {driver.ownedMoney > 0 && (
                              <div className="flex items-center gap-1 mt-1">
                                 <Clock size={10} className={isVeryOldDebt ? 'text-red-500' : 'text-gray-400'} />
                                 <span className={`text-[9px] font-black uppercase tracking-widest ${isVeryOldDebt ? 'text-red-500' : 'text-gray-400'}`}>Aging: {debtAge}d</span>
                              </div>
                            )}
                         </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                         {driver.isBlocked ? (
                           <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-red-100">
                              <Ban size={12} /> Blocked
                           </span>
                         ) : (
                           <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-green-100">
                              <UserCheck size={12} /> Active
                           </span>
                         )}
                      </td>
                      <td className="px-6 py-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={(e) => handleBlockToggle(driver.id, e)}
                            className={`p-2 rounded-xl transition-all border ${driver.isBlocked ? 'bg-green-50 text-green-600 border-green-100 hover:bg-green-100' : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'}`}
                          >
                             {driver.isBlocked ? <UserCheck size={16} /> : <Ban size={16} />}
                          </button>
                          <button 
                            onClick={(e) => handleOpenLog(driver.id, e)}
                            className="p-2 bg-gray-900 text-white rounded-xl hover:bg-blue-600 transition-all shadow-md shadow-gray-200"
                          >
                             <Receipt size={16} />
                          </button>
                          <div className="hidden sm:block w-px h-6 bg-gray-100 mx-1" />
                          <button 
                            onClick={(e) => {e.stopPropagation();}}
                            className="hidden sm:block p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <FileText size={18} />
                          </button>
                          <ChevronDown size={16} className={`text-gray-300 transition-transform ${expandedRows.has(driver.id) ? 'rotate-180' : ''}`} />
                        </div>
                      </td>
                    </tr>

                    {expandedRows.has(driver.id) && (
                      <tr className="bg-gray-50/50 animate-in slide-in-from-top-2 duration-300">
                        <td colSpan={9} className="px-4 md:px-10 py-6 md:py-8">
                          <div className="bg-white rounded-[20px] md:rounded-[32px] border border-gray-100 p-4 md:p-8 shadow-sm overflow-hidden">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                               <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                                 <History size={14} className="text-blue-500" /> Authorized Audit Trail
                               </h4>
                               <div className="flex flex-wrap items-center gap-2 md:gap-4">
                                  <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-lg">ID: {driver.id}</p>
                                  <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-lg">Agg: ${driver.logs.reduce((acc, l) => acc + l.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                               </div>
                            </div>

                            {driver.logs.length > 0 ? (
                              <div className="space-y-3">
                                {driver.logs.map(log => (
                                  <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-5 rounded-2xl border border-gray-100 hover:bg-blue-50/20 transition-all border-l-4 border-l-transparent hover:border-l-blue-600 gap-4">
                                    <div className="flex items-center gap-4">
                                      <div className={`p-2.5 rounded-xl shrink-0 ${log.type === PayoutType.PAYOUT_TO_DRIVER ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                                        {getPaymentMethodIcon(log.paymentMethod)}
                                      </div>
                                      <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                           <p className="text-[11px] font-black text-gray-900 uppercase tracking-tight">{log.type === PayoutType.PAYOUT_TO_DRIVER ? 'Platform Payout' : 'Manual Collection'}</p>
                                           <span className="text-[8px] md:text-[9px] font-black text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded uppercase tracking-widest">{log.paymentMethod.replace('_', ' ')}</span>
                                        </div>
                                        <p className="text-[10px] text-gray-500 font-medium italic truncate max-w-[200px]">{log.note}</p>
                                      </div>
                                    </div>
                                    <div className="text-right sm:text-right flex flex-row sm:flex-col justify-between items-center sm:items-end border-t sm:border-t-0 pt-3 sm:pt-0">
                                      <p className={`text-sm md:text-base font-black ${log.type === PayoutType.PAYOUT_TO_DRIVER ? 'text-blue-600' : 'text-amber-600'}`}>
                                        {log.type === PayoutType.PAYOUT_TO_DRIVER ? '-' : '+'}${log.amount.toFixed(2)}
                                      </p>
                                      <p className="text-[8px] md:text-[9px] font-bold uppercase tracking-tighter text-gray-400 mt-1">{log.date} • {log.adminName}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-12 md:py-16 flex flex-col items-center bg-gray-50/50 rounded-[20px] md:rounded-[24px] border border-dashed border-gray-200">
                                 <div className="p-3 bg-white rounded-xl shadow-sm mb-4">
                                    <Receipt size={24} className="text-gray-300" />
                                 </div>
                                 <p className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-gray-900 mb-1">Zero Transactions</p>
                                 <p className="text-[9px] text-gray-400 font-medium italic mb-6">No historical payouts exist.</p>
                                 <Button 
                                   variant="black" 
                                   icon={<Plus size={16} />} 
                                   className="rounded-xl px-4 md:px-6 h-9 md:h-10 text-[9px] md:text-[10px] uppercase font-black"
                                   onClick={(e) => handleOpenLog(driver.id, e)}
                                 >
                                    Initiate First
                                 </Button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial Settings Modal */}
      <Modal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        title="Fleet Controls"
      >
        <div className="space-y-6">
           <div>
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-4">Risk Monitoring Threshold</label>
              <div className="bg-gray-50 p-6 rounded-[24px] border border-gray-100 mb-6">
                 <div className="flex justify-between items-end mb-6">
                    <div>
                       <p className="text-sm font-black text-gray-900 leading-none">High-Risk Limit</p>
                    </div>
                    <span className="text-xl font-black text-blue-600 tracking-tighter">${debtThreshold}</span>
                 </div>
                 <input 
                  type="range" 
                  min="0" 
                  max="2000" 
                  step="50" 
                  value={debtThreshold} 
                  onChange={e => setDebtThreshold(parseInt(e.target.value))} 
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                 />
              </div>
              <p className="text-[10px] text-gray-500 italic leading-relaxed px-2 text-center">
                Rows are flagged when debt exceeds this limit.
              </p>
           </div>
           <div className="pt-4 border-t border-gray-100">
              <Button variant="black" fullWidth className="rounded-xl h-12 uppercase tracking-widest text-[10px] font-black shadow-xl" onClick={() => setIsSettingsOpen(false)}>Save Settings</Button>
           </div>
        </div>
      </Modal>

      {/* Settlement Execution Modal */}
      <Modal 
        isOpen={logModal.open} 
        onClose={() => setLogModal({ open: false })} 
        title="Account Settlement"
      >
        <div className="space-y-5">
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
             <div className="flex items-center gap-3">
                <img src={activeDriverForModal?.avatarUrl} className="w-9 h-9 rounded-lg border-2 border-white shadow-sm" alt="" />
                <div>
                   <span className="text-xs font-black text-gray-900 block truncate max-w-[120px]">{activeDriverForModal?.name}</span>
                   <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Balance Check</span>
                </div>
             </div>
             <div className="text-right shrink-0">
                <p className={`text-base font-black tracking-tight ${activeDriverForModal?.payoutAmount! > 0 ? 'text-blue-600' : 'text-amber-600'}`}>
                   ${(activeDriverForModal?.payoutAmount || activeDriverForModal?.ownedMoney || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
             </div>
          </div>

          <div className="space-y-4">
            <Select 
              label="Transaction Action"
              options={[
                { value: PayoutType.PAYOUT_TO_DRIVER, label: 'Platform Payout' },
                { value: PayoutType.COLLECT_FROM_DRIVER, label: 'Manual Collection' }
              ]}
              value={logFormData.type}
              onChange={e => setLogFormData({...logFormData, type: e.target.value as PayoutType})}
              className="h-12 font-semibold text-xs rounded-xl"
            />

            <Select 
              label="Payment Channel"
              options={[
                { value: PaymentMethod.BANK_TRANSFER, label: 'Wire / Bank Transfer' },
                { value: PaymentMethod.CASH, label: 'Physical Cash' },
                { value: PaymentMethod.MOBILE_MONEY, label: 'Mobile Money' },
                { value: PaymentMethod.STRIPE, label: 'Stripe' }
              ]}
              value={logFormData.paymentMethod}
              onChange={e => setLogFormData({...logFormData, paymentMethod: e.target.value as PaymentMethod})}
              className="h-12 font-semibold text-xs rounded-xl"
            />
            
            <div className="relative group">
              <Input 
                label="Authorize Amount" 
                type="number" 
                placeholder="0.00" 
                value={logFormData.amount}
                onChange={e => setLogFormData({...logFormData, amount: parseFloat(e.target.value) || 0})}
                className="h-12 font-black text-base pr-20 rounded-xl"
              />
              <button 
                onClick={() => setLogFormData({...logFormData, amount: activeDriverForModal?.payoutAmount || activeDriverForModal?.ownedMoney || 0})}
                className="absolute right-4 top-[42px] text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline bg-blue-50 px-2 py-1 rounded transition-all"
              >
                Clear
              </button>
            </div>

            <Input 
              label="Note" 
              placeholder="e.g. Bank Transfer ID" 
              value={logFormData.note}
              onChange={e => setLogFormData({...logFormData, note: e.target.value})}
              className="h-12 font-medium text-xs rounded-xl"
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t border-gray-100">
            <Button variant="secondary" className="rounded-xl h-11 w-full sm:w-auto" onClick={() => setLogModal({ open: false })}>Cancel</Button>
            <Button variant="black" className="rounded-xl h-11 w-full sm:w-auto font-black uppercase tracking-widest text-[10px]" onClick={handleSaveLog}>Authorize</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
