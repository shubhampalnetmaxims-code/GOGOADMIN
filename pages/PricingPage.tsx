
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Save, MapPin, Zap, Plus, Trash2, Globe, CheckCircle2, Navigation, Clock, Timer, Layers, Map as MapIcon,
  Edit2, ChevronRight, DollarSign, Moon, HelpCircle, Calculator, Check, Shield, Lock, Trash, Coffee, AlertTriangle,
  Settings, Target, Crosshair, BarChart3, CloudRain, ChevronDown
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
  safeWaitTime: 5, // Grace Wait
  pickupWaitTime: 2,
  totalWaitTime: 7, // 2 + 5
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

// Interactive Map Picker Component
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
    <div className="relative w-full h-64 rounded-[20px] overflow-hidden border border-gray-200 shadow-inner group">
      <div ref={mapContainerRef} className="w-full h-full" />
      <div className="absolute top-4 left-4 z-[100] px-3 py-1.5 bg-white/90 backdrop-blur shadow-sm border border-gray-100 rounded-full flex items-center gap-2">
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
      
      // Enforce: totalWaitTime = pickupWaitTime + safeWaitTime (Grace Wait)
      if ('pickupWaitTime' in updates || 'safeWaitTime' in updates) {
        merged.totalWaitTime = (merged.pickupWaitTime || 0) + (merged.safeWaitTime || 0);
      }
      
      return { ...prev, [currentContextKey]: merged };
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col bg-gray-50/30">
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6 bg-white p-8 rounded-[40px] border border-gray-200 shadow-sm relative overflow-hidden">
        {isCurrentViewLocked && <div className="absolute top-0 left-0 w-full h-1 bg-gray-900 shadow-sm" />}
        <div className="flex items-center space-x-6">
          <div className={`p-4 rounded-[24px] text-white shadow-2xl transition-colors duration-500 ${isCurrentViewLocked ? 'bg-gray-400' : 'bg-gray-900'}`}><Globe size={28} /></div>
          <div>
            <div className="flex items-center space-x-3 mb-1">
               <h1 className="text-2xl font-black text-gray-900 tracking-tight">Fleet Pricing Hub</h1>
               <span className="bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{service}</span>
               <button onClick={() => setShowGlobalInfo(true)} className="p-1.5 bg-gray-100 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all">
                 <HelpCircle size={18} />
               </button>
               {isCurrentViewLocked && <Lock size={14} className="text-gray-400" />}
            </div>
            <div className="text-xs font-black text-gray-400 uppercase tracking-widest">
              {activeMode === 'dynamic' ? 'Dynamic Surcharge Controls' : activeMode === 'setup' ? 'Global Market Management' : `Market: ${activeLocation.name}`}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
           <div className="flex bg-gray-100 p-1.5 rounded-2xl">
              <button onClick={() => setActiveMode('matrix')} className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeMode === 'matrix' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}><DollarSign size={14} /> <span>Pricing</span></button>
              <button onClick={() => setActiveMode('dynamic')} className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeMode === 'dynamic' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}><Zap size={14} /> <span>Surcharges</span></button>
              <button onClick={() => setActiveMode('setup')} className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeMode === 'setup' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}><Layers size={14} /> <span>Manage Locations</span></button>
           </div>
           <Button variant="black" onClick={() => setLockedStates(p => ({...p, [activeMode === 'matrix' ? currentContextKey : activeMode]: !isCurrentViewLocked}))} className="rounded-2xl h-14 px-8 shadow-xl transition-all">
             {isCurrentViewLocked ? <Edit2 size={18} /> : <Save size={18} />}
           </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pr-2 no-scrollbar pb-12">
        {activeMode === 'matrix' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center space-x-3 overflow-x-auto pb-2 no-scrollbar">
               {Object.values(VehicleType).map((type) => (
                 <button key={type} onClick={() => setSelectedVehicle(type)} className={`shrink-0 flex items-center space-x-3 px-8 py-4 rounded-2xl border transition-all ${selectedVehicle === type ? 'bg-gray-900 text-white shadow-xl' : 'bg-white text-gray-500'}`}>
                   <CheckCircle2 size={16} className={selectedVehicle === type ? 'text-blue-400' : 'text-gray-200'} />
                   <span className="text-xs font-black uppercase tracking-tight">{type.replace('_', ' ')}</span>
                 </button>
               ))}
            </div>
            <div className={`bg-white rounded-[48px] border border-gray-200 shadow-sm p-12 overflow-hidden transition-opacity ${isCurrentViewLocked ? 'opacity-80' : ''}`}>
               <RateCardView config={activeConfig} onUpdate={updateActiveConfig} location={activeLocation} disabled={isCurrentViewLocked} />
            </div>
          </div>
        ) : activeMode === 'dynamic' ? (
          <DynamicPricingHub rules={globalSurgeRules} setRules={setGlobalSurgeRules} availableLocations={locations} availableZones={zones} disabled={isCurrentViewLocked} />
        ) : (
          <MarketSetup locations={locations} setLocations={setLocations} zones={zones} setZones={setZones} selectedLocationId={selectedLocationId} setSelectedLocationId={setSelectedLocationId} disabled={isCurrentViewLocked} />
        )}
      </div>

      <Modal isOpen={showGlobalInfo} onClose={() => setShowGlobalInfo(false)} title="Advanced Pricing Architecture">
        <div className="space-y-6">
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
            <h4 className="flex items-center text-blue-900 font-bold mb-2"><Calculator size={18} className="mr-2" /> Live Pricing Formula</h4>
            <div className="bg-white/80 p-4 rounded-xl font-mono text-xs leading-relaxed text-blue-800 border border-blue-200">
              <div className="font-bold border-b border-blue-100 pb-2 mb-2">Customer Fare =</div>
              <div className="pl-4">
                Max( <span className="text-blue-900 font-bold">Minimum Fare</span>, <br/>
                &nbsp;&nbsp;(<span className="text-blue-900">Base Fare</span> + <br/>
                &nbsp;&nbsp;<span className="text-blue-600 italic font-bold">Sum of Distance Slabs (Tiered)</span> + <br/>
                &nbsp;&nbsp;(<span className="text-blue-900">Time</span> × <span className="text-blue-900">Rate/Min</span>) + <br/>
                &nbsp;&nbsp;<span className="text-blue-600 italic font-bold">Active Surcharge Triggers</span>) × <span className="text-blue-600 font-black">Dynamic Multiplier</span><br/>
                ) + <span className="text-blue-900 italic font-bold">Wait Fees</span> + <span className="text-blue-900">Tax</span>
              </div>
            </div>
          </div>
          <Button variant="black" fullWidth onClick={() => setShowGlobalInfo(false)}>Acknowledge</Button>
        </div>
      </Modal>
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
    // Fare calculation uses totalWaitTime as the threshold for billing
    const wFare = Math.max(0, testWait - config.totalWaitTime) * config.waitRate;
    const subtotal = Math.max(config.minFare, config.baseFare + dFare + tFare);
    return subtotal + wFare;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
       <div className="lg:col-span-8 space-y-12">
          <section>
             <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3"><Timer className="text-blue-600" /> Core Fare Specs</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Input label="Base Flagfall" info="Initial cost applied when the trip starts." type="number" step="0.01" value={config.baseFare} disabled={disabled} onChange={e => onUpdate({ baseFare: parseFloat(e.target.value) || 0 })} />
                <Input label="Minimum Fare" info="The floor price for any trip regardless of distance/time." type="number" step="0.01" value={config.minFare} disabled={disabled} onChange={e => onUpdate({ minFare: parseFloat(e.target.value) || 0 })} />
                <Input label="Rate / Minute" info="Cost applied for every minute elapsed during the ride." type="number" step="0.01" value={config.ratePerMin} disabled={disabled} onChange={e => onUpdate({ ratePerMin: parseFloat(e.target.value) || 0 })} />
             </div>
          </section>
          <section className="pt-12 border-t border-gray-100">
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-3"><BarChart3 className="text-indigo-600" /> Distance Logic</h3>
                <div className="w-56"><Select label="Mode" info="Standard uses a flat rate. Tiered uses progressive slabs." options={[{ value: 'STANDARD', label: 'Flat Rate' }, { value: 'TIERED', label: 'Tiered Slabs' }]} value={config.distancePricingMode} disabled={disabled} onChange={e => onUpdate({ distancePricingMode: e.target.value as any })} /></div>
             </div>
             {config.distancePricingMode === 'STANDARD' ? (
               <Input label="Flat Rate / KM" info="Constant price for every KM traveled." type="number" step="0.01" value={config.ratePerKm} disabled={disabled} onChange={e => onUpdate({ ratePerKm: parseFloat(e.target.value) || 0 })} />
             ) : (
               <div className="space-y-4">
                  {config.distanceTiers.map(t => (
                    <div key={t.id} className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                       <Input label="Up to (KM)" type="number" value={t.upToKm} disabled={disabled} onChange={e => onUpdate({ distanceTiers: config.distanceTiers.map(ti => ti.id === t.id ? { ...ti, upToKm: parseFloat(e.target.value) || 0 } : ti) })} />
                       <Input label="Rate / KM" type="number" step="0.01" value={t.rate} disabled={disabled} onChange={e => onUpdate({ distanceTiers: config.distanceTiers.map(ti => ti.id === t.id ? { ...ti, rate: parseFloat(e.target.value) || 0 } : ti) })} />
                    </div>
                  ))}
                  {!disabled && <Button variant="ghost" onClick={addTier} icon={<Plus size={16} />}>Add New Slab</Button>}
               </div>
             )}
          </section>
          <section className="pt-12 border-t border-gray-100">
             <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3"><Shield className="text-amber-600" /> Drop & Platform Fees</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Input label="Commission %" info="Percentage of fare taken by the platform." type="number" step="0.1" value={config.commission} disabled={disabled} onChange={e => onUpdate({ commission: parseFloat(e.target.value) || 0 })} />
                <Input label="Regulatory Tax %" info="Local government taxes applied to the ride." type="number" step="0.1" value={config.tax} disabled={disabled} onChange={e => onUpdate({ tax: parseFloat(e.target.value) || 0 })} />
                <Input label="Cancel Fee" info="Penalty charged for user cancellations." type="number" step="0.01" value={config.cancelFee} disabled={disabled} onChange={e => onUpdate({ cancelFee: parseFloat(e.target.value) || 0 })} />
                <div className="grid grid-cols-2 gap-6 bg-gray-50 p-6 rounded-[32px] border border-gray-100 md:col-span-2">
                  <Input label="Pickup Wait Time" info="Minutes driver waits at pickup point for free." type="number" value={config.pickupWaitTime} disabled={disabled} onChange={e => onUpdate({ pickupWaitTime: parseInt(e.target.value) || 0 })} />
                  <Input label="Grace Wait" info="Initial minutes of general free waiting." type="number" value={config.safeWaitTime} disabled={disabled} onChange={e => onUpdate({ safeWaitTime: parseInt(e.target.value) || 0 })} />
                  <Input 
                    label="Total Wait Time" 
                    info="Calculated sum of Pickup Wait and Grace Wait. This is the total free window before billing starts." 
                    type="number" 
                    value={config.totalWaitTime} 
                    disabled={true} 
                    className="bg-gray-100 font-bold border-dashed"
                  />
                  <Input label="Wait Rate/Min" info="Cost applied per minute of billable waiting time." type="number" step="0.01" value={config.waitRate} disabled={disabled} onChange={e => onUpdate({ waitRate: parseFloat(e.target.value) || 0 })} />
                </div>
             </div>
          </section>
       </div>

       <div className="lg:col-span-4">
          <div className="sticky top-8 bg-gray-900 text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden transition-all">
             <div className="relative z-10">
                <h4 className="text-[10px] font-black uppercase text-blue-400 tracking-widest flex items-center mb-8">
                   <Calculator size={14} className="mr-2" /> Fare Insight Engine
                </h4>
                <div className="space-y-6 mb-10">
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase flex justify-between">Distance <span>{testDist} KM</span></label>
                      <input type="range" min="1" max="100" value={testDist} onChange={e=>setTestDist(parseInt(e.target.value))} className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-400" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase flex justify-between">Wait Duration <span>{testWait} Min</span></label>
                      <input type="range" min="0" max="60" value={testWait} onChange={e=>setTestWait(parseInt(e.target.value))} className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-400" />
                      <p className="text-[9px] text-gray-500 italic mt-1 font-medium">Free threshold: {config.totalWaitTime} min</p>
                   </div>
                </div>
                <div className="space-y-4 pt-6 border-t border-white/10">
                   <div className="flex justify-between text-sm text-gray-400"><span>Estimated Fare</span><span className="text-white font-black">{location.currency} {calculateFare().toFixed(2)}</span></div>
                   <div className="flex justify-between text-[10px] text-gray-500 uppercase font-black"><span>Platform Share</span><span>{location.currency} {((calculateFare()*config.commission)/100).toFixed(2)}</span></div>
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
    if (!formData.name || (formData.locationIds?.length === 0 && formData.zoneIds?.length === 0)) return;
    const rule = { ...formData, id: modalState.editId || Date.now().toString() } as SurgeRule;
    setRules(modalState.editId ? rules.map(r => r.id === modalState.editId ? rule : r) : [...rules, rule]);
    setModalState({ open: false });
  };

  const toggleRule = (id: string) => {
    if (disabled) return;
    setRules(rules.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
  };

  const filteredSubZones = useMemo(() => {
    if (!formData.locationIds?.length) return [];
    return availableZones.filter(z => formData.locationIds!.includes(z.locationId));
  }, [formData.locationIds, availableZones]);

  return (
    <div className="space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-4">
       <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Surcharge Hub</h3>
            <p className="text-sm text-gray-400 font-medium italic">Peak events, multi-tier surge, and geofence-specific multipliers.</p>
          </div>
          {!disabled && <Button variant="black" icon={<Plus size={18} />} onClick={() => handleOpen()} className="rounded-2xl h-12 shadow-lg">New Surge Policy</Button>}
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {rules.map(rule => (
            <div key={rule.id} className={`p-8 bg-white rounded-[40px] border border-gray-200 flex flex-col hover:shadow-2xl transition-all border-b-8 ${rule.isActive ? 'border-b-blue-600/10' : 'grayscale opacity-60'}`}>
               <div className="flex justify-between items-start mb-6">
                  <div className={`p-3 rounded-2xl ${rule.isActive ? (rule.pricingType === 'FLAT' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600') : 'bg-gray-100 text-gray-400'}`}>
                    {rule.name.toLowerCase().includes('night') ? <Moon size={24}/> : <Zap size={24}/>}
                  </div>
                  {!disabled && (
                    <div className="flex items-center gap-2">
                       <button onClick={() => handleOpen(rule)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors"><Edit2 size={16}/></button>
                       <label className="relative inline-flex items-center cursor-pointer scale-90">
                          <input type="checkbox" className="sr-only peer" checked={rule.isActive} onChange={() => toggleRule(rule.id)} />
                          <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
                       </label>
                    </div>
                  )}
               </div>
               <h4 className="font-black text-gray-900 text-lg mb-1">{rule.name}</h4>
               <div className="flex items-baseline gap-2 mb-6">
                  <span className={`text-3xl font-black ${rule.isActive ? 'text-gray-900' : 'text-gray-400'}`}>{rule.pricingType === 'MULTIPLIER' ? `${rule.pricingValue}x` : `+$${rule.pricingValue}`}</span>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{rule.pricingType}</span>
               </div>
               <div className="flex-1 space-y-2 mb-6">
                  <div className="flex flex-wrap gap-1.5">
                    {rule.locationIds.map(lid => <span key={lid} className="px-2 py-0.5 bg-gray-100 text-[9px] font-black rounded-md">{availableLocations.find(l => l.id === lid)?.name}</span>)}
                    {rule.zoneIds.map(zid => <span key={zid} className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[9px] font-black rounded-md">{availableZones.find(z => z.id === zid)?.name}</span>)}
                  </div>
               </div>
               <div className="flex items-center justify-between pt-6 border-t border-gray-100 text-[10px] font-black uppercase tracking-widest">
                  <span className="flex items-center gap-1.5 text-gray-400">{rule.isScheduled ? <Clock size={12}/> : <Timer size={12}/>} {rule.isScheduled ? `${rule.startTime}-${rule.endTime}` : '24/7'}</span>
                  <span className={rule.isActive ? 'text-blue-600 font-black' : 'text-gray-400'}>{rule.isActive ? 'Active' : 'Paused'}</span>
               </div>
            </div>
          ))}
       </div>

       <Modal isOpen={modalState.open} onClose={() => setModalState({ open: false })} title={modalState.editId ? "Modify Surcharge" : "New Surge Hub"}>
          <div className="space-y-8 max-h-[70vh] overflow-y-auto pr-2 no-scrollbar">
             <Input label="Event Name" info="Identifier for the surge logic (e.g. Festival Rush)." value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
             
             <div className="grid grid-cols-2 gap-6">
                <Select label="Pricing Type" info="Multiplier scales existing fare; Flat adds a dollar amount." options={[{ value: 'MULTIPLIER', label: 'Multiplier (x)' }, { value: 'FLAT', label: 'Flat Fee (+)' }]} value={formData.pricingType} onChange={e => setFormData({...formData, pricingType: e.target.value as any})} />
                <Input label="Value" info="Numerical factor or amount." type="number" step="0.01" value={formData.pricingValue} onChange={e => setFormData({...formData, pricingValue: parseFloat(e.target.value)})} />
             </div>

             <div className="space-y-4">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">Fleet Targets</label>
                <div className="grid grid-cols-2 gap-2">
                   {Object.values(VehicleType).map(type => (
                      <label key={type} className={`flex items-center p-3 rounded-xl border transition-all cursor-pointer ${formData.vehicleTypes?.includes(type) ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100'}`}>
                         <input type="checkbox" className="hidden" checked={formData.vehicleTypes?.includes(type)} onChange={() => {
                            const cur = formData.vehicleTypes || []; setFormData({...formData, vehicleTypes: cur.includes(type) ? cur.filter(t => t !== type) : [...cur, type]});
                         }} />
                         <span className="text-[10px] font-black uppercase tracking-tight">{type.replace('_', ' ')}</span>
                      </label>
                   ))}
                </div>
             </div>

             <div className="space-y-4">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">Market Activation</label>
                <div className="grid grid-cols-2 gap-2">
                   {availableLocations.map(loc => (
                      <label key={loc.id} className={`flex items-center p-3 rounded-xl border transition-all cursor-pointer ${formData.locationIds?.includes(loc.id) ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-white border-gray-100'}`}>
                         <input type="checkbox" className="hidden" checked={formData.locationIds?.includes(loc.id)} onChange={() => {
                            const cur = formData.locationIds || []; setFormData({...formData, locationIds: cur.includes(loc.id) ? cur.filter(id => id !== loc.id) : [...cur, loc.id]});
                         }} />
                         <span className="text-[10px] font-black uppercase">{loc.name}</span>
                      </label>
                   ))}
                </div>
             </div>

             {filteredSubZones.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-gray-100 animate-in fade-in">
                   <label className="text-xs font-black text-blue-600 uppercase tracking-widest block">Sub-Geofences</label>
                   <p className="text-[10px] text-gray-400 font-bold italic">Leave empty to apply surge to entire city.</p>
                   <div className="grid grid-cols-1 gap-2">
                      {filteredSubZones.map(zone => (
                         <label key={zone.id} className={`flex items-center p-3 rounded-xl border transition-all cursor-pointer ${formData.zoneIds?.includes(zone.id) ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-white border-gray-100'}`}>
                            <input type="checkbox" className="hidden" checked={formData.zoneIds?.includes(zone.id)} onChange={() => {
                               const cur = formData.zoneIds || []; setFormData({...formData, zoneIds: cur.includes(zone.id) ? cur.filter(id => id !== zone.id) : [...cur, zone.id]});
                            }} />
                            <span className="text-[10px] font-black uppercase">{zone.name}</span>
                         </label>
                      ))}
                   </div>
                </div>
             )}

             <div className="space-y-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                   <span className="text-sm font-bold text-gray-900">Enable Schedule</span>
                   <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={formData.isScheduled} onChange={() => setFormData({...formData, isScheduled: !formData.isScheduled})} />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
                   </label>
                </div>
                {formData.isScheduled && (
                   <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                      <Input label="Start" type="time" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
                      <Input label="End" type="time" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} />
                   </div>
                )}
             </div>

             <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <Button variant="secondary" onClick={() => setModalState({ open: false })}>Discard</Button>
                <Button variant="black" onClick={handleSave}>{modalState.editId ? 'Apply Update' : 'Launch Surge'}</Button>
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
    setZoneData(zone || { name: '', radius: 1000, lat: activeLocation.name === 'Dubai' ? 25.2048 : 40.7128, lng: activeLocation.name === 'Dubai' ? 55.2708 : -74.0060, isActive: true });
    setZoneModal({ open: true, editId: zone?.id });
  };

  const saveLoc = () => {
    if (!locData.name) return;
    const loc = { ...locData, id: locModal.editId || Date.now().toString(), isActive: true } as Location;
    setLocations(locModal.editId ? locations.map(l => l.id === locModal.editId ? loc : l) : [...locations, loc]);
    setLocModal({ open: false });
  };

  const saveZone = () => {
    if (!zoneData.name) return;
    const zone = { ...zoneData, id: zoneModal.editId || Date.now().toString(), locationId: selectedLocationId } as OperationalZone;
    setZones(zoneModal.editId ? zones.map(z => z.id === zoneModal.editId ? zone : z) : [...zones, zone]);
    setZoneModal({ open: false });
  };

  const deleteLoc = (id: string) => {
    if (disabled || locations.length <= 1) return;
    if (confirm('Delete this market? This will remove all linked geofences.')) {
      setLocations(locations.filter(l => l.id !== id));
      setZones(zones.filter(z => z.locationId !== id));
      if (selectedLocationId === id) setSelectedLocationId(locations.find(l=>l.id !== id)?.id || '');
    }
  };

  const deleteZone = (id: string) => {
    if (disabled) return;
    if (confirm('Remove this geofence hub?')) {
      setZones(zones.filter(z => z.id !== id));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in fade-in slide-in-from-right-8 duration-500 pb-20">
       {/* Market List Sidebar */}
       <div className="lg:col-span-4 space-y-8">
          <div className="bg-white p-8 rounded-[40px] border border-gray-200 shadow-sm transition-all overflow-hidden">
             <div className="flex justify-between items-center mb-10">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400">Target Markets</h3>
                {!disabled && <Button size="sm" variant="ghost" onClick={() => handleOpenLoc()}><Plus size={20} /></Button>}
             </div>
             <div className="space-y-3">
                {locations.map(loc => (
                   <div key={loc.id} className="group relative">
                      <button onClick={() => setSelectedLocationId(loc.id)} className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all ${selectedLocationId === loc.id ? 'bg-blue-50 border-blue-200 text-blue-900 shadow-sm' : 'bg-gray-50 border-transparent text-gray-500 hover:border-gray-200'}`}>
                         <div className="flex items-center space-x-4">
                            <Globe size={18} className={selectedLocationId === loc.id ? 'text-blue-600' : 'text-gray-300'} />
                            <div className="text-left">
                               <span className="block text-sm font-black tracking-tight">{loc.name}</span>
                               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{loc.currency} | {loc.country}</span>
                            </div>
                         </div>
                         <ChevronRight size={14} className={selectedLocationId === loc.id ? 'opacity-100' : 'opacity-0'} />
                      </button>
                      {!disabled && (
                        <div className="absolute top-1/2 -right-12 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all group-hover:right-3 pointer-events-none group-hover:pointer-events-auto">
                           <button onClick={(e) => { e.stopPropagation(); handleOpenLoc(loc); }} className="p-2 bg-white border border-gray-100 rounded-lg text-blue-600 shadow-sm hover:scale-110 transition-all"><Edit2 size={12}/></button>
                           {locations.length > 1 && <button onClick={(e) => { e.stopPropagation(); deleteLoc(loc.id); }} className="p-2 bg-white border border-gray-100 rounded-lg text-red-500 shadow-sm hover:scale-110 transition-all"><Trash2 size={12}/></button>}
                        </div>
                      )}
                   </div>
                ))}
             </div>
          </div>
       </div>

       {/* Geofence Registry Area */}
       <div className="lg:col-span-8 space-y-8">
          <div className={`bg-white p-10 rounded-[48px] border border-gray-200 shadow-sm min-h-[500px] transition-opacity ${disabled ? 'opacity-80' : ''}`}>
             <div className="flex justify-between items-center mb-10">
                <div>
                   <h3 className="text-2xl font-black text-gray-900 tracking-tight">Geo-Spatial Registry</h3>
                   <p className="text-sm text-gray-500 italic font-medium italic">High-precision geofence detection hubs for {activeLocation.name}.</p>
                </div>
                {!disabled && <Button variant="black" icon={<Plus size={18} />} onClick={() => handleOpenZone()} className="rounded-2xl h-12 shadow-lg">New Hub Hub</Button>}
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {activeZones.map(zone => (
                   <div key={zone.id} className={`p-8 bg-white rounded-[40px] border border-gray-100 group relative hover:shadow-xl transition-all border-b-4 border-b-transparent hover:border-b-blue-600 ${!zone.isActive ? 'grayscale opacity-60' : ''}`}>
                      <div className="flex justify-between items-start mb-6">
                         <div className="flex items-center space-x-4">
                            <div className={`p-3 rounded-2xl shadow-sm transition-transform ${zone.isActive ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}><MapPin size={24} /></div>
                            <h4 className="font-black text-gray-900 tracking-tight">{zone.name}</h4>
                         </div>
                         {!disabled && (
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                               <button onClick={() => handleOpenZone(zone)} className="p-2.5 text-gray-400 hover:text-blue-600 bg-gray-50 rounded-xl"><Edit2 size={16} /></button>
                               <button onClick={() => deleteZone(zone.id)} className="p-2.5 text-gray-300 hover:text-red-500 bg-gray-50 rounded-xl"><Trash2 size={16} /></button>
                            </div>
                         )}
                      </div>
                      <div className="space-y-1 mb-8">
                         <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Global Coordinates</span>
                         <span className="text-xs font-bold text-gray-900">{zone.lat.toFixed(4)}, {zone.lng.toFixed(4)} • {zone.radius}m detection</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-black text-gray-400 uppercase tracking-widest mt-auto pt-6 border-t border-gray-100">
                         <span className="flex items-center gap-2 text-blue-600"><Layers size={14}/> Active Registry</span>
                         <div className="flex items-center space-x-2">
                            <span className={zone.isActive ? 'text-blue-600' : 'text-gray-400'}>{zone.isActive ? 'Online' : 'Paused'}</span>
                            {!disabled && (
                               <input type="checkbox" checked={zone.isActive} onChange={() => setZones(zones.map(z=>z.id===zone.id?{...z, isActive:!z.isActive}:z))} className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                            )}
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          </div>
       </div>

       {/* Modal: Market CRUD */}
       <Modal isOpen={locModal.open} onClose={() => setLocModal({ open: false })} title={locModal.editId ? "Update Market Specs" : "Register Global Market"}>
          <div className="space-y-6">
             <Input label="Market Name" info="The display name for this city/region." placeholder="e.g. New York City" value={locData.name} onChange={e => setLocData({...locData, name: e.target.value})} />
             <Input label="Country Code" info="Short form country identifier." placeholder="e.g. USA" value={locData.country} onChange={e => setLocData({...locData, country: e.target.value})} />
             <Input label="Local Currency" info="Currency used for all billing in this market." placeholder="e.g. USD" value={locData.currency} onChange={e => setLocData({...locData, currency: e.target.value})} />
             <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <Button variant="secondary" onClick={() => setLocModal({ open: false })}>Discard</Button>
                <Button variant="black" onClick={saveLoc}>Commit Changes</Button>
             </div>
          </div>
       </Modal>

       {/* Modal: Geofence CRUD */}
       <Modal isOpen={zoneModal.open} onClose={() => setZoneModal({ open: false })} title={zoneModal.editId ? "Modify Registry" : "Define Geofence Spec"}>
          <div className="space-y-6">
             <Input label="Geofence Name" info="Identifier for this operational hub." placeholder="e.g. Terminal 4 JFK" value={zoneData.name} onChange={e => setZoneData({...zoneData, name: e.target.value})} />
             <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Interactive Placement</label>
                <MapPicker lat={zoneData.lat || 40.7128} lng={zoneData.lng || -74.0060} radius={zoneData.radius || 1000} onChange={(lat, lng) => setZoneData({...zoneData, lat, lng})} />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <Input label="Detection Radius (m)" type="number" value={zoneData.radius} onChange={e => setZoneData({...zoneData, radius: parseInt(e.target.value)||0})} />
                <div className="flex flex-col justify-end pb-4">
                   <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer">
                      <input type="checkbox" checked={zoneData.isActive} onChange={e=>setZoneData({...zoneData, isActive: e.target.checked})} className="w-4 h-4 text-blue-600 border-gray-300 rounded" />
                      <span className="text-xs font-black uppercase tracking-tight">Active</span>
                   </label>
                </div>
             </div>
             <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <Button variant="secondary" onClick={() => setZoneModal({ open: false })}>Cancel</Button>
                <Button variant="black" onClick={saveZone}>Finalize Entry</Button>
             </div>
          </div>
       </Modal>
    </div>
  );
};
