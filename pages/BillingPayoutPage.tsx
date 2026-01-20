
import React, { useState, useMemo } from 'react';
import { 
  Search, ArrowLeft, ArrowDownLeft, ArrowRight,
  ChevronRight, CheckCircle2, Receipt, 
  History, Download, Ban, UserCheck, 
  Clock, User, DollarSign, Settings, Bell, AlertTriangle
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
  const [logModal, setLogModal] = useState<{ open: boolean; type?: PayoutType }>({ open: false });
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

  const handleOpenLog = (type: PayoutType) => {
    if (!selectedDriver) return;
    setLogFormData({ 
      amount: type === PayoutType.PAYOUT_TO_DRIVER ? selectedDriver.payoutAmount : selectedDriver.ownedMoney, 
      paymentMethod: PaymentMethod.BANK_TRANSFER, 
      note: '' 
    });
    setLogModal({ open: true, type });
  };

  const handleSaveLog = () => {
    if (!selectedDriverId || !logFormData.amount || !logModal.type) return;

    const newLog: PayoutLog = {
      id: `TX-${Math.floor(Math.random() * 10000)}`,
      date: new Date().toISOString().split('T')[0],
      amount: logFormData.amount!,
      type: logModal.type,
      paymentMethod: logFormData.paymentMethod!,
      note: logFormData.note || 'Account Settlement',
      adminName: 'Super Admin',
    };

    setDrivers(drivers.map(d => {
      if (d.id === selectedDriverId) {
        let newPayout = d.payoutAmount;
        let newOwned = d.ownedMoney;
        if (newLog.type === PayoutType.PAYOUT_TO_DRIVER) newPayout = Math.max(0, newPayout - newLog.amount);
        else newOwned = Math.max(0, newOwned - newLog.amount);
        return { ...d, payoutAmount: Number(newPayout.toFixed(2)), ownedMoney: Number(newOwned.toFixed(2)), logs: [newLog, ...d.logs] };
      }
      return d;
    }));
    setLogModal({ open: false });
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
            <p className="text-xs text-gray-500 mt-1">Manage driver settlements and collection policies</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex gap-6 items-center">
            <div className="flex flex-col text-right">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Disbursed</span>
              <span className="text-sm font-bold text-gray-900">${drivers.reduce((acc, d) => acc + d.payoutAmount, 0).toLocaleString()}</span>
            </div>
            <div className="flex flex-col text-right border-l border-gray-100 pl-6">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Collections</span>
              <span className="text-sm font-bold text-amber-600">${drivers.reduce((acc, d) => acc + d.ownedMoney, 0).toLocaleString()}</span>
            </div>
          </div>
          <button 
            onClick={() => setSettingsModal(true)}
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all border border-transparent hover:border-gray-200"
            title="Billing Settings"
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
                placeholder="Find driver by name or ID..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
            <div className="flex gap-1 overflow-x-auto no-scrollbar">
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
              {/* Profile Bar */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button onClick={() => setIsMobileDetailView(false)} className="lg:hidden p-2 -ml-2 text-gray-400"><ArrowLeft size={20} /></button>
                  <img src={selectedDriver.avatarUrl} className="w-14 h-14 rounded-xl object-cover shadow-sm border border-gray-100" alt="" />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedDriver.name}</h2>
                    <p className="text-xs text-gray-400 font-medium">Driver ID: {selectedDriver.id} • {selectedDriver.completedTrips} Trips</p>
                  </div>
                </div>
                {selectedDriver.ownedMoney > debtThreshold && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-red-100">
                    <AlertTriangle size={12} /> High Risk Account
                  </div>
                )}
              </div>

              {/* Actionable Balances */}
              <div className="p-6 bg-gray-50/50 border-b border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Available Payout</p>
                      <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><DollarSign size={14} /></div>
                    </div>
                    <div className="flex items-end justify-between">
                      <span className="text-3xl font-bold text-gray-900">${selectedDriver.payoutAmount.toFixed(2)}</span>
                      <Button size="sm" variant="black" className="rounded-lg px-4 h-9 text-xs" disabled={selectedDriver.payoutAmount <= 0} onClick={() => handleOpenLog(PayoutType.PAYOUT_TO_DRIVER)}>Settlement</Button>
                    </div>
                  </div>
                  <div className={`p-5 rounded-2xl border shadow-sm transition-all ${selectedDriver.ownedMoney > debtThreshold ? 'bg-red-50/30 border-red-100' : 'bg-white border-gray-200'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Driver Owed</p>
                        {selectedDriver.ownedMoney > 0 && (
                          <p className="text-[9px] font-bold text-amber-600 mt-1 uppercase tracking-tighter flex items-center gap-1">
                            <Clock size={10} /> Owed for {getDebtAge(selectedDriver.debtStartedAt)} days
                          </p>
                        )}
                      </div>
                      <div className={`p-1.5 rounded-lg ${selectedDriver.ownedMoney > debtThreshold ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'}`}><ArrowDownLeft size={14} /></div>
                    </div>
                    <div className="flex items-end justify-between">
                      <span className={`text-3xl font-bold ${selectedDriver.ownedMoney > debtThreshold ? 'text-red-600' : 'text-gray-900'}`}>${selectedDriver.ownedMoney.toFixed(2)}</span>
                      <div className="flex gap-2">
                        {selectedDriver.ownedMoney > 0 && (
                          <Button size="sm" variant="secondary" className="rounded-lg px-3 h-9 text-xs" onClick={handleNotify}>
                            <Bell size={14} />
                          </Button>
                        )}
                        <Button size="sm" variant="secondary" className="rounded-lg px-4 h-9 text-xs font-bold" disabled={selectedDriver.ownedMoney <= 0} onClick={() => handleOpenLog(PayoutType.COLLECT_FROM_DRIVER)}>Collect</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* History Table */}
              <div className="flex-1 flex flex-col overflow-hidden p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <History size={14} /> Account Ledger
                  </h3>
                  <button className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1">
                    <Download size={12} /> Statement
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto border border-gray-100 rounded-xl bg-white shadow-sm">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-gray-50 text-[10px] font-bold text-gray-400 uppercase border-b border-gray-100">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Action</th>
                        <th className="px-4 py-3">Method</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {selectedDriver.logs.map(log => (
                        <tr key={log.id} className="hover:bg-gray-50/30">
                          <td className="px-4 py-3 text-gray-500 font-medium whitespace-nowrap">{log.date}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-bold uppercase ${log.type === PayoutType.PAYOUT_TO_DRIVER ? 'text-blue-500' : 'text-amber-500'}`}>
                              {log.type === PayoutType.PAYOUT_TO_DRIVER ? 'Payout' : 'Collection'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-xs font-medium">{log.paymentMethod.replace('_', ' ')}</td>
                          <td className={`px-4 py-3 text-right font-bold ${log.type === PayoutType.PAYOUT_TO_DRIVER ? 'text-gray-900' : 'text-red-500'}`}>
                            {log.type === PayoutType.PAYOUT_TO_DRIVER ? '-' : '+'}${log.amount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {selectedDriver.logs.length === 0 && (
                    <div className="py-20 text-center text-gray-300 italic text-xs">No entries found for this driver</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
               <User size={60} strokeWidth={1} className="mb-4 opacity-10" />
               <p className="text-xs font-bold uppercase tracking-widest">Select a driver record</p>
            </div>
          )}
        </div>
      </div>

      {/* Settlement Modal */}
      <Modal 
        isOpen={logModal.open} 
        onClose={() => setLogModal({ open: false })} 
        title={logModal.type === PayoutType.PAYOUT_TO_DRIVER ? "Disburse Payout" : "Record Collection"}
      >
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-3">
            <img src={selectedDriver?.avatarUrl} className="w-8 h-8 rounded-full border border-gray-200" alt="" />
            <div>
              <p className="text-xs font-bold text-gray-900 leading-none">{selectedDriver?.name}</p>
              <p className="text-[10px] text-gray-400 mt-1 uppercase">Authorizing Transaction</p>
            </div>
          </div>
          <div className="space-y-4 pt-2">
            <Select 
              label="Payment Channel"
              options={[
                { value: PaymentMethod.BANK_TRANSFER, label: 'Bank Transfer' },
                { value: PaymentMethod.CASH, label: 'Cash / Office Deposit' },
                { value: PaymentMethod.MOBILE_MONEY, label: 'Mobile Money' },
                { value: PaymentMethod.STRIPE, label: 'Digital Card' }
              ]}
              value={logFormData.paymentMethod}
              onChange={e => setLogFormData({...logFormData, paymentMethod: e.target.value as PaymentMethod})}
              className="h-11 text-xs font-bold"
            />
            <div className="relative">
              <Input 
                label="Transaction Amount" 
                type="number" 
                value={logFormData.amount}
                onChange={e => setLogFormData({...logFormData, amount: parseFloat(e.target.value) || 0})}
                className="h-11 font-bold text-lg pr-12"
              />
              <button 
                onClick={() => setLogFormData({...logFormData, amount: logModal.type === PayoutType.PAYOUT_TO_DRIVER ? selectedDriver?.payoutAmount : selectedDriver?.ownedMoney})}
                className="absolute right-3 top-9 text-[10px] font-bold text-blue-600 uppercase"
              >
                Max
              </button>
            </div>
            <Input 
              label="Memo / Reference" 
              placeholder="Internal tracking ID..." 
              value={logFormData.note}
              onChange={e => setLogFormData({...logFormData, note: e.target.value})}
              className="h-11 text-xs"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-50 mt-4">
            <Button variant="ghost" onClick={() => setLogModal({ open: false })} className="text-xs font-bold">Discard</Button>
            <Button variant="black" onClick={handleSaveLog} className="px-8 text-xs font-bold">Commit Action</Button>
          </div>
        </div>
      </Modal>

      {/* Settings Modal */}
      <Modal isOpen={settingsModal} onClose={() => setSettingsModal(false)} title="Treasury Policy">
        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
             <div className="flex justify-between items-center mb-6">
               <p className="text-sm font-bold text-gray-900">Risk Threshold</p>
               <span className="text-xl font-bold text-red-600">${debtThreshold}</span>
             </div>
             <input 
              type="range" 
              min="100" 
              max="2000" 
              step="50" 
              value={debtThreshold} 
              onChange={e => setDebtThreshold(parseInt(e.target.value))} 
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" 
             />
             <p className="text-[10px] text-gray-400 mt-4 italic font-medium">Drivers exceeding this limit will be flagged as "High Risk" and may require immediate collection.</p>
          </div>
          <Button variant="black" fullWidth onClick={() => setSettingsModal(false)} className="h-12 rounded-xl text-xs font-bold uppercase tracking-widest">Update Policy</Button>
        </div>
      </Modal>

      {/* Notify Simulation Overlay */}
      {notifyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white p-8 rounded-[32px] shadow-2xl flex flex-col items-center gap-4 text-center max-w-xs animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center animate-bounce">
              <Bell size={32} />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">Sending Alert</p>
              <p className="text-xs text-gray-400 font-medium">Broadcasting push notification to driver's mobile device...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
