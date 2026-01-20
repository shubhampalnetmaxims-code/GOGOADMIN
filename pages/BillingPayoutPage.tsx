
import React, { useState, useMemo } from 'react';
import { 
  Search, ArrowLeft, ArrowDownLeft, ArrowRight,
  ChevronRight, CheckCircle2, Receipt, 
  History, Download, Ban, UserCheck, 
  Clock, User, DollarSign, Settings, Bell, AlertTriangle,
  ChevronLeft, PieChart, TrendingUp, Landmark, Edit2, Trash2
} from 'lucide-react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { DriverBilling, PayoutLog, PayoutType, PaymentMethod } from '../types';

type BillingFilter = 'ALL' | 'PAYOUT' | 'DEBT' | 'HIGH_RISK';

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
  const [settingsModal, setSettingsModal] = useState(false);
  const [notifyModal, setNotifyModal] = useState(false);

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

  const handleOpenLog = (type: PayoutType, log?: PayoutLog) => {
    if (!selectedDriver) return;
    if (log) {
      setLogFormData({ 
        amount: log.amount, 
        paymentMethod: log.paymentMethod, 
        note: log.note 
      });
      setLogModal({ open: true, type: log.type, editLogId: log.id });
    } else {
      setLogFormData({ 
        amount: type === PayoutType.PAYOUT_TO_DRIVER ? selectedDriver.payoutAmount : selectedDriver.ownedMoney, 
        paymentMethod: PaymentMethod.BANK_TRANSFER, 
        note: '' 
      });
      setLogModal({ open: true, type });
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
          // Editing existing log
          const oldLog = d.logs.find(l => l.id === logModal.editLogId);
          if (oldLog) {
            // Revert old impact
            if (oldLog.type === PayoutType.PAYOUT_TO_DRIVER) newPayout += oldLog.amount;
            else newOwned += oldLog.amount;

            // Apply new impact
            if (logModal.type === PayoutType.PAYOUT_TO_DRIVER) newPayout -= logFormData.amount!;
            else newOwned -= logFormData.amount!;

            newLogs = newLogs.map(l => l.id === logModal.editLogId ? {
              ...l,
              amount: logFormData.amount!,
              paymentMethod: logFormData.paymentMethod!,
              note: logFormData.note || 'Account Settlement',
            } : l);
          }
        } else {
          // Adding new log
          const newLog: PayoutLog = {
            id: `TX-${Math.floor(Math.random() * 10000)}`,
            date: new Date().toISOString().split('T')[0],
            amount: logFormData.amount!,
            type: logModal.type!,
            paymentMethod: logFormData.paymentMethod!,
            note: logFormData.note || 'Account Settlement',
            adminName: 'Super Admin',
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

  const handleNotify = () => {
    setNotifyModal(true);
    // Simulate notification sending
    setTimeout(() => {
      setNotifyModal(false);
      alert(`Notification sent to ${selectedDriver?.name}`);
    }, 1500);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
      {/* 1. Header with Settings */}
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
          <button 
            onClick={() => setSettingsModal(true)}
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all border border-transparent hover:border-gray-200"
            title="Treasury Policy"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 2. Registry Sidebar */}
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
            {filteredDrivers.map(driver => {
              const isOverThreshold = driver.ownedMoney > debtThreshold;
              return (
                <button 
                  key={driver.id}
                  onClick={() => { setSelectedDriverId(driver.id); setIsMobileDetailView(true); }}
                  className={`w-full flex items-center gap-3 p-4 text-left transition-all ${selectedDriverId === driver.id ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}
                >
                  <div className="relative shrink-0">
                    <img src={driver.avatarUrl} className="w-9 h-9 rounded-full object-cover border border-gray-100 shadow-sm" alt="" />
                    {isOverThreshold && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{driver.name}</p>
                    <p className="text-[10px] text-gray-400 font-medium">ID: {driver.id}</p>
                  </div>
                  <div className="text-right">
                    {driver.payoutAmount > 0 ? (
                      <p className="text-xs font-bold text-blue-600">${driver.payoutAmount.toFixed(0)}</p>
                    ) : (
                      <p className={`text-xs font-bold ${isOverThreshold ? 'text-red-500' : 'text-amber-600'}`}>
                        ${driver.ownedMoney.toFixed(0)}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Detail Pane */}
        <div className={`flex-1 flex flex-col bg-white transition-all fixed inset-0 lg:relative ${isMobileDetailView ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
          {selectedDriver ? (
            <div className="flex flex-col h-full bg-white">
              {/* Profile Bar with Back Button */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setIsMobileDetailView(false)} 
                    className="p-2 -ml-2 text-gray-400 hover:text-gray-900 bg-gray-50 lg:hidden rounded-lg transition-all"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <img src={selectedDriver.avatarUrl} className="w-14 h-14 rounded-xl object-cover shadow-sm border border-gray-100" alt="" />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 leading-none">{selectedDriver.name}</h2>
                    <p className="text-[10px] text-gray-400 font-black mt-2 uppercase tracking-widest">Driver Account: {selectedDriver.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {selectedDriver.ownedMoney > debtThreshold && (
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-red-100">
                      <AlertTriangle size={12} /> High Risk
                    </div>
                  )}
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${selectedDriver.isBlocked ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                    {selectedDriver.isBlocked ? 'Blocked' : 'Active'}
                  </span>
                </div>
              </div>

              {/* Comprehensive Revenue Overview (Gross, Commission, Tax) */}
              <div className="p-6 md:p-8 bg-gray-50/50 border-b border-gray-100">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <TrendingUp size={10} /> Gross Earned
                    </p>
                    <p className="text-lg font-black text-gray-900">${selectedDriver.totalEarned.toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <PieChart size={10} /> Commission
                    </p>
                    <p className="text-lg font-black text-gray-900">-${selectedDriver.totalCommission.toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <Landmark size={10} /> Est. Tax
                    </p>
                    <p className="text-lg font-black text-gray-900">-$42.00</p>
                  </div>
                  <div className={`p-4 rounded-2xl border shadow-sm ${selectedDriver.payoutAmount > 0 ? 'bg-blue-50 border-blue-100' : 'bg-white border-gray-200'}`}>
                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-2">Net Wallet</p>
                    <p className={`text-lg font-black ${selectedDriver.ownedMoney > 0 ? 'text-amber-600' : 'text-blue-700'}`}>
                      ${(selectedDriver.payoutAmount - selectedDriver.ownedMoney).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Main Action Bar */}
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

              {/* History Ledger */}
              <div className="flex-1 flex flex-col overflow-hidden p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <History size={14} /> Settlement History
                  </h3>
                  <button className="text-[10px] font-black text-blue-600 hover:underline flex items-center gap-1 uppercase tracking-widest">
                    <Download size={12} /> Get CSV
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto border border-gray-100 rounded-2xl bg-white shadow-sm overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-gray-50 text-[10px] font-black text-gray-400 uppercase border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-4">Transaction Date</th>
                        <th className="px-6 py-4">Operation</th>
                        <th className="px-6 py-4">Method</th>
                        <th className="px-6 py-4 text-right">Value</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {selectedDriver.logs.map(log => (
                        <tr key={log.id} className="hover:bg-gray-50/50 group">
                          <td className="px-6 py-4 text-gray-500 font-medium whitespace-nowrap">{log.date}</td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${log.type === PayoutType.PAYOUT_TO_DRIVER ? 'text-blue-500' : 'text-amber-500'}`}>
                              {log.type === PayoutType.PAYOUT_TO_DRIVER ? 'Disbursed' : 'Collected'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-400 text-[10px] font-black uppercase tracking-widest">{log.paymentMethod.replace('_', ' ')}</td>
                          <td className={`px-6 py-4 text-right font-black ${log.type === PayoutType.PAYOUT_TO_DRIVER ? 'text-gray-900' : 'text-red-500'}`}>
                            {log.type === PayoutType.PAYOUT_TO_DRIVER ? '-' : '+'}${log.amount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleOpenLog(log.type, log)}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                title="Edit Transaction"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                onClick={() => handleDeleteLog(log.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete Transaction"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {selectedDriver.logs.length === 0 && (
                    <div className="py-20 text-center text-gray-300 font-black uppercase tracking-widest text-[10px]">Registry Empty</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
               <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <User size={32} strokeWidth={1} className="opacity-20" />
               </div>
               <p className="text-[10px] font-black uppercase tracking-widest">Select Account</p>
            </div>
          )}
        </div>
      </div>

      {/* Settlement Modal */}
      <Modal 
        isOpen={logModal.open} 
        onClose={() => setLogModal({ open: false })} 
        title={logModal.editLogId ? "Modify Transaction" : (logModal.type === PayoutType.PAYOUT_TO_DRIVER ? "Commit Disbursement" : "Record Collection")}
      >
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-[20px] flex items-center gap-3">
            <img src={selectedDriver?.avatarUrl} className="w-10 h-10 rounded-xl border border-gray-200" alt="" />
            <div>
              <p className="text-xs font-black text-gray-900 leading-none">{selectedDriver?.name}</p>
              <p className="text-[10px] text-gray-400 mt-1 uppercase font-black">{logModal.editLogId ? 'Administrative Override' : 'Admin Clearance'}</p>
            </div>
          </div>
          <div className="space-y-4 pt-2">
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
              placeholder="Ref code..." 
              value={logFormData.note}
              onChange={e => setLogFormData({...logFormData, note: e.target.value})}
              className="h-12 text-xs"
            />
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-50 mt-4">
            <Button variant="ghost" onClick={() => setLogModal({ open: false })} className="text-[10px] font-black uppercase">Cancel</Button>
            <Button variant="black" onClick={handleSaveLog} className="px-8 h-12 text-[10px] font-black uppercase tracking-widest shadow-xl">
              {logModal.editLogId ? 'Commit Changes' : 'Execute Transaction'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Settings Modal */}
      <Modal isOpen={settingsModal} onClose={() => setSettingsModal(false)} title="Market Policy">
        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100 shadow-inner">
             <div className="flex justify-between items-center mb-6">
               <p className="text-xs font-black text-gray-900 uppercase tracking-widest">Debt Limit</p>
               <span className="text-2xl font-black text-red-600 tracking-tighter">${debtThreshold}</span>
             </div>
             <input 
              type="range" 
              min="100" 
              max="2000" 
              step="100" 
              value={debtThreshold} 
              onChange={e => setDebtThreshold(parseInt(e.target.value))} 
              className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-gray-900" 
             />
             <p className="text-[10px] text-gray-400 mt-6 leading-relaxed font-bold uppercase tracking-tighter opacity-50">Accounts exceeding this threshold are flagged for immediate manual review by the treasury team.</p>
          </div>
          <Button variant="black" fullWidth onClick={() => setSettingsModal(false)} className="h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-gray-200">Commit Policy</Button>
        </div>
      </Modal>

      {/* Notification Modal */}
      {notifyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white p-10 rounded-[48px] shadow-2xl flex flex-col items-center gap-6 text-center max-w-sm animate-in zoom-in-95 duration-200 border border-white">
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center animate-bounce shadow-xl shadow-blue-100">
              <Bell size={40} />
            </div>
            <div>
              <p className="text-xl font-black text-gray-900 tracking-tight">Broadcasting Alert</p>
              <p className="text-xs text-gray-500 font-medium mt-2 leading-relaxed italic">The collection request is being synchronized with the driver's native application.</p>
            </div>
            <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
               <div className="h-full bg-blue-600 animate-[loading_1.5s_ease-in-out_infinite]" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
