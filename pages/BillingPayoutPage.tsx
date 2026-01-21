
import React, { useState, useMemo, useRef } from 'react';
import { 
  Search, ArrowLeft, ArrowDownLeft, ArrowRight,
  ChevronRight, CheckCircle2, Receipt, 
  History, Download, Ban, UserCheck, 
  Clock, User, DollarSign, Settings, Bell, AlertTriangle,
  ChevronLeft, PieChart, TrendingUp, Landmark, Edit2, Trash2,
  Navigation, Smartphone, CreditCard, Banknote, ListFilter,
  UploadCloud, Paperclip, FileText, Image as ImageIcon, X, ExternalLink
} from 'lucide-react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { DriverBilling, PayoutLog, PayoutType, PaymentMethod } from '../types';

type BillingFilter = 'ALL' | 'PAYOUT' | 'DEBT' | 'HIGH_RISK';

const MOCK_TRIP_LEDGER = [
  { id: 'T-8821', date: '2024-03-20', driverName: 'Nolan Walker', pickup: 'Downtown Plaza', dropoff: 'City Airport', fare: 45.00, method: 'CARD' },
  { id: 'T-8822', date: '2024-03-20', driverName: 'Sarah Jenkins', pickup: 'West End', dropoff: 'Central Station', fare: 12.50, method: 'CASH' },
  { id: 'T-8824', date: '2024-03-19', driverName: 'Nolan Walker', pickup: 'Shopping Mall', dropoff: 'Residence A', fare: 15.20, method: 'MOBILE_MONEY' },
  { id: 'T-8826', date: '2024-03-19', driverName: 'Nolan Walker', pickup: 'Airport Terminal 1', dropoff: 'Hilton Hotel', fare: 35.00, method: 'MOBILE_MONEY' },
];

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
      { id: 'l1', date: '2024-03-01', amount: 1000.00, type: PayoutType.PAYOUT_TO_DRIVER, paymentMethod: PaymentMethod.BANK_TRANSFER, note: 'Partial Monthly Settlement', adminName: 'Admin Mike', proofUrl: 'https://picsum.photos/400/600?random=1' }
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
    debtStartedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
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

