
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Save, MapPin, Zap, Plus, Trash2, Globe, CheckCircle2, Navigation, Clock, Timer, Layers, Map as MapIcon,
  Edit2, ChevronRight, DollarSign, Moon, HelpCircle, Calculator, Check, Shield, Lock, Trash, Coffee, AlertTriangle,
  Settings, Target, Crosshair, BarChart3, CloudRain, ChevronDown, Calendar, CheckSquare, Square,
  // Added Car icon to imports
  Car
} from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Modal } from '../components/Modal';
import { VehicleType, PricingService, SurgeRule, Location, OperationalZone, VehiclePricingConfig, DistanceTier } from '../types';

interface PricingPageProps {
  service: PricingService;
}

const INITIAL_LOCATIONS: Location[] = [
  { id: 'loc-1', name: 'New York City', country: 'USA', currency: 'USD', isActive: true },
  { id: 'loc-2', name: 'London', country: 'UK', currency: 'GBP', isActive: true },
  { id: 'loc-3', name: 'Dubai', country: 'UAE', currency: 'AED', isActive: true },
];

const INITIAL_ZONES: OperationalZone[] = [
  { id: 'z1', name: 'JFK Airport', locationId: 'loc-1', lat: 40.6413, lng: -73.7781, radius: 1500, isActive: true },
  { id: 'z2', name: 'Manhattan Central', locationId: 'loc-1', lat: 40.7831, lng: -73.9712, radius: 2000, isActive: true },
  { id: 'z3', name: 'Heathrow Terminal', locationId: 'loc-2', lat: 51.4700, lng: -0.4543, radius: 1800, isActive: true },
];

const DEFAULT_PRICING: VehiclePricingConfig = {
  baseFare: 3.50,
  ratePerKm: 2.10,
  ratePerMin: 0.40,
  minFare: 8.00,
  waitRate: 0.50,
  safeWaitTime: 5,
  pickupWaitTime: 2,
  totalWaitTime: 7,
  cancelFee: 5.00,
  commission: 15,
  tax: 5,
  distancePricingMode: 'STANDARD',
  distanceTiers: [
    { id: 't1', upToKm: 5, rate: 2.50 },
    { id: 't2', upToKm: 20, rate: 2.10 },
    { id: 't3', upToKm: 999, rate: 1.80 },
  ],
};

const INITIAL_CONFIGS: Record<string, VehiclePricingConfig> = {
  'loc-1:SEDAN': {
    ...DEFAULT_PRICING,
    baseFare: 4.50,
    distancePricingMode: 'TIERED',
  }
};

const INITIAL_GLOBAL_SURGE: SurgeRule[] = [
  { 
    id: 'sr-night', 
    name: 'Night Shift Premium', 
    pricingType: 'FLAT',
    pricingValue: 5.00,
    locationIds: ['loc-1', 'loc-2', 'loc-3'], 
    vehicleTypes: [VehicleType.SEDAN, VehicleType.SUV, VehicleType.PREMIUM_SEDAN], 
    zoneIds: [],
    isScheduled: true,
    startTime: '22:00', 
    endTime: '05:00', 
    isActive: true 
  },
  { 
    id: 'sr-jfk', 
    name: 'JFK Airport Surcharge', 
    pricingType: 'FLAT',
    pricingValue: 10.00,
    locationIds: ['loc-1'], 
    vehicleTypes: Object.values(VehicleType), 
    zoneIds: ['z1'],
    isScheduled: false,
    startTime: '00:00', 
    endTime: '23:59', 
    isActive: true 
  }
];

