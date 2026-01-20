
import React, { useState, useMemo } from 'react';
import { 
  Plus, Search, FileDown, History, DollarSign, ArrowUpRight, ArrowDownLeft, 
  ChevronDown, ChevronUp, Calendar, CheckCircle2, Wallet, Receipt, AlertCircle,
  TrendingUp, ArrowRight, Download, FileText, Settings, Bell, Ban, UserCheck, 
  MoreVertical, CheckSquare, Square
} from 'lucide-react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { DriverBilling, PayoutLog, PayoutType } from '../types';

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
      { id: 'l1', date: '2024-03-01', amount: 1000.00, type: PayoutType.PAYOUT_TO_DRIVER, note: 'Partial Monthly Settlement', adminName: 'Admin Mike' }
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
    isBlocked: false,
    logs: [
      { id: 'l2', date: '2024-03-10', amount: 50.00, type: PayoutType.COLLECT_FROM_DRIVER, note: 'Cash deposit at office', adminName: 'Admin Sarah' },
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
      { id: 'l3', date: '2024-02-28', amount: 6630.00, type: PayoutType.PAYOUT_TO_DRIVER, note: 'February Full Clearance', adminName: 'Admin Mike' },
    ]
  }
];

export const BillingPayoutPage: React.FC = () => {
  const [drivers, setDrivers] = useState<DriverBilling[]>(MOCK_BILLING_DATA);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedDrivers, setSelectedDrivers] = useState<Set<string>>(new Set());
  
  // Settings & Threshold states
  const [debtThreshold, setDebtThreshold] = useState(500);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [logModal, setLogModal] = useState<{ open: boolean; driverId?: string }>({ open: false });
  const [logFormData, setLogFormData] = useState<Partial<PayoutLog>>({
    amount: 0,
    type: PayoutType.PAYOUT_TO_DRIVER,
    note: '',
  });

  const filteredDrivers = useMemo(() => {
    return drivers.filter(d => 
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [drivers, searchQuery]);

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
        setLogFormData({ amount: driver.payoutAmount, type: PayoutType.PAYOUT_TO_DRIVER, note: 'Settlement' });
      } else if (driver.ownedMoney > 0) {
        setLogFormData({ amount: driver.ownedMoney, type: PayoutType.COLLECT_FROM_DRIVER, note: 'Collection' });
      } else {
        setLogFormData({ amount: 0, type: PayoutType.PAYOUT_TO_DRIVER, note: '' });
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
      note: logFormData.note || 'Manual Settlement',
      adminName: 'Super Admin',
    };

    setDrivers(drivers.map(d => {
      if (d.id === logModal.driverId) {
        let newPayout = d.payoutAmount;
        let newOwned = d.ownedMoney;

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

        return {
          ...d,
          payoutAmount: Number(newPayout.toFixed(2)),
          ownedMoney: Number(newOwned.toFixed(2)),
          logs: [newLog, ...d.logs]
        };
      }
      return d;
    }));

    setLogModal({ open: false });
  };

  const exportAll = () => {
    const headers = ["Driver Name", "ID", "Trips", "Total Earned (Gross)", "Comm & Tax", "Payout Amount", "Owned Money", "Status"].join(",");
    const rows = filteredDrivers.map(d => 
      [d.name, d.id, d.completedTrips, d.totalEarned, d.totalCommission, d.payoutAmount, d.ownedMoney, d.isBlocked ? "Blocked" : "Active"].join(",")
    ).join("\n");
    const blob = new Blob([headers + "\n" + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Fleet_Full_Ledger_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportIndividual = (driver: DriverBilling, e: React.MouseEvent) => {
    e.stopPropagation();
    const headers = ["Transaction ID", "Date", "Type", "Amount", "Note", "Admin"].join(",");
    const rows = driver.logs.map(log => 
      [log.id, log.date, log.type, log.amount, `"${log.note}"`, log.adminName].join(",")
    ).join("\n");
    const summary = `Settlement History Report\nDriver: ${driver.name}\nID: ${driver.id}\nTrips: ${driver.completedTrips}\nGross Earnings: ${driver.totalEarned}\nComm/Tax: ${driver.totalCommission}\nNet Payout Due: ${driver.payoutAmount}\nNet Owned: ${driver.ownedMoney}\nStatus: ${driver.isBlocked ? 'Blocked' : 'Active'}\n\n`;
    const blob = new Blob([summary + headers + "\n" + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Statement_${driver.name.replace(/\s+/g, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="flex-1 relative z-10">
          <div className="flex items-center gap-2 mb-1">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-200">
                <Receipt size={18} />
             </div>
             <h1 className="text-2xl font-black text-gray-900 tracking-tight">Financial Settlements</h1>
          </div>
          <p className="text-sm text-gray-500 font-medium italic">Track gross earnings, deductions, and manage account balances.</p>
        </div>
        
        <div className="flex items-center gap-3 relative z-10">
           <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-3 bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl border border-transparent transition-all shadow-sm"
            title="Accounting Settings"
           >
              <Settings size={22} />
           </button>
           <div className="w-px h-10 bg-gray-100 mx-2" />
           <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex flex-col min-w-[140px]">
              <span className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-1">Total Payouts</span>
              <span className="text-xl font-black text-blue-600">${drivers.reduce((acc, d) => acc + d.payoutAmount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
           </div>
           <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex flex-col min-w-[140px]">
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-widest mb-1">Total Collections</span>
              <span className="text-xl font-black text-amber-600">${drivers.reduce((acc, d) => acc + d.ownedMoney, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
           </div>
        </div>
      </header>

      {/* Main Table Content */}
      <div className="bg-white rounded-[40px] shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="p-6 bg-gray-50/50 border-b flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search by driver identity..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-[18px] focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium shadow-inner"
              />
            </div>
            {selectedDrivers.size > 0 && (
              <div className="flex items-center gap-3 animate-in slide-in-from-left-4">
                 <Button 
                   variant="black" 
                   icon={<Bell size={16} />} 
                   onClick={notifySelected}
                   className="rounded-xl px-6 py-2.5 text-[10px] uppercase font-black tracking-widest bg-blue-600 shadow-lg shadow-blue-200"
                 >
                   Notify ({selectedDrivers.size})
                 </Button>
              </div>
            )}
          </div>
          <div className="flex gap-3">
             <Button variant="ghost" icon={<Download size={18} />} onClick={exportAll} className="text-xs font-black rounded-xl px-5 uppercase tracking-widest">Full Export</Button>
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/80 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">
                <th className="px-8 py-5 w-10">
                   <button onClick={selectAll} className="text-gray-300 hover:text-blue-600 transition-colors">
                      {selectedDrivers.size === filteredDrivers.length && filteredDrivers.length > 0 ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} />}
                   </button>
                </th>
                <th className="px-4 py-5">Driver Profile</th>
                <th className="px-4 py-5 text-center">Trips</th>
                <th className="px-6 py-5">Total Earned (Gross)</th>
                <th className="px-6 py-5">Comm. & Tax</th>
                <th className="px-6 py-5">Payout Due</th>
                <th className="px-6 py-5">Owned Money</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredDrivers.map(driver => (
                <React.Fragment key={driver.id}>
                  <tr 
                    onClick={() => toggleRow(driver.id)}
                    className={`hover:bg-blue-50/20 transition-all cursor-pointer group ${expandedRows.has(driver.id) ? 'bg-blue-50/10' : ''} ${driver.isBlocked ? 'opacity-70' : ''}`}
                  >
                    <td className="px-8 py-6">
                       <button onClick={(e) => toggleSelection(driver.id, e)} className="text-gray-300 hover:text-blue-600 transition-colors">
                          {selectedDrivers.has(driver.id) ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} />}
                       </button>
                    </td>
                    <td className="px-4 py-6">
                      <div className="flex items-center gap-4">
                        <img src={driver.avatarUrl} alt="" className="w-11 h-11 rounded-2xl object-cover border-2 border-white shadow-sm" />
                        <div>
                          <p className="text-sm font-black text-gray-900 leading-none mb-1">{driver.name}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">ID: {driver.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-6 text-sm font-bold text-gray-600 text-center">{driver.completedTrips}</td>
                    <td className="px-6 py-6 text-sm font-black text-gray-900">${driver.totalEarned.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-6 text-sm font-bold text-red-500">-${driver.totalCommission.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-6 text-sm font-black text-blue-600">
                       ${driver.payoutAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-6">
                       <div className="flex items-center gap-2">
                          <span className={`text-sm font-black ${driver.ownedMoney > debtThreshold ? 'text-red-600' : driver.ownedMoney > 0 ? 'text-amber-600' : 'text-gray-300'}`}>
                            ${driver.ownedMoney.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                          {driver.ownedMoney > debtThreshold && <AlertCircle size={14} className="text-red-500 animate-pulse" />}
                       </div>
                    </td>
                    <td className="px-6 py-6">
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
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={(e) => handleBlockToggle(driver.id, e)}
                          className={`p-2 rounded-xl transition-all border ${driver.isBlocked ? 'bg-green-50 text-green-600 border-green-100 hover:bg-green-100' : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'}`}
                          title={driver.isBlocked ? "Unblock Driver" : "Block Driver"}
                        >
                           {driver.isBlocked ? <UserCheck size={16} /> : <Ban size={16} />}
                        </button>
                        <button 
                          onClick={(e) => handleOpenLog(driver.id, e)}
                          className="p-2 bg-gray-900 text-white rounded-xl hover:bg-blue-600 transition-all shadow-md shadow-gray-200"
                          title="Register Settlement"
                        >
                           <Receipt size={16} />
                        </button>
                        <div className="w-px h-6 bg-gray-100 mx-1" />
                        <button 
                          onClick={(e) => {e.stopPropagation(); exportIndividual(driver, e);}}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Individual Statement"
                        >
                          <FileText size={18} />
                        </button>
                        <ChevronDown size={16} className={`text-gray-300 transition-transform ${expandedRows.has(driver.id) ? 'rotate-180' : ''}`} />
                      </div>
                    </td>
                  </tr>

                  {/* Settlement History Row */}
                  {expandedRows.has(driver.id) && (
                    <tr className="bg-gray-50/50 animate-in slide-in-from-top-2 duration-300">
                      <td colSpan={9} className="px-10 py-8">
                        <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm">
                          <div className="flex justify-between items-center mb-6">
                             <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                               <History size={14} className="text-blue-500" /> Comprehensive Settlement Ledger
                             </h4>
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-lg">Historical Aggregate: ${driver.logs.reduce((acc, l) => acc + l.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                          </div>

                          {driver.logs.length > 0 ? (
                            <div className="space-y-3">
                              {driver.logs.map(log => (
                                <div key={log.id} className="flex items-center justify-between p-5 rounded-2xl border border-gray-100 hover:bg-blue-50/20 transition-all border-l-4 border-l-transparent hover:border-l-blue-600">
                                  <div className="flex items-center gap-5">
                                    <div className={`p-3 rounded-xl ${log.type === PayoutType.PAYOUT_TO_DRIVER ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                                      {log.type === PayoutType.PAYOUT_TO_DRIVER ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                                    </div>
                                    <div>
                                      <p className="text-xs font-black text-gray-900 uppercase tracking-tight">{log.type === PayoutType.PAYOUT_TO_DRIVER ? 'Platform Disbursement' : 'Admin Collection'}</p>
                                      <p className="text-[10px] text-gray-500 font-medium italic">{log.note}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className={`text-base font-black ${log.type === PayoutType.PAYOUT_TO_DRIVER ? 'text-blue-600' : 'text-amber-600'}`}>
                                      {log.type === PayoutType.PAYOUT_TO_DRIVER ? '-' : '+'}${log.amount.toFixed(2)}
                                    </p>
                                    <p className="text-[10px] font-bold uppercase tracking-tighter text-gray-400 mt-1">{log.date} • {log.adminName}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-12 flex flex-col items-center opacity-30">
                               <Receipt size={32} className="mb-2" />
                               <p className="text-[10px] font-black uppercase tracking-widest">No historical settlements</p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settings Modal */}
      <Modal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        title="Accounting Configuration"
      >
        <div className="space-y-8">
           <div>
              <label className="text-xs font-black uppercase text-gray-400 tracking-widest block mb-4">Risk Threshold Configuration</label>
              <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 mb-6">
                 <div className="flex justify-between items-end mb-6">
                    <div>
                       <p className="text-sm font-black text-gray-900 leading-none">Debt Threshold</p>
                       <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest">Mark account for notification</p>
                    </div>
                    <span className="text-2xl font-black text-blue-600 tracking-tighter">${debtThreshold}</span>
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
                 <div className="flex justify-between mt-2 text-[9px] font-black text-gray-300 uppercase tracking-tighter">
                    <span>$0</span>
                    <span>$1,000</span>
                    <span>$2,000</span>
                 </div>
              </div>
              <p className="text-[11px] text-gray-500 italic leading-relaxed px-2">
                Drivers exceeding this amount will be visually highlighted in red and can be targeted with bulk payment reminders.
              </p>
           </div>

           <div className="pt-6 border-t border-gray-100">
              <Button variant="black" fullWidth className="rounded-2xl h-14 uppercase tracking-widest text-[11px] font-black shadow-xl shadow-gray-200" onClick={() => setIsSettingsOpen(false)}>Commit Settings</Button>
           </div>
        </div>
      </Modal>

      {/* Settlement Execution Modal */}
      <Modal 
        isOpen={logModal.open} 
        onClose={() => setLogModal({ open: false })} 
        title="Execute Ledger Settlement"
      >
        <div className="space-y-6">
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
             <div className="flex items-center gap-3">
                <img src={activeDriverForModal?.avatarUrl} className="w-10 h-10 rounded-xl border-2 border-white shadow-sm" alt="" />
                <div>
                   <span className="text-sm font-black text-gray-900 block">{activeDriverForModal?.name}</span>
                   <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Current Active Balance</span>
                </div>
             </div>
             <div className="text-right">
                <p className={`text-lg font-black tracking-tight ${activeDriverForModal?.payoutAmount! > 0 ? 'text-blue-600' : 'text-amber-600'}`}>
                   ${(activeDriverForModal?.payoutAmount || activeDriverForModal?.ownedMoney || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
             </div>
          </div>

          <div className="space-y-5">
            <Select 
              label="Transaction Action"
              options={[
                { value: PayoutType.PAYOUT_TO_DRIVER, label: 'Platform Payout Disbursement' },
                { value: PayoutType.COLLECT_FROM_DRIVER, label: 'Manual Debt Collection' }
              ]}
              value={logFormData.type}
              onChange={e => setLogFormData({...logFormData, type: e.target.value as PayoutType})}
              className="h-14 font-semibold rounded-2xl"
            />
            
            <div className="relative group">
              <Input 
                label="Transaction Amount" 
                type="number" 
                placeholder="0.00" 
                value={logFormData.amount}
                onChange={e => setLogFormData({...logFormData, amount: parseFloat(e.target.value) || 0})}
                className="h-14 font-black text-lg pr-24 rounded-2xl"
              />
              <button 
                onClick={() => setLogFormData({...logFormData, amount: activeDriverForModal?.payoutAmount || activeDriverForModal?.ownedMoney || 0})}
                className="absolute right-4 top-[48px] text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline bg-blue-50 px-2 py-1 rounded transition-all"
              >
                Clear Account
              </button>
            </div>

            <Input 
              label="Audit Note / Reference" 
              placeholder="Ref: Receipt #9921 / ACH Transfer" 
              value={logFormData.note}
              onChange={e => setLogFormData({...logFormData, note: e.target.value})}
              className="h-14 font-medium rounded-2xl"
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <Button variant="secondary" className="rounded-xl px-6" onClick={() => setLogModal({ open: false })}>Discard</Button>
            <Button variant="black" className="rounded-xl px-8 h-12 font-black uppercase tracking-widest text-[11px] shadow-lg shadow-gray-100" onClick={handleSaveLog}>Authorize & Log</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