export const BillingPayoutPage: React.FC<{ onNavigateToTrips?: (filter: string) => void }> = () => {
  const [drivers, setDrivers] = useState<DriverBilling[]>(MOCK_BILLING_DATA);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(MOCK_BILLING_DATA[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<BillingFilter>('ALL');
  const [isMobileDetailView, setIsMobileDetailView] = useState(false);
  const [debtThreshold, setDebtThreshold] = useState(500);
  
  // Modals
  const [logModal, setLogModal] = useState<{ open: boolean; type?: PayoutType; editLogId?: string }>({ open: false });
  const [tripsModal, setTripsModal] = useState(false);
  const [settingsModal, setSettingsModal] = useState(false);
  const [notifyModal, setNotifyModal] = useState(false);
  const [proofViewer, setProofViewer] = useState<{ open: boolean; url?: string }>({ open: false });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [proofFile, setProofFile] = useState<string | null>(null);

  const [logFormData, setLogFormData] = useState<Partial<PayoutLog>>({
    amount: 0,
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
      if (activeFilter === 'PAYOUT') return d.payoutAmount > 0;
      if (activeFilter === 'DEBT') return d.ownedMoney > 0;
      if (activeFilter === 'HIGH_RISK') return d.ownedMoney > debtThreshold;
      return true;
    });
  }, [drivers, searchQuery, activeFilter, debtThreshold]);

  const selectedDriver = useMemo(() => {
    return drivers.find(d => d.id === selectedDriverId);
  }, [drivers, selectedDriverId]);

  const driverTrips = useMemo(() => {
    if (!selectedDriver) return [];
    return MOCK_TRIP_LEDGER.filter(t => t.driverName === selectedDriver.name);
  }, [selectedDriver]);

  const handleOpenLog = (type: PayoutType, log?: PayoutLog) => {
    if (!selectedDriver) return;
    if (log) {
      setLogFormData({ 
        amount: log.amount, 
        paymentMethod: log.paymentMethod, 
        note: log.note 
      });
      setProofFile(log.proofUrl || null);
      setLogModal({ open: true, type: log.type, editLogId: log.id });
    } else {
      setLogFormData({ 
        amount: type === PayoutType.PAYOUT_TO_DRIVER ? selectedDriver.payoutAmount : selectedDriver.ownedMoney, 
        paymentMethod: PaymentMethod.BANK_TRANSFER, 
        note: '' 
      });
      setProofFile(null);
      setLogModal({ open: true, type });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveLog = () => {
    if (!selectedDriverId || !logFormData.amount || !logModal.type) return;

    setDrivers(prevDrivers => prevDrivers.map(d => {
      if (d.id === selectedDriverId) {
        let newLogs = [...d.logs];
        let newPayout = d.payoutAmount;
        let newOwned = d.ownedMoney;

        if (logModal.editLogId) {
          const oldLog = d.logs.find(l => l.id === logModal.editLogId);
          if (oldLog) {
            if (oldLog.type === PayoutType.PAYOUT_TO_DRIVER) newPayout += oldLog.amount;
            else newOwned += oldLog.amount;
            if (logModal.type === PayoutType.PAYOUT_TO_DRIVER) newPayout -= logFormData.amount!;
            else newOwned -= logFormData.amount!;
            newLogs = newLogs.map(l => l.id === logModal.editLogId ? {
              ...l,
              amount: logFormData.amount!,
              paymentMethod: logFormData.paymentMethod!,
              note: logFormData.note || 'Account Settlement',
              proofUrl: proofFile || undefined
            } : l);
          }
        } else {
          const newLog: PayoutLog = {
            id: `TX-${Math.floor(Math.random() * 10000)}`,
            date: new Date().toISOString().split('T')[0],
            amount: logFormData.amount!,
            type: logModal.type!,
            paymentMethod: logFormData.paymentMethod!,
            note: logFormData.note || 'Account Settlement',
            adminName: 'Super Admin',
            proofUrl: proofFile || undefined
          };
          if (newLog.type === PayoutType.PAYOUT_TO_DRIVER) newPayout -= newLog.amount;
          else newOwned -= newLog.amount;
          newLogs = [newLog, ...newLogs];
        }

        return { 
          ...d, 
          payoutAmount: Number(Math.max(0, newPayout).toFixed(2)), 
          ownedMoney: Number(Math.max(0, newOwned).toFixed(2)), 
          logs: newLogs 
        };
      }
      return d;
    }));
    setLogModal({ open: false });
    setProofFile(null);
  };

  // Fix: Defined missing handleNotify function to set notification modal visibility
  const handleNotify = () => {
    setNotifyModal(true);
  };

  const handleDeleteLog = (logId: string) => {
    if (!confirm('Are you sure you want to delete this transaction? This will revert the balance impact.')) return;
    setDrivers(prevDrivers => prevDrivers.map(d => {
      if (d.id === selectedDriverId) {
        const logToDelete = d.logs.find(l => l.id === logId);
        if (!logToDelete) return d;
        let newPayout = d.payoutAmount;
        let newOwned = d.ownedMoney;
        if (logToDelete.type === PayoutType.PAYOUT_TO_DRIVER) newPayout += logToDelete.amount;
        else newOwned += logToDelete.amount;
        return {
          ...d,
          payoutAmount: Number(newPayout.toFixed(2)),
          ownedMoney: Number(newOwned.toFixed(2)),
          logs: d.logs.filter(l => l.id !== logId)
        };
      }
      return d;
    }));
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
      <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
            <Receipt size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-none">Billing & Payouts</h1>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-black">Audit Control</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex gap-6 items-center">
            <div className="flex flex-col text-right">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Disbursed</span>
              <span className="text-sm font-bold text-gray-900">${drivers.reduce((acc, d) => acc + d.payoutAmount, 0).toLocaleString()}</span>
            </div>
            <div className="flex flex-col text-right border-l border-gray-100 pl-6">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Active Debt</span>
              <span className="text-sm font-bold text-amber-600">${drivers.reduce((acc, d) => acc + d.ownedMoney, 0).toLocaleString()}</span>
            </div>
          </div>
          <button onClick={() => setSettingsModal(true)} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all border border-transparent hover:border-gray-200">
            <Settings size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className={`w-full lg:w-[320px] bg-white border-r border-gray-200 flex flex-col shrink-0 transition-all ${isMobileDetailView ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}`}>
          <div className="p-4 border-b border-gray-50 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input 
                type="text" 
                placeholder="Find driver..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
            <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
              {['ALL', 'PAYOUT', 'DEBT', 'HIGH_RISK'].map(f => (
                <button 
                  key={f}
                  onClick={() => setActiveFilter(f as BillingFilter)}
                  className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeFilter === f ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-400 hover:text-gray-900 bg-gray-50'}`}
                >
                  {f.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-gray-50">
            {filteredDrivers.map(driver => (
              <button 
                key={driver.id}
                onClick={() => { setSelectedDriverId(driver.id); setIsMobileDetailView(true); }}
                className={`w-full flex items-center gap-3 p-4 text-left transition-all ${selectedDriverId === driver.id ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}
              >
                <div className="relative shrink-0">
                  <img src={driver.avatarUrl} className="w-9 h-9 rounded-full object-cover border border-gray-100 shadow-sm" alt="" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{driver.name}</p>
                  <p className="text-[10px] text-gray-400 font-medium">ID: {driver.id}</p>
                </div>
                <div className="text-right">
                  {driver.payoutAmount > 0 ? (
                    <p className="text-xs font-bold text-blue-600">${driver.payoutAmount.toFixed(0)}</p>
                  ) : (
                    <p className={`text-xs font-bold ${driver.ownedMoney > debtThreshold ? 'text-red-500' : 'text-amber-600'}`}>
                      ${driver.ownedMoney.toFixed(0)}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className={`flex-1 flex flex-col bg-white transition-all fixed inset-0 lg:relative ${isMobileDetailView ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
          {selectedDriver ? (
            <div className="flex flex-col h-full bg-white">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button onClick={() => setIsMobileDetailView(false)} className="p-2 -ml-2 text-gray-400 hover:text-gray-900 bg-gray-50 lg:hidden rounded-lg transition-all">
                    <ChevronLeft size={24} />
                  </button>
                  <img src={selectedDriver.avatarUrl} className="w-14 h-14 rounded-xl object-cover shadow-sm border border-gray-100" alt="" />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 leading-none">{selectedDriver.name}</h2>
                    <p className="text-[10px] text-gray-400 font-black mt-2 uppercase tracking-widest">Driver Account: {selectedDriver.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" className="rounded-xl px-4 h-11 text-[10px] font-black uppercase tracking-widest border border-gray-200" icon={<ListFilter size={16}/>} onClick={() => setTripsModal(true)}>Trip Ledger</Button>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${selectedDriver.isBlocked ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                    {selectedDriver.isBlocked ? 'Blocked' : 'Active'}
                  </span>
                </div>
              </div>

              <div className="p-6 md:p-8 bg-gray-50/50 border-b border-gray-100">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1"><TrendingUp size={10} /> Gross Earned</p>
                    <p className="text-lg font-black text-gray-900">${selectedDriver.totalEarned.toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1"><PieChart size={10} /> Commission</p>
                    <p className="text-lg font-black text-gray-900">-${selectedDriver.totalCommission.toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Landmark size={10} /> Est. Tax</p>
                    <p className="text-lg font-black text-gray-900">-$42.00</p>
                  </div>
                  <div className={`p-4 rounded-2xl border shadow-sm ${selectedDriver.payoutAmount > 0 ? 'bg-blue-50 border-blue-100' : 'bg-white border-gray-200'}`}>
                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-2">Net Wallet</p>
                    <p className={`text-lg font-black ${selectedDriver.ownedMoney > 0 ? 'text-amber-600' : 'text-blue-700'}`}>
                      ${(selectedDriver.payoutAmount - selectedDriver.ownedMoney).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Available Payout</p>
                      <p className="text-2xl font-black text-gray-900">${selectedDriver.payoutAmount.toFixed(2)}</p>
                    </div>
                    <Button variant="black" className="rounded-xl px-6 h-11 text-xs font-black uppercase tracking-widest" disabled={selectedDriver.payoutAmount <= 0} onClick={() => handleOpenLog(PayoutType.PAYOUT_TO_DRIVER)}>Disburse</Button>
                  </div>
                  <div className={`p-5 rounded-2xl border shadow-sm flex items-center justify-between ${selectedDriver.ownedMoney > debtThreshold ? 'bg-red-50 border-red-100' : 'bg-white border-gray-200'}`}>
                    <div>
                      <div className="flex items-center gap-2">
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Current Debt</p>
                         {selectedDriver.ownedMoney > 0 && <span className="text-[9px] text-amber-600 font-bold tracking-tighter flex items-center gap-1"><Clock size={10} /> {getDebtAge(selectedDriver.debtStartedAt)}d</span>}
                      </div>
                      <p className={`text-2xl font-black ${selectedDriver.ownedMoney > debtThreshold ? 'text-red-600' : 'text-gray-900'}`}>${selectedDriver.ownedMoney.toFixed(2)}</p>
                    </div>
                    <div className="flex gap-2">
                       <Button variant="secondary" className="rounded-xl px-4 h-11" onClick={handleNotify}><Bell size={16} /></Button>
                       <Button variant="secondary" className="rounded-xl px-6 h-11 text-xs font-black uppercase tracking-widest" disabled={selectedDriver.ownedMoney <= 0} onClick={() => handleOpenLog(PayoutType.COLLECT_FROM_DRIVER)}>Collect</Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col overflow-hidden p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><History size={14} /> Settlement History</h3>
                  <button className="text-[10px] font-black text-blue-600 hover:underline flex items-center gap-1 uppercase tracking-widest"><Download size={12} /> Get CSV</button>
                </div>
                <div className="flex-1 overflow-y-auto border border-gray-100 rounded-2xl bg-white shadow-sm overflow-hidden no-scrollbar">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-gray-50 text-[10px] font-black text-gray-400 uppercase border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-left">Date</th>
                        <th className="px-6 py-4 text-left">Type</th>
                        <th className="px-6 py-4 text-left">Channel</th>
                        <th className="px-6 py-4 text-right">Amount</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {selectedDriver.logs.map(log => (
                        <tr key={log.id} className="hover:bg-gray-50/50 group">
                          <td className="px-6 py-4 text-gray-500 font-medium whitespace-nowrap">{log.date}</td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${log.type === PayoutType.PAYOUT_TO_DRIVER ? 'text-blue-500' : 'text-amber-500'}`}>{log.type === PayoutType.PAYOUT_TO_DRIVER ? 'Disbursed' : 'Collected'}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                               <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{log.paymentMethod.replace('_', ' ')}</span>
                               {log.proofUrl && (
                                 <button 
                                  onClick={() => setProofViewer({ open: true, url: log.proofUrl })}
                                  className="p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                                  title="View Proof"
                                 >
                                   <Paperclip size={12} />
                                 </button>
                               )}
                            </div>
                          </td>
                          <td className={`px-6 py-4 text-right font-black ${log.type === PayoutType.PAYOUT_TO_DRIVER ? 'text-gray-900' : 'text-red-500'}`}>
                            {log.type === PayoutType.PAYOUT_TO_DRIVER ? '-' : '+'}${log.amount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleOpenLog(log.type, log)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit2 size={14} /></button>
                              <button onClick={() => handleDeleteLog(log.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
               <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4"><User size={32} strokeWidth={1} className="opacity-20" /></div>
               <p className="text-[10px] font-black uppercase tracking-widest">Select Account</p>
            </div>
          )}
        </div>
      </div>

      <Modal 
        isOpen={logModal.open} 
        onClose={() => setLogModal({ open: false })} 
        title={logModal.editLogId ? "Modify Transaction" : (logModal.type === PayoutType.PAYOUT_TO_DRIVER ? "Commit Disbursement" : "Record Collection")}
      >
        <div className="space-y-6 max-h-[80vh] no-scrollbar overflow-y-auto pr-1">
          <div className="p-4 bg-gray-900 text-white rounded-[24px] flex items-center gap-3 shadow-xl">
            <img src={selectedDriver?.avatarUrl} className="w-10 h-10 rounded-xl border border-white/10" alt="" />
            <div>
              <p className="text-xs font-black leading-none">{selectedDriver?.name}</p>
              <p className="text-[9px] text-gray-400 mt-1 uppercase font-black tracking-widest">{logModal.editLogId ? 'Administrative Override' : 'Admin Clearance'}</p>
            </div>
          </div>

          <div className="space-y-4">
            <Select 
              label="Asset Channel" 
              options={[
                { value: PaymentMethod.BANK_TRANSFER, label: 'Swift / Bank' }, 
                { value: PaymentMethod.CASH, label: 'Physical Cash' }, 
                { value: PaymentMethod.MOBILE_MONEY, label: 'M-Pesa / Mobile' }, 
                { value: PaymentMethod.STRIPE, label: 'Stripe / Card' }
              ]} 
              value={logFormData.paymentMethod} 
              onChange={e => setLogFormData({...logFormData, paymentMethod: e.target.value as PaymentMethod})} 
              className="h-12 text-xs font-black uppercase" 
            />

            <div className="relative">
              <Input 
                label="Transfer Amount" 
                type="number" 
                value={logFormData.amount} 
                onChange={e => setLogFormData({...logFormData, amount: parseFloat(e.target.value) || 0})} 
                className="h-14 font-black text-xl pr-16 rounded-[18px]" 
              />
              <button 
                onClick={() => setLogFormData({...logFormData, amount: logModal.type === PayoutType.PAYOUT_TO_DRIVER ? selectedDriver?.payoutAmount : selectedDriver?.ownedMoney})} 
                className="absolute right-4 top-11 text-[10px] font-black text-blue-600 uppercase tracking-widest"
              >
                Max
              </button>
            </div>

            <Input 
              label="Internal Memo" 
              placeholder="Ref code or notes..." 
              value={logFormData.note} 
              onChange={e => setLogFormData({...logFormData, note: e.target.value})} 
              className="h-12 text-xs" 
            />

            {/* Attachment Proof Section */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Transaction Proof</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-6 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group ${proofFile ? 'border-blue-400 bg-blue-50/30' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*,.pdf" 
                  onChange={handleFileChange} 
                />
                
                {proofFile ? (
                  <div className="w-full flex flex-col items-center gap-2">
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-blue-200 bg-white">
                      {proofFile.startsWith('data:image') ? (
                        <img src={proofFile} className="w-full h-full object-cover" alt="Proof" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-blue-600">
                          <FileText size={24} />
                        </div>
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); setProofFile(null); }}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full shadow-lg"
                      >
                        <X size={10} />
                      </button>
                    </div>
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Document Attached</span>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 group-hover:text-blue-500 group-hover:bg-blue-50 transition-all">
                      <UploadCloud size={24} />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-gray-900 uppercase tracking-widest">Upload Receipt</p>
                      <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-tighter">PDF or Images up to 5MB</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-50 mt-4">
            <Button variant="ghost" onClick={() => setLogModal({ open: false })} className="text-[10px] font-black uppercase">Cancel</Button>
            <Button variant="black" onClick={handleSaveLog} className="px-8 h-12 text-[10px] font-black uppercase tracking-widest shadow-xl">
              {logModal.editLogId ? 'Commit Changes' : 'Execute Transaction'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Proof Image Viewer */}
      <Modal isOpen={proofViewer.open} onClose={() => setProofViewer({ open: false })} title="Transaction Audit Proof">
         <div className="flex flex-col items-center gap-6 py-4">
            <div className="w-full bg-gray-50 rounded-[32px] overflow-hidden border border-gray-100 shadow-inner flex items-center justify-center min-h-[300px]">
               {proofViewer.url?.startsWith('data:image') || proofViewer.url?.includes('picsum') ? (
                  <img src={proofViewer.url} className="max-w-full max-h-[500px] object-contain" alt="Transaction Proof" />
               ) : (
                  <div className="flex flex-col items-center gap-4 text-gray-400">
                     <FileText size={64} strokeWidth={1} />
                     <p className="text-xs font-black uppercase tracking-widest">PDF Document</p>
                  </div>
               )}
            </div>
            <div className="w-full flex justify-between items-center bg-gray-900 p-6 rounded-[24px] text-white">
               <div>
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Document Status</p>
                  <p className="text-sm font-bold flex items-center gap-2"><CheckCircle2 size={16} className="text-green-400" /> Verified Audit Document</p>
               </div>
               <Button variant="secondary" className="bg-white/10 border-white/20 text-white hover:bg-white/20 px-4 h-10 rounded-xl" onClick={() => window.open(proofViewer.url, '_blank')}><ExternalLink size={16}/></Button>
            </div>
         </div>
      </Modal>

      {/* Driver Completed Trips Ledger Modal */}
      <Modal isOpen={tripsModal} onClose={() => setTripsModal(false)} title="Completed Trip Ledger">
        <div className="space-y-4 max-h-[70vh] no-scrollbar overflow-y-auto pr-1">
          <div className="p-5 bg-gray-900 text-white rounded-[32px] flex items-center justify-between shadow-xl">
             <div>
               <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Driver Partner</p>
               <h3 className="text-xl font-black tracking-tight">{selectedDriver?.name}</h3>
             </div>
             <div className="text-right">
               <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Trips Scoped</p>
               <p className="text-xl font-black">{driverTrips.length}</p>
             </div>
          </div>
          
          <div className="space-y-3">
             {driverTrips.map(trip => (
               <div key={trip.id} className="p-5 bg-white border border-gray-100 rounded-[24px] shadow-sm flex flex-col gap-3 group hover:border-blue-200 transition-all">
                  <div className="flex justify-between items-start">
                     <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">{trip.date}</span>
                        <h4 className="text-sm font-black text-gray-900 tracking-tight">{trip.id}</h4>
                     </div>
                     <div className="text-right">
                        <span className="text-lg font-black text-gray-900 tracking-tighter">${trip.fare.toFixed(2)}</span>
                        <div className="flex items-center justify-end gap-1.5 mt-1">
                           {trip.method === 'CARD' ? <CreditCard size={12} className="text-blue-500" /> : trip.method === 'CASH' ? <Banknote size={12} className="text-green-500" /> : <Smartphone size={12} className="text-amber-500" />}
                           <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{trip.method.replace('_', ' ')}</span>
                        </div>
                     </div>
                  </div>
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
                     <div className="flex flex-col items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <div className="w-0.5 h-3 bg-gray-100" />
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-gray-500 truncate">{trip.pickup}</p>
                        <p className="text-[10px] font-bold text-gray-500 truncate mt-1">{trip.dropoff}</p>
                     </div>
                  </div>
               </div>
             ))}
             {driverTrips.length === 0 && (
               <div className="py-20 flex flex-col items-center justify-center grayscale opacity-30 text-center">
                  <Navigation size={48} strokeWidth={1} className="mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No completed trips found in history</p>
               </div>
             )}
          </div>
        </div>
      </Modal>

      <Modal isOpen={settingsModal} onClose={() => setSettingsModal(false)} title="Market Policy">
        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100 shadow-inner">
             <div className="flex justify-between items-center mb-6">
               <p className="text-xs font-black text-gray-900 uppercase tracking-widest">Debt Limit</p>
               <span className="text-2xl font-black text-red-600 tracking-tighter">${debtThreshold}</span>
             </div>
             <input type="range" min="100" max="2000" step="100" value={debtThreshold} onChange={e => setDebtThreshold(parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-gray-900" />
          </div>
          <Button variant="black" fullWidth onClick={() => setSettingsModal(false)} className="h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl">Commit Policy</Button>
        </div>
      </Modal>

      {/* Fix: Added missing notification modal implementation */}
      <Modal isOpen={notifyModal} onClose={() => setNotifyModal(false)} title="Send Payment Reminder">
        <div className="space-y-6">
          <div className="p-6 bg-amber-50 rounded-[32px] border border-amber-100 flex flex-col items-center text-center">
             <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
                <Bell size={32} />
             </div>
             <h3 className="text-lg font-black text-gray-900 mb-2">Notice of Outstanding Balance</h3>
             <p className="text-xs text-gray-500 font-medium leading-relaxed">
               A push notification and email will be sent to <strong>{selectedDriver?.name}</strong> regarding the current debt of <strong>${selectedDriver?.ownedMoney.toFixed(2)}</strong>.
             </p>
          </div>
          <div className="space-y-4">
             <Input label="Custom Message (Optional)" placeholder="Please settle your balance to avoid account suspension..." />
          </div>
          <Button variant="black" fullWidth onClick={() => setNotifyModal(false)} className="h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl">Send Alert Now</Button>
        </div>
      </Modal>
    </div>
  );
};