const MapPicker: React.FC<{ lat: number; lng: number; radius: number; onChange: (lat: number, lng: number) => void }> = ({ lat, lng, radius, onChange }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (!mapInstanceRef.current) {
      const L = (window as any).L;
      if (!L) return;
      const map = L.map(mapContainerRef.current, { zoomControl: false, attributionControl: false }).setView([lat, lng], 14);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
      const circle = L.circle([lat, lng], { radius, color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.1, weight: 1 }).addTo(map);
      marker.on('drag', (e: any) => { const { lat, lng } = e.target.getLatLng(); circle.setLatLng([lat, lng]); onChange(lat, lng); });
      map.on('click', (e: any) => { const { lat, lng } = e.latlng; marker.setLatLng([lat, lng]); circle.setLatLng([lat, lng]); onChange(lat, lng); });
      mapInstanceRef.current = map; markerRef.current = marker; circleRef.current = circle;
      setTimeout(() => map.invalidateSize(), 100);
    } else {
      markerRef.current.setLatLng([lat, lng]);
      circleRef.current.setLatLng([lat, lng]);
      circleRef.current.setRadius(radius);
    }
  }, [lat, lng, radius]);

  return (
    <div className="relative w-full h-48 md:h-64 rounded-[20px] overflow-hidden border border-gray-200 shadow-inner group">
      <div ref={mapContainerRef} className="w-full h-full" />
      <div className="absolute top-4 left-4 z-[10] px-3 py-1.5 bg-white/90 backdrop-blur shadow-sm border border-gray-100 rounded-full flex items-center gap-2">
        <Crosshair size={14} className="text-blue-600" />
        <span className="text-[10px] font-black uppercase text-gray-900 tracking-widest">Map Selection</span>
      </div>
    </div>
  );
};

