
import React, { useState, useMemo, useRef } from 'react';
import { 
  Search, ArrowLeft, ArrowDownLeft, ArrowRight,
  ChevronRight, CheckCircle2, Receipt, 
  History, Download, Ban, UserCheck, 
  Clock, User, DollarSign, Settings, Bell, AlertTriangle,
  ChevronLeft, PieChart, TrendingUp, Landmark, Edit2, Trash2,
  Navigation, Smartphone, CreditCard, Banknote, ListFilter,
  UploadCloud, Paperclip, FileText, Image as ImageIcon, X, ExternalLink,
  Wallet, ArrowUpRight, ShieldCheck
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
];

const MOCK_BILLING_DATA: DriverBilling[] = [
  {
    id: 'D-9021',
    name: 'Nolan Walker',
    avatarUrl: 'https://i.pravatar.cc/150?u=D-9021',
    completedTrips: 124,
    totalEarned: 12840.50,
    walletBalance: 2450.75,
    isBlocked: false,
    logs: [
      { id: 'l1', date: '2024-03-21', amount: 1000.00, type: PayoutType.PAYOUT_TO_DRIVER, paymentMethod: PaymentMethod.BANK_TRANSFER, note: 'Manual Payout: Weekly Settlement', adminName: 'Admin Mike', proofUrl: 'https://picsum.photos/400/600?random=1' },
      { id: 'l_trip1', date: '2024-03-20', amount: 36.00, type: PayoutType.TRIP_EARNING_ONLINE, paymentMethod: PaymentMethod.WALLET, note: 'T-8821 Online Net (System)', adminName: 'System' },
      { id: 'l_trip2', date: '2024-03-20', amount: 2.50, type: PayoutType.TRIP_COMMISSION_CASH, paymentMethod: PaymentMethod.CASH, note: 'T-8822 Cash Comm. (System)', adminName: 'System' },
    ]
  },
  {
    id: 'D-8842',
    name: 'Sarah Jenkins',
    avatarUrl: 'https://i.pravatar.cc/150?u=D-8842',
    completedTrips: 89,
    totalEarned: 3100.20,
    walletBalance: -850.00,
    debtStartedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    isBlocked: false,
    logs: [
      { id: 'l2', date: '2024-03-10', amount: 50.00, type: PayoutType.COLLECT_FROM_DRIVER, paymentMethod: PaymentMethod.CASH, note: 'Office Cash Deposit', adminName: 'Admin Sarah' },
    ]
  },
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
  const [settingsModal, setSettingsModal] = useState(false);
  const [notifyModal, setNotifyModal] = useState(false);

  const [logFormData, setLogFormData] = useState<Partial<PayoutLog>>({
    amount: 0,
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    note: '',
  });

  const filteredDrivers = useMemo(() => {
    return drivers.filter(d => {
      const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.id.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (activeFilter === 'PAYOUT') return d.walletBalance > 0;
      if (activeFilter === 'DEBT') return d.walletBalance < 0;
      if (activeFilter === 'HIGH_RISK') return d.walletBalance < -debtThreshold;
      return true;
    });
  }, [drivers, searchQuery, activeFilter, debtThreshold]);

  const selectedDriver = useMemo(() => {
    return drivers.find(d => d.id === selectedDriverId);
  }, [drivers, selectedDriverId]);

  const handleOpenLog = (type: PayoutType) => {
    if (!selectedDriver) return;
    setLogFormData({ 
      amount: Math.abs(selectedDriver.walletBalance), 
      paymentMethod: PaymentMethod.BANK_TRANSFER, 
      note: '' 
    });
    setLogModal({ open: true, type });
  };

  const handleSaveLog = () => {
    if (!selectedDriverId || !logFormData.amount || !logModal.type) return;

    setDrivers(prevDrivers => prevDrivers.map(d => {
      if (d.id === selectedDriverId) {
        let newBalance = d.walletBalance;
        const newLog: PayoutLog = {
          id: `TX-${Math.floor(Math.random() * 10000)}`,
          date: new Date().toISOString().split('T')[0],
          amount: logFormData.amount!,
          type: logModal.type!,
          paymentMethod: logFormData.paymentMethod!,
          note: logFormData.note || 'Manual Settlement',
          adminName: 'Super Admin',
        };
        
        if (newLog.type === PayoutType.PAYOUT_TO_DRIVER) newBalance -= newLog.amount;
        else if (newLog.type === PayoutType.COLLECT_FROM_DRIVER) newBalance += newLog.amount;
        
        return { ...d, walletBalance: Number(newBalance.toFixed(2)), logs: [newLog, ...d.logs] };
      }
      return d;
    }));
    setLogModal({ open: false });
  };

  const handleDeleteLog = (logId: string) => {
    if (!confirm('Revert this transaction? Wallet Balance will be updated.')) return;
    setDrivers(prevDrivers => prevDrivers.map(d => {
      if (d.id === selectedDriverId) {
        const logToDelete = d.logs.find(l => l.id === logId);
        if (!logToDelete) return d;
        let newBalance = d.walletBalance;
        if (logToDelete.type === PayoutType.PAYOUT_TO_DRIVER) newBalance += logToDelete.amount;
        else if (logToDelete.type === PayoutType.COLLECT_FROM_DRIVER) newBalance -= logToDelete.amount;
        return { ...d, walletBalance: Number(newBalance.toFixed(2)), logs: d.logs.filter(l => l.id !== logId) };
      }
      return d;
    }));
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
      {/* Admin Header */}
      <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white shadow-lg">
            <Wallet size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-none">Wallet Governance</h1>
            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-black">Admin Panel</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2">
             <ShieldCheck size={14} /> Total Float: ${drivers.reduce((acc, d) => acc + d.walletBalance, 0).toLocaleString()}
          </div>
          <button onClick={() => setSettingsModal(true)} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all border border-transparent hover:border-gray-200">
            <Settings size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Driver Selection Sidebar */}
        <div className={`w-full lg:w-[320px] bg-white border-r border-gray-200 flex flex-col shrink-0 transition-all ${isMobileDetailView ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}`}>
          <div className="p-4 border-b border-gray-50 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input type="text" placeholder="Search accounts..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500 transition-all" />
            </div>
            <div className="flex gap-1 overflow-x-auto no-scrollbar">
              {['ALL', 'PAYOUT', 'DEBT', 'HIGH_RISK'].map(f => (
                <button key={f} onClick={() => setActiveFilter(f as BillingFilter)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${activeFilter === f ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-400 bg-gray-50'}`}>{f.replace('_', ' ')}</button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-gray-50">
            {filteredDrivers.map(driver => (
              <button key={driver.id} onClick={() => { setSelectedDriverId(driver.id); setIsMobileDetailView(true); }} className={`w-full flex items-center gap-4 p-4 text-left transition-all ${selectedDriverId === driver.id ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}>
                <img src={driver.avatarUrl} className="w-10 h-10 rounded-xl object-cover border border-gray-100 shadow-sm" alt="" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{driver.name}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{driver.id}</p>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-black ${driver.walletBalance < 0 ? 'text-red-500' : 'text-green-600'}`}>${driver.walletBalance.toFixed(0)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Audit Details Pane */}
        <div className={`flex-1 flex flex-col bg-white transition-all fixed inset-0 lg:relative ${isMobileDetailView ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
          {selectedDriver ? (
            <div className="flex flex-col h-full bg-white">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button onClick={() => setIsMobileDetailView(false)} className="p-2 text-gray-400 bg-gray-50 lg:hidden rounded-lg"><ChevronLeft size={24} /></button>
                  <img src={selectedDriver.avatarUrl} className="w-14 h-14 rounded-2xl object-cover shadow-sm border border-gray-100" alt="" />
                  <div>
                    <h2 className="text-xl font-black text-gray-900 leading-none">{selectedDriver.name}</h2>
                    <p className="text-[10px] text-gray-400 font-black mt-2 uppercase tracking-widest">Account Audit Ledger</p>
                  </div>
                </div>
              </div>

              {/* Account Stats Grid */}
              <div className="p-6 md:p-8 bg-gray-50/50 border-b border-gray-100 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Lifetime Earned</p>
                    <p className="text-lg font-black text-gray-900">${selectedDriver.totalEarned.toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Trips</p>
                    <p className="text-lg font-black text-gray-900">{selectedDriver.completedTrips}</p>
                  </div>
                  <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800 shadow-lg col-span-2 md:col-span-2 text-white">
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-2 flex justify-between">
                      Wallet Liquid Balance <Wallet size={12} className="text-blue-500" />
                    </p>
                    <p className={`text-2xl font-black ${selectedDriver.walletBalance < 0 ? 'text-red-400' : 'text-green-400'}`}>
                      ${selectedDriver.walletBalance.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Payout Available</p>
                      <p className="text-xl font-black text-gray-900">${Math.max(0, selectedDriver.walletBalance).toFixed(2)}</p>
                    </div>
                    <Button variant="black" className="rounded-xl px-6 h-11 text-xs font-black uppercase tracking-widest" disabled={selectedDriver.walletBalance <= 0} onClick={() => handleOpenLog(PayoutType.PAYOUT_TO_DRIVER)}>Execute Payout</Button>
                  </div>
                  <div className={`p-5 rounded-2xl border shadow-sm flex items-center justify-between ${selectedDriver.walletBalance < -debtThreshold ? 'bg-red-50 border-red-100' : 'bg-white border-gray-200'}`}>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recoverable Debt</p>
                      <p className={`text-xl font-black ${selectedDriver.walletBalance < -debtThreshold ? 'text-red-600' : 'text-gray-900'}`}>${Math.abs(Math.min(0, selectedDriver.walletBalance)).toFixed(2)}</p>
                    </div>
                    <Button variant="secondary" className="rounded-xl px-6 h-11 text-xs font-black uppercase tracking-widest" disabled={selectedDriver.walletBalance >= 0} onClick={() => handleOpenLog(PayoutType.COLLECT_FROM_DRIVER)}>Collect Cash</Button>
                  </div>
                </div>
              </div>

              {/* Transaction Audit Table */}
              <div className="flex-1 flex flex-col overflow-hidden p-6">
                <div className="flex items-center justify-between mb-4 px-2">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><History size={14} /> Full Wallet Transaction Audit</h3>
                </div>
                <div className="flex-1 overflow-y-auto border border-gray-100 rounded-3xl bg-white shadow-sm overflow-hidden no-scrollbar">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-gray-50 text-[10px] font-black text-gray-400 uppercase border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-5">Date & Transaction</th>
                        <th className="px-6 py-5">Origin</th>
                        <th className="px-6 py-5 text-right">Wallet Impact</th>
                        <th className="px-6 py-5 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {selectedDriver.logs.map(log => {
                        const isAddition = log.type === PayoutType.TRIP_EARNING_ONLINE || log.type === PayoutType.COLLECT_FROM_DRIVER;
                        const isSystem = log.adminName === 'System';
                        return (
                          <tr key={log.id} className="hover:bg-gray-50/50 group">
                            <td className="px-6 py-5">
                              <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gray-900 uppercase tracking-tight leading-tight">{log.note}</span>
                                <span className="text-[9px] text-gray-400 font-bold mt-1">{log.date} • {log.id}</span>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                               <div className="flex items-center gap-2">
                                  {isSystem ? <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> : <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{log.adminName}</span>
                               </div>
                            </td>
                            <td className={`px-6 py-5 text-right font-black ${isAddition ? 'text-green-600' : 'text-red-500'}`}>
                              {isAddition ? '+' : '-'}${Math.abs(log.amount).toFixed(2)}
                            </td>
                            <td className="px-6 py-5 text-right">
                               <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => handleDeleteLog(log.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors" title="Void Transaction"><Trash2 size={14} /></button>
                               </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
               <Wallet size={48} strokeWidth={1} className="opacity-10 mb-4" />
               <p className="text-[10px] font-black uppercase tracking-widest">Select Account to Audit</p>
            </div>
          )}
        </div>
      </div>

      {/* Manual Adjustment Modal */}
      <Modal isOpen={logModal.open} onClose={() => setLogModal({ open: false })} title="Perform Manual Wallet Action">
        <div className="space-y-6">
           <div className="p-5 bg-gray-900 text-white rounded-[28px] flex items-center gap-4 border border-white/5">
              <img src={selectedDriver?.avatarUrl} className="w-11 h-11 rounded-xl shadow-lg" alt="" />
              <div>
                <p className="text-sm font-black">{selectedDriver?.name}</p>
                <p className="text-[9px] text-blue-400 font-black uppercase tracking-[0.1em]">Target Account Adjustment</p>
              </div>
           </div>
           <div className="space-y-5">
              <Select label="Payment Method Channel" options={[{ value: PaymentMethod.BANK_TRANSFER, label: 'Bank Transfer' }, { value: PaymentMethod.CASH, label: 'Physical Cash' }, { value: PaymentMethod.MOBILE_MONEY, label: 'Mobile Money Gate' }]} value={logFormData.paymentMethod} onChange={e => setLogFormData({...logFormData, paymentMethod: e.target.value as PaymentMethod})} />
              <Input label="Adjustment Amount" type="number" step="0.01" value={logFormData.amount} onChange={e => setLogFormData({...logFormData, amount: parseFloat(e.target.value) || 0})} />
              <Input label="Internal Ledger Note" placeholder="Reference ID or Memo..." value={logFormData.note} onChange={e => setLogFormData({...logFormData, note: e.target.value})} />
           </div>
           <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
              <Button variant="ghost" onClick={() => setLogModal({ open: false })}>Discard</Button>
              <Button variant="black" onClick={handleSaveLog} className="px-10 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest">Commit Action</Button>
           </div>
        </div>
      </Modal>

      {/* Global Billing Policy Modal */}
      <Modal isOpen={settingsModal} onClose={() => setSettingsModal(false)} title="Market Financial Controls">
        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100">
             <div className="flex justify-between items-center mb-6">
               <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Automatic Debt Alert Trigger</p>
               <span className="text-2xl font-black text-red-600">${debtThreshold}</span>
             </div>
             <input type="range" min="100" max="2000" step="100" value={debtThreshold} onChange={e => setDebtThreshold(parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-gray-900" />
             <p className="mt-4 text-[9px] font-bold text-gray-400 uppercase leading-relaxed tracking-tight">Drivers exceeding this limit will be flagged as "High Risk" in the primary registry.</p>
          </div>
          <Button variant="black" fullWidth onClick={() => setSettingsModal(false)} className="h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest">Save Controls</Button>
        </div>
      </Modal>
    </div>
  );
};
