import React, { useState, useMemo, useEffect } from 'react';
import { 
  Save, AlertCircle, Clock, MapPin, CreditCard, Percent, 
  Zap, Plus, Trash2, ShieldAlert, Map as MapIcon, Globe, Settings2, Info,
  ChevronRight, ArrowRight, CheckCircle2, Navigation, X, Search,
  Edit2, Timer, RefreshCw, Eye, MousePointer2
} from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Modal } from '../components/Modal';
import { VehicleType, PricingService, SurgeRule, Location, ZoneFee } from '../types';

interface PricingPageProps {
  service: PricingService;
}

const INITIAL_LOCATIONS: Location[] = [
  { id: '1', name: 'New York City', country: 'USA', currency: 'USD', isActive: true },
  { id: '2', name: 'London', country: 'UK', currency: 'GBP', isActive: true },
  { id: '3', name: 'Dubai', country: 'UAE', currency: 'AED', isActive: true },
  { id: '4', name: 'Mumbai', country: 'India', currency: 'INR', isActive: true },
];

export const PricingPage: React.FC<PricingPageProps> = ({ service }) => {
  const [activeTab, setActiveTab] = useState<'trip-fare' | 'surcharges' | 'dynamic'>('trip-fare');
  const [locations, setLocations] = useState<Location[]>(INITIAL_LOCATIONS);
  const [selectedLocationId, setSelectedLocationId] = useState<string>(locations[0].id);
  const [selectedVehicle, setSelectedVehicle] = useState<string>(VehicleType.SEDAN);
  
  // Location Management State
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isAddLocationView, setIsAddLocationView] = useState(false);
  const [newLoc, setNewLoc] = useState<Partial<Location>>({
    name: '',
    country: '',
    currency: 'USD',
    isActive: true
  });

  const selectedLocation = useMemo(() => 
    locations.find(l => l.id === selectedLocationId) || locations[0],
    [selectedLocationId, locations]
  );

  const handleAddLocation = () => {
    if (!newLoc.name || !newLoc.country) return;
    const location: Location = {
      id: Math.random().toString(36).substr(2, 9),
      name: newLoc.name!,
      country: newLoc.country!,
      currency: newLoc.currency || 'USD',
      isActive: true
    };
    setLocations([...locations, location]);
    setIsAddLocationView(false);
    setNewLoc({ name: '', country: '', currency: 'USD', isActive: true });
  };

  const removeLocation = (id: string) => {
    if (locations.length <= 1) return;
    const updated = locations.filter(l => l.id !== id);
    setLocations(updated);
    if (selectedLocationId === id) {
      setSelectedLocationId(updated[0].id);
    }
  };

  const toggleLocationStatus = (id: string) => {
    setLocations(locations.map(l => l.id === id ? { ...l, isActive: !l.isActive } : l));
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col bg-gray-50/30">
      {/* Context Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-200">
            <Globe size={24} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
               <h1 className="text-xl font-bold text-gray-900">Pricing Matrix</h1>
               <span className="bg-blue-50 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
                {service}
               </span>
            </div>
            <p className="text-xs text-gray-500 font-medium flex items-center mt-0.5">
              <MapPin size={12} className="mr-1" /> {selectedLocation.name} • {selectedLocation.currency}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex flex-col items-end mr-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Current Zone</span>
            <select 
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="bg-transparent border-none text-sm font-bold text-gray-900 focus:ring-0 cursor-pointer p-0"
            >
              {locations.filter(l => l.isActive).map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>
          <div className="h-10 w-px bg-gray-200" />
          <Button 
            variant="secondary" 
            icon={<Settings2 size={18} />} 
            onClick={() => { setIsManageModalOpen(true); setIsAddLocationView(false); }}
            className="rounded-xl"
          >
            Manage Locations
          </Button>
          <Button icon={<Save size={18} />} variant="black" className="shadow-lg shadow-gray-200 rounded-xl">
            Apply Changes
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex items-center space-x-1 mb-6 bg-white p-1 rounded-xl border border-gray-200 w-fit self-center md:self-start">
        <SegmentedTab active={activeTab === 'trip-fare'} onClick={() => setActiveTab('trip-fare')} label="Rate Card" />
        <SegmentedTab active={activeTab === 'surcharges'} onClick={() => setActiveTab('surcharges')} label="Fixed Surcharges" />
        <SegmentedTab active={activeTab === 'dynamic'} onClick={() => setActiveTab('dynamic')} label="Dynamic Pricing" />
      </div>

      <div className="flex-1 space-y-6">
        {activeTab === 'trip-fare' && (
          <TripFareSettings 
            selectedVehicle={selectedVehicle} 
            setSelectedVehicle={setSelectedVehicle} 
            location={selectedLocation}
          />
        )}
        {activeTab === 'surcharges' && <SurchargeSettings location={selectedLocation} />}
        {activeTab === 'dynamic' && <DynamicPricingSettings location={selectedLocation} />}
      </div>

      {/* Manage Locations Modal */}
      <Modal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        title={isAddLocationView ? "Add New Operation Zone" : "Manage Operational Locations"}
        footer={
          isAddLocationView ? (
            <div className="flex justify-end gap-3 w-full">
              <Button variant="secondary" onClick={() => setIsAddLocationView(false)}>Back</Button>
              <Button variant="black" onClick={handleAddLocation}>Save Location</Button>
            </div>
          ) : (
            <Button variant="black" className="w-full" onClick={() => setIsAddLocationView(true)} icon={<Plus size={18} />}>
              Add New Location
            </Button>
          )
        }
      >
        {isAddLocationView ? (
          <div className="space-y-4">
            <Input 
              label="Location Name" 
              placeholder="e.g. San Francisco" 
              value={newLoc.name} 
              onChange={(e) => setNewLoc({...newLoc, name: e.target.value})}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Country" 
                placeholder="e.g. USA" 
                value={newLoc.country} 
                onChange={(e) => setNewLoc({...newLoc, country: e.target.value})}
              />
              <Input 
                label="Currency Code" 
                placeholder="e.g. USD" 
                value={newLoc.currency} 
                onChange={(e) => setNewLoc({...newLoc, currency: e.target.value.toUpperCase()})}
              />
            </div>
            <div className="p-4 bg-blue-50 rounded-xl flex items-start space-x-3">
              <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-blue-800 leading-relaxed">
                Adding a new location creates a default pricing structure which you can later customize in the Rate Card tab.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {locations.map((loc) => (
              <div key={loc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 group transition-all hover:bg-white hover:shadow-md">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-blue-600 shadow-sm border border-gray-100">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{loc.name}</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{loc.country} • {loc.currency}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <label className="relative inline-flex items-center cursor-pointer scale-75">
                    <input type="checkbox" className="sr-only peer" checked={loc.isActive} onChange={() => toggleLocationStatus(loc.id)} />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
                  </label>
                  <button 
                    onClick={() => removeLocation(loc.id)}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

const SegmentedTab: React.FC<{ active: boolean; onClick: () => void; label: string }> = ({ active, onClick, label }) => (
  <button
    onClick={onClick}
    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
      active 
        ? 'bg-gray-900 text-white shadow-md' 
        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
    }`}
  >
    {label}
  </button>
);

const TripFareSettings: React.FC<{ selectedVehicle: string; setSelectedVehicle: (v: string) => void; location: Location }> = ({ 
  selectedVehicle, 
  setSelectedVehicle,
  location
}) => {
  // Pricing State
  const [baseFare, setBaseFare] = useState(2.50);
  const [ratePerKm, setRatePerKm] = useState(1.50);
  const [ratePerMin, setRatePerMin] = useState(0.25);
  const [minFare, setMinFare] = useState(7.00);
  const [waitRate, setWaitRate] = useState(0.45);
  const [gracePeriod, setGracePeriod] = useState(2);
  const [cancelFee, setCancelFee] = useState(5.00);
  const [marketplaceFee, setMarketplaceFee] = useState(1.50);
  const [commission, setCommission] = useState(25.0);
  const [tax, setTax] = useState(5.0);

  // Estimation Inputs
  const [estDistance, setEstDistance] = useState(5.0);
  const [estDuration, setEstDuration] = useState(12.0);

  // Calculation Results
  const calculations = useMemo(() => {
    const rawFare = baseFare + (ratePerKm * estDistance) + (ratePerMin * estDuration);
    const finalFare = Math.max(rawFare, minFare);
    const riderPaysBeforeTax = finalFare + marketplaceFee;
    const taxAmount = riderPaysBeforeTax * (tax / 100);
    const totalRiderPrice = riderPaysBeforeTax + taxAmount;
    
    // Platform Revenue (Commission on Fare + Marketplace Fee)
    const platformCut = (finalFare * (commission / 100)) + marketplaceFee;
    const driverEarnings = finalFare - (finalFare * (commission / 100));

    return {
      finalFare,
      totalRiderPrice,
      driverEarnings,
      platformCut,
      taxAmount
    };
  }, [baseFare, ratePerKm, ratePerMin, minFare, marketplaceFee, commission, tax, estDistance, estDuration]);

  // Mock "recalculation" effect
  const [isCalculating, setIsCalculating] = useState(false);
  const handleRecalculate = () => {
    setIsCalculating(true);
    setTimeout(() => setIsCalculating(false), 600);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Vehicle Type Horizontal Selection */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Object.values(VehicleType).map((type) => (
          <button
            key={type}
            onClick={() => setSelectedVehicle(type)}
            className={`group p-4 rounded-2xl border text-center transition-all relative overflow-hidden ${
              selectedVehicle === type
                ? 'border-gray-900 bg-gray-900 text-white shadow-xl translate-y-[-2px]'
                : 'border-white bg-white text-gray-500 hover:border-gray-200 hover:bg-gray-50 shadow-sm'
            }`}
          >
            <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${selectedVehicle === type ? 'text-gray-400' : 'text-gray-400'}`}>
              {type.replace('_', ' ')}
            </div>
            {selectedVehicle === type && <CheckCircle2 size={16} className="absolute top-2 right-2 text-blue-400" />}
            <div className="text-xs font-bold truncate">Set Pricing</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Uber Components */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Navigation size={20} className="text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Uber Rate Components</h2>
              </div>
              <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase">
                Active in {location.name}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <Input 
                    label={`Base Fare (${location.currency})`} 
                    type="number" 
                    step="0.01" 
                    value={baseFare} 
                    onChange={(e) => setBaseFare(parseFloat(e.target.value) || 0)}
                />
                <Input 
                    label={`Rate Per Km (${location.currency})`} 
                    type="number" 
                    step="0.01" 
                    value={ratePerKm}
                    onChange={(e) => setRatePerKm(parseFloat(e.target.value) || 0)}
                />
                <Input 
                    label={`Rate Per Minute (${location.currency})`} 
                    type="number" 
                    step="0.01" 
                    value={ratePerMin}
                    onChange={(e) => setRatePerMin(parseFloat(e.target.value) || 0)}
                />
              </div>
              
              <div className="space-y-6">
                <Input 
                    label={`Minimum Fare (${location.currency})`} 
                    type="number" 
                    step="0.01" 
                    value={minFare}
                    onChange={(e) => setMinFare(parseFloat(e.target.value) || 0)}
                />
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                    <Info size={14} className="inline-block mr-1 mb-0.5 text-blue-500" />
                    <strong>Minimum Fare:</strong> If the calculated total (Base + Distance + Time) is less than this value, the Minimum Fare is charged instead.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-3 mb-8">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Timer size={20} className="text-orange-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Wait Time & Cancellation</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="p-5 bg-orange-50/50 rounded-2xl border border-orange-100 space-y-4">
                  <Input 
                    label="Grace Period (mins)" 
                    type="number" 
                    value={gracePeriod}
                    onChange={(e) => setGracePeriod(parseInt(e.target.value) || 0)}
                    className="bg-white"
                  />
                  <div className="pt-2 border-t border-orange-100">
                    <label className="block text-xs font-bold text-orange-700 uppercase mb-2">Wait Fee Per Minute (After Grace)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400 font-bold text-sm">{location.currency}</span>
                      <input 
                        type="number" 
                        step="0.01" 
                        value={waitRate}
                        onChange={(e) => setWaitRate(parseFloat(e.target.value) || 0)}
                        className="w-full pl-10 pr-3 py-2 bg-white border border-orange-200 rounded-lg focus:ring-orange-500 focus:border-orange-500 text-sm font-bold text-orange-900"
                      />
                    </div>
                    <p className="text-[10px] text-orange-600/70 mt-2 font-medium italic">
                      Charging begins immediately after the grace period expires until the trip starts.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <Input 
                    label={`Cancellation Fee (${location.currency})`} 
                    type="number" 
                    step="0.01" 
                    value={cancelFee}
                    onChange={(e) => setCancelFee(parseFloat(e.target.value) || 0)}
                />
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-xs font-bold text-gray-500 uppercase">Apply to No-Show</span>
                  <label className="relative inline-flex items-center cursor-pointer scale-90">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Calculations & Platform */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-3 mb-6">
               <div className="p-2 bg-emerald-50 rounded-lg">
                <Percent size={20} className="text-emerald-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Platform Economics</h2>
            </div>
            
            <div className="space-y-6">
              <Input 
                label={`Marketplace Fee (${location.currency})`} 
                type="number" 
                step="0.01" 
                value={marketplaceFee}
                onChange={(e) => setMarketplaceFee(parseFloat(e.target.value) || 0)}
              />
              <Input 
                label="Uber Commission (%)" 
                type="number" 
                step="0.1" 
                value={commission}
                onChange={(e) => setCommission(parseFloat(e.target.value) || 0)}
              />
              <div className="pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center mb-4">
                   <label className="text-xs font-bold text-gray-500 uppercase">Local Tax (%)</label>
                   <span className="text-xs font-black text-gray-900">VAT/Sales</span>
                </div>
                <Input 
                    type="number" 
                    step="0.1" 
                    value={tax}
                    onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-900 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Zap size={120} />
             </div>
             <h3 className="text-sm font-black text-blue-400 uppercase tracking-widest mb-6 flex items-center">
                <Timer size={16} className="mr-2" /> Live Trip Estimate
             </h3>
             
             <div className="space-y-4 mb-8">
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-white/10 p-2 rounded-lg">
                        <label className="block text-[8px] font-bold text-blue-300 uppercase mb-1">Km Distance</label>
                        <input 
                            type="number" 
                            step="0.1" 
                            value={estDistance} 
                            onChange={(e) => setEstDistance(parseFloat(e.target.value) || 0)}
                            className="w-full bg-transparent border-none p-0 text-white font-black text-lg focus:ring-0" 
                        />
                    </div>
                    <div className="bg-white/10 p-2 rounded-lg">
                        <label className="block text-[8px] font-bold text-blue-300 uppercase mb-1">Mins Time</label>
                        <input 
                            type="number" 
                            step="1" 
                            value={estDuration} 
                            onChange={(e) => setEstDuration(parseFloat(e.target.value) || 0)}
                            className="w-full bg-transparent border-none p-0 text-white font-black text-lg focus:ring-0" 
                        />
                    </div>
                </div>

                <div className="flex justify-between text-sm items-end">
                   <span className="text-gray-400">Total Calculation:</span>
                   <span className={`font-black text-3xl transition-all duration-300 ${isCalculating ? 'scale-110 text-blue-400' : 'text-white'}`}>
                    {location.currency} {calculations.totalRiderPrice.toFixed(2)}
                   </span>
                </div>
                <div className="h-px bg-gray-800" />
                <div className="space-y-3">
                   <div className="flex justify-between text-[10px] text-gray-500">
                      <span>Rider Pays (Incl. Tax):</span>
                      <span className="text-white font-bold">{location.currency} {calculations.totalRiderPrice.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between text-[10px] text-gray-500">
                      <span>Platform Take:</span>
                      <span className="text-orange-400 font-bold">{location.currency} {calculations.platformCut.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between text-[10px] text-gray-500 border-t border-gray-800/50 pt-2">
                      <span>Driver Payout:</span>
                      <span className="text-emerald-400 font-black text-xs">{location.currency} {calculations.driverEarnings.toFixed(2)}</span>
                   </div>
                </div>
             </div>
             
             <Button 
                variant="primary" 
                onClick={handleRecalculate}
                className={`w-full bg-blue-600 hover:bg-blue-500 border-none rounded-xl h-12 relative overflow-hidden transition-all ${isCalculating ? 'bg-blue-400' : ''}`}
             >
               {isCalculating ? (
                 <RefreshCw size={18} className="animate-spin" />
               ) : (
                 "Recalculate Math"
               )}
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SurchargeSettings: React.FC<{ location: Location }> = ({ location }) => {
  const [zoneFees, setZoneFees] = useState<ZoneFee[]>([
    { id: '1', name: 'Zone Alpha (Primary)', amount: 5.50, lat: 40.7128, lng: -74.0060 },
  ]);
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [isMapViewOpen, setIsMapViewOpen] = useState(false);
  const [editingFeeId, setEditingFeeId] = useState<string | null>(null);
  const [viewingFee, setViewingFee] = useState<ZoneFee | null>(null);
  const [newZoneFee, setNewZoneFee] = useState<Partial<ZoneFee>>({ 
    name: '', 
    amount: 0, 
    lat: 40.7128, 
    lng: -74.0060 
  });

  const handleOpenZoneModal = (fee?: ZoneFee) => {
    if (fee) {
      setEditingFeeId(fee.id);
      setNewZoneFee({ name: fee.name, amount: fee.amount, lat: fee.lat, lng: fee.lng });
    } else {
      setEditingFeeId(null);
      setNewZoneFee({ name: '', amount: 0, lat: 40.7128, lng: -74.0060 });
    }
    setIsZoneModalOpen(true);
  };

  const handleSaveZoneFee = () => {
    if (!newZoneFee.name || newZoneFee.amount === undefined) return;

    if (editingFeeId) {
      setZoneFees(zoneFees.map(f => f.id === editingFeeId ? { ...f, name: newZoneFee.name!, amount: newZoneFee.amount!, lat: newZoneFee.lat, lng: newZoneFee.lng } : f));
    } else {
      const fee: ZoneFee = {
        id: Math.random().toString(36).substr(2, 9),
        name: newZoneFee.name,
        amount: newZoneFee.amount,
        lat: newZoneFee.lat,
        lng: newZoneFee.lng,
      };
      setZoneFees([...zoneFees, fee]);
    }
    setIsZoneModalOpen(false);
  };

  const handleDeleteZoneFee = (id: string) => {
    setZoneFees(zoneFees.filter(f => f.id !== id));
  };

  const handleViewZoneOnMap = (fee: ZoneFee) => {
    setViewingFee(fee);
    setIsMapViewOpen(true);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                 <Clock size={24} className="text-purple-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Standard Night Rules</h2>
           </div>
           <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-purple-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
           </label>
        </div>
        <div className="grid grid-cols-2 gap-6 mb-6">
           <Input label="Active From" type="time" defaultValue="23:00" />
           <Input label="Active To" type="time" defaultValue="05:00" />
        </div>
        <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100">
           <label className="block text-xs font-black text-purple-700 uppercase mb-3">Night Surcharge Multiplier</label>
           <div className="flex items-end space-x-2">
              <input type="number" step="0.1" defaultValue="1.3" className="bg-transparent border-none p-0 text-4xl font-black text-purple-900 focus:ring-0 w-24" />
              <span className="text-purple-600 font-bold mb-1">x</span>
           </div>
           <p className="text-[10px] text-purple-600/70 mt-4 font-medium italic">Applied to Base, Km, and Minute rates automatically.</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center space-x-3">
              <div className="p-2 bg-pink-50 rounded-lg">
                 <ShieldAlert size={24} className="text-pink-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Zone Specific Fees</h2>
           </div>
           <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-pink-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
           </label>
        </div>
        <div className="space-y-4">
           <div className="max-h-[300px] overflow-y-auto space-y-4 pr-1">
             {zoneFees.map((fee, index) => (
                <div key={fee.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 group hover:bg-white hover:shadow-md transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-xs font-bold text-gray-400 shadow-sm border border-gray-100">
                      #{index + 1}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-700">{fee.name}</span>
                      <span className="text-[10px] font-black text-gray-400 uppercase">{location.currency} {fee.amount.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={() => handleViewZoneOnMap(fee)}
                      title="View on Map"
                      className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                      <Eye size={16} />
                    </button>
                    <button 
                      onClick={() => handleOpenZoneModal(fee)}
                      title="Edit"
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteZoneFee(fee.id)}
                      title="Delete"
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
             ))}
           </div>
           
           <button 
             onClick={() => handleOpenZoneModal()}
             className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-xs font-bold text-gray-400 hover:border-pink-200 hover:text-pink-600 transition-all flex items-center justify-center bg-gray-50/50"
           >
              <Plus size={16} className="mr-2" /> Create New Map Zone
           </button>
        </div>
      </div>

      {/* Zone Fee Modal with Map Picker */}
      <Modal
        isOpen={isZoneModalOpen}
        onClose={() => setIsZoneModalOpen(false)}
        title={editingFeeId ? "Edit Map Zone" : "Create New Map Zone"}
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button variant="secondary" onClick={() => setIsZoneModalOpen(false)}>Cancel</Button>
            <Button variant="black" onClick={handleSaveZoneFee}>Save Zone</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input 
            label="Internal Zone Name" 
            placeholder="e.g. Heathrow Terminal 5" 
            value={newZoneFee.name} 
            onChange={(e) => setNewZoneFee({...newZoneFee, name: e.target.value})}
          />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-500 uppercase">Fee Amount ({location.currency})</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                <input 
                  type="number" 
                  step="0.01" 
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm font-bold"
                  value={newZoneFee.amount}
                  onChange={(e) => setNewZoneFee({...newZoneFee, amount: parseFloat(e.target.value)})}
                />
              </div>
            </div>
            <div className="space-y-1">
               <label className="block text-xs font-bold text-gray-500 uppercase">Zone Type</label>
               <div className="h-10 px-3 flex items-center bg-gray-50 border border-gray-200 rounded-lg text-xs font-black text-gray-400">
                  POINT RADIUS
               </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-500 uppercase flex items-center justify-between">
              Select Zone on Map
              <span className="text-blue-600 flex items-center lowercase font-medium">
                <MousePointer2 size={10} className="mr-1" /> Click to pin
              </span>
            </label>
            <div 
              className="h-48 bg-gray-100 rounded-2xl border-2 border-gray-200 overflow-hidden relative group cursor-crosshair"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                setNewZoneFee({...newZoneFee, lat: y, lng: x});
              }}
            >
              {/* Simulated Map Background */}
              <div className="absolute inset-0 opacity-40 bg-[url('https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/-74.006,40.7128,10/600x400?access_token=pk.eyJ1IjoiYmFycnljb3JyZWxsIiwiYSI6ImNrcHFzOXBkYjBiazMydW9iYm9iYm9iYm9iIn0')] bg-cover" />
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-white/10" />
              
              {/* Target Marker */}
              {newZoneFee.lat !== undefined && (
                <div 
                  className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300 z-10"
                  style={{ top: `${newZoneFee.lat}%`, left: `${newZoneFee.lng}%` }}
                >
                  <div className="relative">
                    <div className="absolute -inset-4 bg-pink-500/20 rounded-full animate-ping" />
                    <MapPin size={24} className="text-pink-600 drop-shadow-lg" fill="currentColor" />
                  </div>
                </div>
              )}

              <div className="absolute bottom-2 left-2 px-2 py-1 bg-white/80 backdrop-blur rounded text-[8px] font-black text-gray-500 uppercase tracking-tighter">
                Coordinates: {newZoneFee.lat?.toFixed(2)}, {newZoneFee.lng?.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* View Map Modal */}
      <Modal
        isOpen={isMapViewOpen}
        onClose={() => setIsMapViewOpen(false)}
        title={`Viewing Zone: ${viewingFee?.name}`}
        footer={
          <Button variant="black" className="w-full" onClick={() => setIsMapViewOpen(false)}>Done</Button>
        }
      >
        <div className="space-y-4">
           <div className="h-64 bg-gray-100 rounded-2xl border border-gray-200 relative overflow-hidden">
              <div className="absolute inset-0 opacity-60 bg-[url('https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/-74.006,40.7128,12/600x400?access_token=pk.eyJ1IjoiYmFycnljb3JyZWxsIiwiYSI6ImNrcHFzOXBkYjBiazMydW9iYm9iYm9iYm9iIn0')] bg-cover" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="relative">
                    <div className="absolute -inset-8 bg-pink-500/10 rounded-full animate-pulse" />
                    <div className="absolute -inset-4 bg-pink-500/20 rounded-full" />
                    <MapPin size={32} className="text-pink-600 drop-shadow-xl" fill="currentColor" />
                </div>
              </div>
              <div className="absolute top-4 left-4 p-3 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-white/20">
                 <div className="text-[10px] font-black text-gray-400 uppercase">Fixed Surcharge</div>
                 <div className="text-lg font-black text-gray-900">{location.currency} {viewingFee?.amount.toFixed(2)}</div>
              </div>
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                 <div className="text-[10px] font-black text-gray-400 uppercase mb-1">Status</div>
                 <div className="flex items-center text-xs font-bold text-emerald-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2" /> Active Monitoring
                 </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                 <div className="text-[10px] font-black text-gray-400 uppercase mb-1">Trigger</div>
                 <div className="text-xs font-bold text-gray-700">Geo-fence Entry</div>
              </div>
           </div>
        </div>
      </Modal>
    </div>
  );
};

const DynamicPricingSettings: React.FC<{ location: Location }> = ({ location }) => {
  const [rules, setRules] = useState<SurgeRule[]>([
    { id: '1', name: 'Peak Morning Rush', multiplier: 1.8, location: location.name, startTime: '07:30', endTime: '09:30', isActive: true, lat: 30, lng: 40 },
    { id: '2', name: 'Downtown Events', multiplier: 2.2, location: 'Manhattan Core', startTime: '18:00', endTime: '22:00', isActive: true, lat: 50, lng: 55 },
    { id: '3', name: 'Low Demand Holiday', multiplier: 0.9, location: location.name, startTime: '00:00', endTime: '23:59', isActive: false, lat: 20, lng: 80 },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMapViewOpen, setIsMapViewOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [viewingRule, setViewingRule] = useState<SurgeRule | null>(null);
  
  const [newRule, setNewRule] = useState<Partial<SurgeRule>>({
    name: '',
    multiplier: 1.2,
    location: location.name,
    startTime: '10:00',
    endTime: '16:00',
    isActive: true,
    lat: 40.7128,
    lng: -74.0060
  });

  const handleOpenModal = (rule?: SurgeRule) => {
    if (rule) {
      setEditingRuleId(rule.id);
      setNewRule({ ...rule });
    } else {
      setEditingRuleId(null);
      setNewRule({
        name: '',
        multiplier: 1.2,
        location: location.name,
        startTime: '10:00',
        endTime: '16:00',
        isActive: true,
        lat: 40.7128,
        lng: -74.0060
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveRule = () => {
    if (!newRule.name || !newRule.location) return;

    if (editingRuleId) {
      setRules(rules.map(r => r.id === editingRuleId ? { ...r, ...newRule } as SurgeRule : r));
    } else {
      const rule: SurgeRule = {
        id: Math.random().toString(36).substr(2, 9),
        name: newRule.name!,
        multiplier: newRule.multiplier || 1.0,
        location: newRule.location!,
        startTime: newRule.startTime || '00:00',
        endTime: newRule.endTime || '23:59',
        isActive: true,
        lat: newRule.lat,
        lng: newRule.lng
      };
      setRules([rule, ...rules]);
    }
    setIsModalOpen(false);
  };

  const removeRule = (id: string) => setRules(rules.filter(r => r.id !== id));
  const toggleRule = (id: string) => setRules(rules.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));

  const handleViewOnMap = (rule: SurgeRule) => {
    setViewingRule(rule);
    setIsMapViewOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Dynamic Pricing Header Card */}
      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
           <div className="p-4 bg-yellow-400 rounded-2xl shadow-lg shadow-yellow-100">
              <Zap size={32} className="text-yellow-900" />
           </div>
           <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Active Surge Controls</h2>
              <p className="text-sm text-gray-500 font-medium">Manage automated pricing triggers based on demand density.</p>
           </div>
        </div>
        <Button variant="black" icon={<Plus size={18} />} className="shadow-lg h-12 px-8 rounded-xl" onClick={() => handleOpenModal()}>
          Create Multiplier
        </Button>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rules.map((rule) => (
          <div 
            key={rule.id} 
            className={`group bg-white rounded-3xl border border-gray-200 p-6 shadow-sm transition-all hover:shadow-xl hover:translate-y-[-4px] ${!rule.isActive && 'opacity-60 bg-gray-50'}`}
          >
            <div className="flex justify-between items-start mb-6">
               <div className="flex flex-col">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${rule.isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                    {rule.isActive ? 'Active Now' : 'Paused'}
                  </span>
                  <h3 className="text-lg font-black text-gray-900 mt-1">{rule.name}</h3>
               </div>
               <div className="flex space-x-1">
                  <button onClick={() => handleViewOnMap(rule)} title="View Map" className="text-gray-300 hover:text-emerald-500 transition-colors p-1">
                    <Eye size={18} />
                  </button>
                  <button onClick={() => handleOpenModal(rule)} title="Edit" className="text-gray-300 hover:text-blue-500 transition-colors p-1">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => removeRule(rule.id)} title="Delete" className="text-gray-300 hover:text-red-500 transition-colors p-1">
                    <Trash2 size={18} />
                  </button>
               </div>
            </div>

            <div className="flex items-center space-x-2 mb-6">
               <div className="text-3xl font-black text-gray-900">{rule.multiplier}x</div>
               <div className="h-8 w-px bg-gray-100" />
               <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Location</span>
                  <span className="text-xs font-bold text-gray-600 truncate max-w-[140px]">{rule.location}</span>
               </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl mb-6">
               <div className="flex items-center text-xs font-bold text-gray-500">
                  <Clock size={14} className="mr-2" /> {rule.startTime} - {rule.endTime}
               </div>
               <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500 transition-all" />
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
               <span className="text-xs font-medium text-gray-400">Auto-Apply Status</span>
               <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={rule.isActive} onChange={() => toggleRule(rule.id)} />
                  <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5"></div>
               </label>
            </div>
          </div>
        ))}
      </div>

      {/* View Map Modal for Dynamic Pricing */}
      <Modal
        isOpen={isMapViewOpen}
        onClose={() => setIsMapViewOpen(false)}
        title={`Trigger Zone: ${viewingRule?.name}`}
        footer={
          <Button variant="black" className="w-full" onClick={() => setIsMapViewOpen(false)}>Close View</Button>
        }
      >
        <div className="space-y-4">
           <div className="h-64 bg-gray-100 rounded-2xl border border-gray-200 relative overflow-hidden">
              <div className="absolute inset-0 opacity-60 bg-[url('https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/-74.006,40.7128,12/600x400?access_token=pk.eyJ1IjoiYmFycnljb3JyZWxsIiwiYSI6ImNrcHFzOXBkYjBiazMydW9iYm9iYm9iYm9iIn0')] bg-cover" />
              <div 
                className="absolute transition-all duration-500"
                style={{ top: `${viewingRule?.lat}%`, left: `${viewingRule?.lng}%`, transform: 'translate(-50%, -50%)' }}
              >
                <div className="relative">
                    <div className="absolute -inset-10 bg-yellow-500/10 rounded-full animate-pulse" />
                    <div className="absolute -inset-6 bg-yellow-500/20 rounded-full" />
                    <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-yellow-900 shadow-xl">
                       <Zap size={20} fill="currentColor" />
                    </div>
                </div>
              </div>
              <div className="absolute top-4 left-4 p-3 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-white/20">
                 <div className="text-[10px] font-black text-gray-400 uppercase">Multiplier</div>
                 <div className="text-xl font-black text-gray-900">{viewingRule?.multiplier}x</div>
              </div>
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                 <div className="text-[10px] font-black text-gray-400 uppercase mb-1">Time Window</div>
                 <div className="text-xs font-bold text-gray-700">{viewingRule?.startTime} to {viewingRule?.endTime}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                 <div className="text-[10px] font-black text-gray-400 uppercase mb-1">Region</div>
                 <div className="text-xs font-bold text-gray-700 truncate">{viewingRule?.location}</div>
              </div>
           </div>
        </div>
      </Modal>

      {/* Add/Edit Rule Modal with Map Picker */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRuleId ? "Edit Pricing Trigger" : "New Pricing Trigger"}
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button variant="secondary" className="px-6 rounded-xl" onClick={() => setIsModalOpen(false)}>Discard</Button>
            <Button variant="black" className="px-10 rounded-xl shadow-lg shadow-gray-200" onClick={handleSaveRule}>
              {editingRuleId ? "Update Rule" : "Activate Rule"}
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          <Input 
            label="Internal Rule Name" 
            placeholder="e.g. New Year Eve 2024" 
            value={newRule.name} 
            onChange={(e) => setNewRule({...newRule, name: e.target.value})}
          />
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 uppercase">Multiplier</label>
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                   <input 
                      type="number" 
                      step="0.1" 
                      className="bg-transparent border-none p-0 text-xl font-black text-gray-900 focus:ring-0 w-full"
                      value={newRule.multiplier}
                      onChange={(e) => setNewRule({...newRule, multiplier: parseFloat(e.target.value)})}
                   />
                   <span className="font-bold text-gray-400 ml-2">x</span>
                </div>
             </div>
             <Input 
                label="Region Display Name" 
                value={newRule.location} 
                onChange={(e) => setNewRule({...newRule, location: e.target.value})}
             />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <Input 
               label="Start Time" 
               type="time" 
               value={newRule.startTime} 
               onChange={(e) => setNewRule({...newRule, startTime: e.target.value})} 
             />
             <Input 
               label="End Time" 
               type="time" 
               value={newRule.endTime} 
               onChange={(e) => setNewRule({...newRule, endTime: e.target.value})} 
             />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-500 uppercase flex items-center justify-between">
              Select Impact Zone
              <span className="text-blue-600 flex items-center lowercase font-medium">
                <MousePointer2 size={10} className="mr-1" /> Click to center
              </span>
            </label>
            <div 
              className="h-40 bg-gray-100 rounded-2xl border-2 border-gray-200 overflow-hidden relative group cursor-crosshair"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                setNewRule({...newRule, lat: y, lng: x});
              }}
            >
              <div className="absolute inset-0 opacity-40 bg-[url('https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/-74.006,40.7128,10/600x400?access_token=pk.eyJ1IjoiYmFycnljb3JyZWxsIiwiYSI6ImNrcHFzOXBkYjBiazMydW9iYm9iYm9iYm9iIn0')] bg-cover" />
              
              {newRule.lat !== undefined && (
                <div 
                  className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300 z-10"
                  style={{ top: `${newRule.lat}%`, left: `${newRule.lng}%` }}
                >
                  <div className="relative">
                    <div className="absolute -inset-6 bg-yellow-400/30 rounded-full animate-ping" />
                    <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-yellow-900 border-2 border-white shadow-lg">
                       <Zap size={14} fill="currentColor" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
             <ShieldAlert size={20} className="text-emerald-600 shrink-0" />
             <p className="text-[11px] text-emerald-700 leading-tight">
               Multiplier will be restricted by the <strong>Surge Guardrails</strong> defined on the main Dynamic Pricing page.
             </p>
          </div>
        </div>
      </Modal>

      {/* Safety Guardrails */}
      <div className="bg-emerald-900 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between shadow-2xl relative overflow-hidden">
         <div className="absolute left-0 bottom-0 opacity-10 pointer-events-none">
            <ShieldAlert size={200} />
         </div>
         <div className="mb-6 md:mb-0 relative z-10">
            <h3 className="text-xl font-black mb-2 flex items-center">
              <ShieldAlert className="mr-3 text-emerald-400" /> Global Guardrails
            </h3>
            <p className="text-emerald-100/70 text-sm max-w-md">Override limits that prevent excessive pricing spikes regardless of active zone multipliers.</p>
         </div>
         <div className="flex flex-wrap gap-4 relative z-10">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 w-32">
               <span className="block text-[10px] font-black text-emerald-300 uppercase mb-1">Max Multiplier</span>
               <span className="text-2xl font-black">4.0x</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 w-32">
               <span className="block text-[10px] font-black text-emerald-300 uppercase mb-1">Max Base ($)</span>
               <span className="text-2xl font-black">20.00</span>
            </div>
         </div>
      </div>
    </div>
  );
};