export const PricingPage: React.FC<PricingPageProps> = ({ service }) => {
  const [activeMode, setActiveMode] = useState<'matrix' | 'dynamic' | 'setup'>('matrix');
  const [locations, setLocations] = useState<Location[]>(INITIAL_LOCATIONS);
  const [selectedLocationId, setSelectedLocationId] = useState<string>(locations[0].id);
  const [zones, setZones] = useState<OperationalZone[]>(INITIAL_ZONES);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>(VehicleType.SEDAN);
  const [configs, setConfigs] = useState<Record<string, VehiclePricingConfig>>(INITIAL_CONFIGS);
  const [globalSurgeRules, setGlobalSurgeRules] = useState<SurgeRule[]>(INITIAL_GLOBAL_SURGE);
  const [showGlobalInfo, setShowGlobalInfo] = useState(false);
  const [lockedStates, setLockedStates] = useState<Record<string, boolean>>({});

  const currentContextKey = `${selectedLocationId}:${selectedVehicle}`;
  const isCurrentViewLocked = !!lockedStates[activeMode === 'matrix' ? currentContextKey : activeMode];

  const activeLocation = useMemo(() => locations.find(l => l.id === selectedLocationId) || locations[0], [selectedLocationId, locations]);
  const activeConfig = useMemo(() => configs[currentContextKey] || { ...DEFAULT_PRICING }, [currentContextKey, configs]);

  const updateActiveConfig = (updates: Partial<VehiclePricingConfig>) => {
    if (isCurrentViewLocked) return;
    setConfigs(prev => {
      const current = prev[currentContextKey] || { ...DEFAULT_PRICING };
      const merged = { ...current, ...updates };
      if ('pickupWaitTime' in updates || 'safeWaitTime' in updates) {
        merged.totalWaitTime = (merged.pickupWaitTime || 0) + (merged.safeWaitTime || 0);
      }
      return { ...prev, [currentContextKey]: merged };
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-full flex flex-col bg-gray-50/30 overflow-x-hidden">
      <header className="flex flex-col xl:flex-row xl:items-center justify-between mb-6 md:mb-8 gap-6 bg-white p-6 md:p-8 rounded-[24px] md:rounded-[40px] border border-gray-200 shadow-sm relative overflow-hidden">
        {isCurrentViewLocked && <div className="absolute top-0 left-0 w-full h-1 bg-gray-900 shadow-sm" />}
        <div className="flex items-center space-x-4 md:space-x-6">
          <div className={`p-3 md:p-4 rounded-2xl text-white shadow-2xl transition-colors duration-500 shrink-0 ${isCurrentViewLocked ? 'bg-gray-400' : 'bg-gray-900'}`}><Globe size={24} /></div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
               <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight leading-none">Pricing Hub</h1>
               <span className="bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shrink-0">{service}</span>
               <button onClick={() => setShowGlobalInfo(true)} className="p-1 bg-gray-100 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all">
                 <HelpCircle size={16} />
               </button>
            </div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {activeMode === 'dynamic' ? 'Dynamic controls' : activeMode === 'setup' ? 'Market setup' : `Market: ${activeLocation.name}`}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
           <div className="flex bg-gray-100 p-1 rounded-xl overflow-x-auto no-scrollbar">
              <button onClick={() => setActiveMode('matrix')} className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${activeMode === 'matrix' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}><DollarSign size={14} /> <span>Price</span></button>
              <button onClick={() => setActiveMode('dynamic')} className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${activeMode === 'dynamic' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}><Zap size={14} /> <span>Surge</span></button>
              <button onClick={() => setActiveMode('setup')} className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${activeMode === 'setup' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}><Layers size={14} /> <span>Global</span></button>
           </div>
           <Button variant="black" onClick={() => setLockedStates(p => ({...p, [activeMode === 'matrix' ? currentContextKey : activeMode]: !isCurrentViewLocked}))} className="rounded-xl h-12 px-6 shadow-xl transition-all">
             {isCurrentViewLocked ? <Edit2 size={18} /> : <Save size={18} />}
           </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pr-0 md:pr-2 no-scrollbar pb-12">
        {activeMode === 'matrix' ? (
          <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 -mx-2 px-2 no-scrollbar">
               {Object.values(VehicleType).map((type) => (
                 <button key={type} onClick={() => setSelectedVehicle(type)} className={`shrink-0 flex items-center space-x-2 px-6 py-3 rounded-xl border transition-all ${selectedVehicle === type ? 'bg-gray-900 text-white shadow-lg' : 'bg-white text-gray-500'}`}>
                   <span className="text-[9px] font-black uppercase tracking-tight">{type.replace('_', ' ')}</span>
                 </button>
               ))}
            </div>
            <div className={`bg-white rounded-[32px] md:rounded-[48px] border border-gray-200 shadow-sm p-6 md:p-12 overflow-hidden transition-opacity ${isCurrentViewLocked ? 'opacity-80' : ''}`}>
               <RateCardView config={activeConfig} onUpdate={updateActiveConfig} location={activeLocation} disabled={isCurrentViewLocked} />
            </div>
          </div>
        ) : activeMode === 'dynamic' ? (
          <DynamicPricingHub rules={globalSurgeRules} setRules={setGlobalSurgeRules} availableLocations={locations} availableZones={zones} disabled={isCurrentViewLocked} />
        ) : (
          <MarketSetup locations={locations} setLocations={setLocations} zones={zones} setZones={setZones} selectedLocationId={selectedLocationId} setSelectedLocationId={setSelectedLocationId} disabled={isCurrentViewLocked} />
        )}
      </div>
    </div>
  );
};

const RateCardView: React.FC<{ config: VehiclePricingConfig; onUpdate: (u: Partial<VehiclePricingConfig>) => void; location: Location; disabled?: boolean }> = ({ config, onUpdate, location, disabled }) => {
  const [testDist, setTestDist] = useState(12);
  const [testWait, setTestWait] = useState(5);
  
  const addTier = () => onUpdate({ distanceTiers: [...config.distanceTiers, { id: Date.now().toString(), upToKm: (config.distanceTiers[config.distanceTiers.length - 1]?.upToKm || 0) + 10, rate: config.ratePerKm }] });

  const calculateFare = () => {
    let dFare = 0;
    if (config.distancePricingMode === 'STANDARD') {
      dFare = testDist * config.ratePerKm;
    } else {
      let rem = testDist; let last = 0;
      [...config.distanceTiers].sort((a,b)=>a.upToKm-b.upToKm).forEach(t => {
        if (rem <= 0) return;
        const chunk = Math.min(rem, t.upToKm - last);
        dFare += chunk * t.rate; rem -= chunk; last = t.upToKm;
      });
    }
    const tFare = 15 * config.ratePerMin;
    const wFare = Math.max(0, testWait - config.totalWaitTime) * config.waitRate;
    const subtotal = Math.max(config.minFare, config.baseFare + dFare + tFare);
    return subtotal + wFare;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-16">
       <div className="lg:col-span-8 space-y-10 md:space-y-12">
          <section>
             <h3 className="text-lg md:text-xl font-black text-gray-900 mb-6 md:mb-8 flex items-center gap-3"><Timer size={20} className="text-blue-600" /> Core Specs</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8">
                <Input label="Base Fare" type="number" step="0.01" value={config.baseFare} disabled={disabled} onChange={e => onUpdate({ baseFare: parseFloat(e.target.value) || 0 })} />
                <Input label="Min Fare" type="number" step="0.01" value={config.minFare} disabled={disabled} onChange={e => onUpdate({ minFare: parseFloat(e.target.value) || 0 })} />
                <Input label="Rate / Min" type="number" step="0.01" value={config.ratePerMin} disabled={disabled} onChange={e => onUpdate({ ratePerMin: parseFloat(e.target.value) || 0 })} />
             </div>
          </section>
          
          <section className="pt-10 border-t border-gray-100">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h3 className="text-lg md:text-xl font-black text-gray-900 flex items-center gap-3"><BarChart3 size={20} className="text-indigo-600" /> Distance</h3>
                <div className="w-full sm:w-48"><Select label="Mode" options={[{ value: 'STANDARD', label: 'Flat' }, { value: 'TIERED', label: 'Tiered' }]} value={config.distancePricingMode} disabled={disabled} onChange={e => onUpdate({ distancePricingMode: e.target.value as any })} /></div>
             </div>
             {config.distancePricingMode === 'STANDARD' ? (
               <Input label="Flat Rate / KM" type="number" step="0.01" value={config.ratePerKm} disabled={disabled} onChange={e => onUpdate({ ratePerKm: parseFloat(e.target.value) || 0 })} />
             ) : (
               <div className="space-y-3">
                  {config.distanceTiers.map(t => (
                    <div key={t.id} className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                       <Input label="Up to (KM)" type="number" value={t.upToKm} disabled={disabled} onChange={e => onUpdate({ distanceTiers: config.distanceTiers.map(ti => ti.id === t.id ? { ...ti, upToKm: parseFloat(e.target.value) || 0 } : ti) })} />
                       <Input label="Rate / KM" type="number" step="0.01" value={t.rate} disabled={disabled} onChange={e => onUpdate({ distanceTiers: config.distanceTiers.map(ti => ti.id === t.id ? { ...ti, rate: parseFloat(e.target.value) || 0 } : ti) })} />
                    </div>
                  ))}
                  {!disabled && <Button variant="ghost" className="w-full" onClick={addTier} icon={<Plus size={16} />}>Add Slab</Button>}
               </div>
             )}
          </section>

          <section className="pt-10 border-t border-gray-100">
             <h3 className="text-lg md:text-xl font-black text-gray-900 mb-6 md:mb-8 flex items-center gap-3"><Shield size={20} className="text-amber-600" /> Fees & Wait</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8">
                <Input label="Commission %" type="number" step="0.1" value={config.commission} disabled={disabled} onChange={e => onUpdate({ commission: parseFloat(e.target.value) || 0 })} />
                <Input label="Tax %" type="number" step="0.1" value={config.tax} disabled={disabled} onChange={e => onUpdate({ tax: parseFloat(e.target.value) || 0 })} />
                <div className="grid grid-cols-1 gap-4 bg-gray-50 p-6 rounded-[24px] border border-gray-100 sm:col-span-2">
                   <div className="grid grid-cols-2 gap-4">
                     <Input label="Free Pickup" type="number" value={config.pickupWaitTime} disabled={disabled} onChange={e => onUpdate({ pickupWaitTime: parseInt(e.target.value) || 0 })} />
                     <Input label="Grace Wait" type="number" value={config.safeWaitTime} disabled={disabled} onChange={e => onUpdate({ safeWaitTime: parseInt(e.target.value) || 0 })} />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <Input label="Total Free" type="number" value={config.totalWaitTime} disabled={true} className="bg-gray-100" />
                     <Input label="Wait Rate" type="number" step="0.01" value={config.waitRate} disabled={disabled} onChange={e => onUpdate({ waitRate: parseFloat(e.target.value) || 0 })} />
                   </div>
                </div>
             </div>
          </section>
       </div>

       <div className="lg:col-span-4">
          <div className="sticky top-4 bg-gray-900 text-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] shadow-2xl relative overflow-hidden transition-all">
             <div className="relative z-10">
                <h4 className="text-[10px] font-black uppercase text-blue-400 tracking-widest flex items-center mb-6">
                   <Calculator size={14} className="mr-2" /> Fare Insight
                </h4>
                <div className="space-y-6 mb-8">
                   <div className="space-y-2">
                      <label className="text-[9px] font-bold text-gray-500 uppercase flex justify-between">Distance <span>{testDist} KM</span></label>
                      <input type="range" min="1" max="100" value={testDist} onChange={e=>setTestDist(parseInt(e.target.value))} className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-400" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-bold text-gray-500 uppercase flex justify-between">Wait <span>{testWait} Min</span></label>
                      <input type="range" min="0" max="60" value={testWait} onChange={e=>setTestWait(parseInt(e.target.value))} className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-400" />
                   </div>
                </div>
                <div className="space-y-4 pt-6 border-t border-white/10">
                   <div className="flex justify-between text-base"><span>Estimated</span><span className="font-black">{location.currency} {calculateFare().toFixed(2)}</span></div>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

const DynamicPricingHub: React.FC<{ 
  rules: SurgeRule[]; 
  setRules: React.Dispatch<React.SetStateAction<SurgeRule[]>>; 
  availableLocations: Location[]; 
  availableZones: OperationalZone[];
  disabled?: boolean; 
}> = ({ rules, setRules, availableLocations, availableZones, disabled }) => {
  const [modalState, setModalState] = useState<{ open: boolean; editId?: string }>({ open: false });
  const [formData, setFormData] = useState<Partial<SurgeRule>>({ name: '', pricingType: 'MULTIPLIER', pricingValue: 1.5, locationIds: [], vehicleTypes: [], zoneIds: [], isScheduled: true, startTime: '09:00', endTime: '18:00', isActive: true });

  const handleOpen = (rule?: SurgeRule) => {
    if (disabled) return;
    setFormData(rule || { name: '', pricingType: 'MULTIPLIER', pricingValue: 1.5, locationIds: [], vehicleTypes: [], zoneIds: [], isScheduled: true, startTime: '09:00', endTime: '18:00', isActive: true });
    setModalState({ open: true, editId: rule?.id });
  };

  const handleSave = () => {
    if (!formData.name) return;
    const rule = { ...formData, id: modalState.editId || Date.now().toString() } as SurgeRule;
    setRules(modalState.editId ? rules.map(r => r.id === modalState.editId ? rule : r) : [...rules, rule]);
    setModalState({ open: false });
  };

  const toggleRule = (id: string) => {
    if (disabled) return;
    setRules(rules.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
  };

  const toggleSelection = (key: keyof SurgeRule, val: any) => {
    const current = (formData[key] as any[]) || [];
    const updated = current.includes(val) ? current.filter(v => v !== val) : [...current, val];
    setFormData({ ...formData, [key]: updated });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Surcharge Registry</h3>
            <p className="text-xs md:text-sm text-gray-400 font-medium italic">Peak events and geo-multipliers.</p>
          </div>
          {!disabled && <Button variant="black" icon={<Plus size={18} />} onClick={() => handleOpen()} className="rounded-xl h-11 md:h-12 shadow-lg w-full sm:w-auto">New Policy</Button>}
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {rules.map(rule => (
            <div key={rule.id} className={`p-6 md:p-8 bg-white rounded-[32px] md:rounded-[40px] border border-gray-200 flex flex-col hover:shadow-xl transition-all border-b-8 ${rule.isActive ? 'border-b-blue-600/10' : 'grayscale opacity-60'}`}>
               <div className="flex justify-between items-start mb-6">
                  <div className={`p-2.5 rounded-xl ${rule.isActive ? (rule.pricingType === 'FLAT' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600') : 'bg-gray-100 text-gray-400'}`}>
                    {rule.name.toLowerCase().includes('night') ? <Moon size={20}/> : <Zap size={20}/>}
                  </div>
                  {!disabled && (
                    <div className="flex items-center gap-2">
                       <button onClick={() => handleOpen(rule)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors"><Edit2 size={16}/></button>
                       <label className="relative inline-flex items-center cursor-pointer scale-75">
                          <input type="checkbox" className="sr-only peer" checked={rule.isActive} onChange={() => toggleRule(rule.id)} />
                          <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
                       </label>
                    </div>
                  )}
               </div>
               <h4 className="font-black text-gray-900 text-base md:text-lg mb-1">{rule.name}</h4>
               <div className="flex items-baseline gap-2 mb-4">
                  <span className={`text-2xl md:text-3xl font-black ${rule.isActive ? 'text-gray-900' : 'text-gray-400'}`}>{rule.pricingType === 'MULTIPLIER' ? `${rule.pricingValue}x` : `+$${rule.pricingValue}`}</span>
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{rule.pricingType}</span>
               </div>
               
               <div className="space-y-2 mb-6">
                  <div className="flex flex-wrap gap-1">
                    {rule.locationIds.length > 0 && <span className="px-2 py-0.5 bg-gray-50 text-gray-400 text-[8px] font-bold rounded uppercase tracking-tighter">{rule.locationIds.length} Markets</span>}
                    {rule.vehicleTypes.length > 0 && <span className="px-2 py-0.5 bg-blue-50 text-blue-400 text-[8px] font-bold rounded uppercase tracking-tighter">{rule.vehicleTypes.length} Vehicle Types</span>}
                    {rule.zoneIds.length > 0 && <span className="px-2 py-0.5 bg-amber-50 text-amber-400 text-[8px] font-bold rounded uppercase tracking-tighter">{rule.zoneIds.length} Zones</span>}
                  </div>
               </div>

               <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-[9px] font-black uppercase tracking-widest mt-auto">
                  <span className="flex items-center gap-1 text-gray-400">
                    <Clock size={12}/> {rule.isScheduled ? `${rule.startTime}-${rule.endTime}` : '24/7 Always Active'}
                  </span>
                  <span className={rule.isActive ? 'text-blue-600' : 'text-gray-400'}>{rule.isActive ? 'Online' : 'Paused'}</span>
               </div>
            </div>
          ))}
       </div>

       <Modal isOpen={modalState.open} onClose={() => setModalState({ open: false })} title="Surge Configuration">
          <div className="space-y-6 max-h-[70vh] no-scrollbar">
             <section className="space-y-4">
                <Input label="Rule Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. New Year Peak" />
                <div className="grid grid-cols-2 gap-4">
                  <Select label="Math Type" options={[{ value: 'MULTIPLIER', label: 'Multiplier (x)' }, { value: 'FLAT', label: 'Flat Fee (+)' }]} value={formData.pricingType} onChange={e => setFormData({...formData, pricingType: e.target.value as any})} />
                  <Input label="Surge Value" type="number" step="0.01" value={formData.pricingValue} onChange={e => setFormData({...formData, pricingValue: parseFloat(e.target.value)})} />
                </div>
             </section>

             <div className="border-t border-gray-100 pt-6 space-y-6">
                {/* Location Selection */}
                <div>
                   <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3 flex items-center gap-2">
                      <Globe size={12} /> Target Markets
                   </p>
                   <div className="grid grid-cols-2 gap-2">
                      {availableLocations.map(loc => (
                        <button key={loc.id} onClick={() => toggleSelection('locationIds', loc.id)} className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-bold transition-all ${formData.locationIds?.includes(loc.id) ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-100 text-gray-400'}`}>
                           {formData.locationIds?.includes(loc.id) ? <CheckSquare size={16}/> : <Square size={16} className="opacity-20"/>}
                           {loc.name}
                        </button>
                      ))}
                   </div>
                </div>

                {/* Vehicle Type Selection */}
                <div>
                   <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3 flex items-center gap-2">
                      {/* Fixed: Car icon is now imported and used correctly */}
                      <Car size={12} /> Affected Categories
                   </p>
                   <div className="grid grid-cols-2 gap-2">
                      {Object.values(VehicleType).map(type => (
                        <button key={type} onClick={() => toggleSelection('vehicleTypes', type)} className={`flex items-center gap-3 p-3 rounded-xl border text-[10px] font-black uppercase tracking-tighter transition-all ${formData.vehicleTypes?.includes(type) ? 'bg-gray-900 border-gray-900 text-white shadow-md' : 'bg-white border-gray-100 text-gray-400'}`}>
                           {formData.vehicleTypes?.includes(type) ? <CheckSquare size={14}/> : <Square size={14} className="opacity-20"/>}
                           {type.replace('_', ' ')}
                        </button>
                      ))}
                   </div>
                </div>

                {/* Zone Selection */}
                {formData.locationIds && formData.locationIds.length > 0 && (
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3 flex items-center gap-2">
                        <MapPin size={12} /> Specific Geofences (Optional)
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                        {availableZones.filter(z => formData.locationIds?.includes(z.locationId)).map(zone => (
                          <button key={zone.id} onClick={() => toggleSelection('zoneIds', zone.id)} className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-bold transition-all ${formData.zoneIds?.includes(zone.id) ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-gray-100 text-gray-400'}`}>
                            {formData.zoneIds?.includes(zone.id) ? <CheckSquare size={16}/> : <Square size={16} className="opacity-20"/>}
                            {zone.name}
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {/* Scheduling */}
                <div className="p-5 bg-gray-50 rounded-[24px] border border-gray-100">
                   <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                         <Calendar size={16} className="text-gray-400"/>
                         <span className="text-sm font-bold text-gray-900">Time-Based Schedule</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer scale-90">
                          <input type="checkbox" className="sr-only peer" checked={formData.isScheduled} onChange={() => setFormData({...formData, isScheduled: !formData.isScheduled})} />
                          <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
                      </label>
                   </div>
                   
                   {formData.isScheduled && (
                     <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                        <Input label="Start" type="time" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
                        <Input label="End" type="time" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} />
                     </div>
                   )}
                </div>
             </div>

             <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <Button variant="secondary" onClick={() => setModalState({ open: false })}>Cancel</Button>
                <Button variant="black" onClick={handleSave} className="px-10">Save Policy</Button>
             </div>
          </div>
       </Modal>
    </div>
  );
};

const MarketSetup: React.FC<{ 
  locations: Location[]; 
  setLocations: React.Dispatch<React.SetStateAction<Location[]>>; 
  zones: OperationalZone[]; 
  setZones: React.Dispatch<React.SetStateAction<OperationalZone[]>>; 
  selectedLocationId: string; 
  setSelectedLocationId: (id: string) => void; 
  disabled?: boolean; 
}> = ({ locations, setLocations, zones, setZones, selectedLocationId, setSelectedLocationId, disabled }) => {
  const [locModal, setLocModal] = useState<{ open: boolean; editId?: string }>({ open: false });
  const [zoneModal, setZoneModal] = useState<{ open: boolean; editId?: string }>({ open: false });
  const [locData, setLocData] = useState<Partial<Location>>({ name: '', country: '', currency: 'USD' });
  const [zoneData, setZoneData] = useState<Partial<OperationalZone>>({ name: '', radius: 1000, lat: 40.7128, lng: -74.0060, isActive: true });
  
  const activeZones = zones.filter(z => z.locationId === selectedLocationId);
  const activeLocation = locations.find(l => l.id === selectedLocationId) || locations[0];

  const handleOpenLoc = (loc?: Location) => {
    if (disabled) return;
    setLocData(loc || { name: '', country: '', currency: 'USD' });
    setLocModal({ open: true, editId: loc?.id });
  };

  const handleOpenZone = (zone?: OperationalZone) => {
    if (disabled) return;
    setZoneData(zone || { name: '', radius: 1000, lat: 40.7128, lng: -74.0060, isActive: true });
    setZoneModal({ open: true, editId: zone?.id });
  };

  const saveLoc = () => {
    if (!locData.name) return;
    const newLoc = { ...locData, id: locModal.editId || `loc-${Date.now()}`, isActive: true } as Location;
    setLocations(locModal.editId ? locations.map(l => l.id === locModal.editId ? newLoc : l) : [...locations, newLoc]);
    setLocModal({ open: false });
  };

  const saveZone = () => {
    if (!zoneData.name) return;
    const newZone = { ...zoneData, id: zoneModal.editId || `z-${Date.now()}`, locationId: selectedLocationId, isActive: true } as OperationalZone;
    setZones(zoneModal.editId ? zones.map(z => z.id === zoneModal.editId ? newZone : z) : [...zones, newZone]);
    setZoneModal({ open: false });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 animate-in fade-in slide-in-from-right-8 duration-500 pb-20">
       <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-gray-200 shadow-sm overflow-hidden">
             <div className="flex justify-between items-center mb-6 md:mb-8">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Target Markets</h3>
                {!disabled && <Button size="sm" variant="ghost" onClick={() => handleOpenLoc()}><Plus size={20} /></Button>}
             </div>
             <div className="space-y-2">
                {locations.map(loc => (
                   <button key={loc.id} onClick={() => setSelectedLocationId(loc.id)} className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${selectedLocationId === loc.id ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-gray-50 border-transparent text-gray-500'}`}>
                      <div className="flex items-center space-x-3">
                         <Globe size={16} className={selectedLocationId === loc.id ? 'text-blue-600' : 'text-gray-300'} />
                         <span className="text-sm font-black tracking-tight">{loc.name}</span>
                      </div>
                      <ChevronRight size={14} className={selectedLocationId === loc.id ? 'opacity-100' : 'opacity-0'} />
                   </button>
                ))}
             </div>
          </div>
       </div>

       <div className="lg:col-span-8 space-y-6">
          <div className={`bg-white p-6 md:p-10 rounded-[32px] md:rounded-[48px] border border-gray-200 shadow-sm min-h-[400px] transition-opacity ${disabled ? 'opacity-80' : ''}`}>
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 md:mb-10">
                <div>
                   <h3 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Geo Hubs</h3>
                   <p className="text-xs text-gray-500 font-medium italic">Detection for {activeLocation.name}.</p>
                </div>
                {!disabled && <Button variant="black" icon={<Plus size={18} />} onClick={() => handleOpenZone()} className="rounded-xl h-11 md:h-12 shadow-lg w-full sm:w-auto">Add Hub</Button>}
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {activeZones.map(zone => (
                   <div key={zone.id} className="p-6 bg-white rounded-[24px] md:rounded-[32px] border border-gray-100 group relative hover:shadow-lg transition-all">
                      <div className="flex justify-between items-start mb-4">
                         <div className="flex items-center space-x-3">
                            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0"><MapPin size={20} /></div>
                            <h4 className="font-black text-gray-900 tracking-tight truncate max-w-[120px]">{zone.name}</h4>
                         </div>
                         {!disabled && (
                            <div className="flex gap-1">
                               <button onClick={() => handleOpenZone(zone)} className="p-2 text-gray-400 hover:text-blue-600"><Edit2 size={14} /></button>
                            </div>
                         )}
                      </div>
                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-auto border-t border-gray-50 pt-4">
                         {zone.radius}m Detection Radius
                      </div>
                   </div>
                ))}
             </div>
          </div>
       </div>

       <Modal isOpen={locModal.open} onClose={() => setLocModal({ open: false })} title="Market Setup">
          <div className="space-y-4">
             <Input label="Name" value={locData.name} onChange={e => setLocData({...locData, name: e.target.value})} placeholder="e.g. Paris" />
             <Input label="Country" value={locData.country} onChange={e => setLocData({...locData, country: e.target.value})} placeholder="e.g. France" />
             <Input label="Currency" value={locData.currency} onChange={e => setLocData({...locData, currency: e.target.value})} placeholder="e.g. EUR" />
             <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="secondary" onClick={() => setLocModal({ open: false })}>Cancel</Button>
                <Button variant="black" onClick={saveLoc}>Establish Market</Button>
             </div>
          </div>
       </Modal>

       <Modal isOpen={zoneModal.open} onClose={() => setZoneModal({ open: false })} title="Geofence Spec">
          <div className="space-y-5">
             <Input label="Hub Name" value={zoneData.name} onChange={e => setZoneData({...zoneData, name: e.target.value})} placeholder="e.g. Central Station" />
             <MapPicker lat={zoneData.lat || 40.7128} lng={zoneData.lng || -74.0060} radius={zoneData.radius || 1000} onChange={(lat, lng) => setZoneData({...zoneData, lat, lng})} />
             <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="secondary" onClick={() => setZoneModal({ open: false })}>Cancel</Button>
                <Button variant="black" onClick={saveZone}>Define Geofence</Button>
             </div>
          </div>
       </Modal>
    </div>
  );
};
