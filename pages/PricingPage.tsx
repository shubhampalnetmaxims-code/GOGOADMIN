
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Save, MapPin, Zap, Plus, Trash2, Globe, CheckCircle2, Navigation, Clock, Timer, Layers, Map as MapIcon,
  Edit2, ChevronRight, DollarSign, Moon, HelpCircle, Calculator, Check, Shield, Lock, Trash, Coffee, AlertTriangle,
  Settings, Target, Crosshair
} from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Modal } from '../components/Modal';
import { VehicleType, PricingService, SurgeRule, Location, ZoneFee, OperationalZone, VehiclePricingConfig, DistanceTier } from '../types';

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
  cancelFee: 5.00,
  commission: 15,
  tax: 5,
  nightSurcharge: 2.50,
  nightSurchargeActive: true,
  nightSurchargeStart: "22:00",
  nightSurchargeEnd: "05:00",
  safeguardMultiplier: 3.5,
  surcharges: [],
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
    commission: 20,
    tax: 8.5,
    nightSurcharge: 3.50,
  }
};

const INITIAL_GLOBAL_SURGE: SurgeRule[] = [
  { 
    id: 'sr-1', 
    name: 'Weekend Peak', 
    multiplier: 1.8, 
    locationIds: ['loc-1', 'loc-2'], 
    vehicleTypes: [VehicleType.SEDAN, VehicleType.SUV], 
    zoneIds: [],
    startTime: '18:00', 
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

    // Initialize Leaflet Map
    if (!mapInstanceRef.current) {
      const L = (window as any).L;
      if (!L) return;

      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([lat, lng], 14);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
      const circle = L.circle([lat, lng], {
        radius: radius,
        color: '#2563eb',
        fillColor: '#2563eb',
        fillOpacity: 0.1,
        weight: 1
      }).addTo(map);

      marker.on('drag', (e: any) => {
        const { lat, lng } = e.target.getLatLng();
        circle.setLatLng([lat, lng]);
        onChange(lat, lng);
      });

      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        circle.setLatLng([lat, lng]);
        onChange(lat, lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
      circleRef.current = circle;

      // Force redraw after a short delay for modal animations
      setTimeout(() => map.invalidateSize(), 100);
    } else {
      markerRef.current.setLatLng([lat, lng]);
      circleRef.current.setLatLng([lat, lng]);
      circleRef.current.setRadius(radius);
    }
  }, [lat, lng, radius]);

  return (
    <div className="relative w-full h-64 rounded-[20px] overflow-hidden border border-gray-100 shadow-inner group">
      <div ref={mapContainerRef} className="w-full h-full" />
      <div className="absolute top-4 left-4 z-[100] px-3 py-1.5 bg-white/90 backdrop-blur shadow-sm border border-gray-100 rounded-full flex items-center gap-2">
        <Crosshair size={14} className="text-blue-600" />
        <span className="text-[10px] font-black uppercase text-gray-900 tracking-widest">Interactive Placement</span>
      </div>
      <div className="absolute bottom-4 left-4 z-[100] px-3 py-1.5 bg-gray-900/90 backdrop-blur shadow-sm border border-white/10 rounded-full">
        <span className="text-[9px] font-bold text-white tracking-widest leading-none">
          {lat.toFixed(4)}, {lng.toFixed(4)}
        </span>
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
  const [subTab, setSubTab] = useState<'rate' | 'surcharge'>('rate');
  const [configs, setConfigs] = useState<Record<string, VehiclePricingConfig>>(INITIAL_CONFIGS);
  const [globalSurgeRules, setGlobalSurgeRules] = useState<SurgeRule[]>(INITIAL_GLOBAL_SURGE);
  const [showGlobalInfo, setShowGlobalInfo] = useState(false);
  
  const [lockedStates, setLockedStates] = useState<Record<string, boolean>>({});

  const currentContextKey = useMemo(() => {
    if (activeMode === 'matrix') return `${selectedLocationId}:${selectedVehicle}`;
    if (activeMode === 'dynamic') return 'global:dynamic';
    return 'global:setup';
  }, [activeMode, selectedLocationId, selectedVehicle]);

  const isCurrentViewLocked = !!lockedStates[currentContextKey];

  const activeLocation = useMemo(() => 
    locations.find(l => l.id === selectedLocationId) || locations[0],
    [selectedLocationId, locations]
  );

  const activeConfig = useMemo(() => {
    const key = `${selectedLocationId}:${selectedVehicle}`;
    return configs[key] || { ...DEFAULT_PRICING };
  }, [selectedLocationId, selectedVehicle, configs]);

  const updateActiveConfig = (updates: Partial<VehiclePricingConfig>) => {
    if (isCurrentViewLocked) return;
    const key = `${selectedLocationId}:${selectedVehicle}`;
    setConfigs(prev => ({
      ...prev,
      [key]: { ...(prev[key] || { ...DEFAULT_PRICING }), ...updates }
    }));
  };

  const toggleLock = () => {
    setLockedStates(prev => ({
      ...prev,
      [currentContextKey]: !prev[currentContextKey]
    }));
  };

  const filteredZones = useMemo(() => 
    zones.filter(z => z.locationId === selectedLocationId),
    [zones, selectedLocationId]
  );

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col bg-gray-50/30">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6 bg-white p-8 rounded-[40px] border border-gray-200 shadow-sm relative overflow-hidden">
        {isCurrentViewLocked && (
          <div className="absolute top-0 left-0 w-full h-1 bg-gray-900 shadow-[0_4px_10px_rgba(0,0,0,0.1)]" />
        )}
        <div className="flex items-center space-x-6">
          <div className={`p-4 rounded-[24px] text-white shadow-2xl transition-colors duration-500 ${isCurrentViewLocked ? 'bg-gray-400' : 'bg-gray-900'}`}>
            <Globe size={28} />
          </div>
          <div>
            <div className="flex items-center space-x-3 mb-1">
               <h1 className="text-2xl font-black text-gray-900 tracking-tight">Fleet Pricing Hub</h1>
               <span className="bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                {service}
               </span>
               <button 
                 onClick={() => setShowGlobalInfo(true)}
                 className="p-1.5 bg-gray-100 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all group relative"
               >
                 <HelpCircle size={18} />
               </button>
               {isCurrentViewLocked && (
                 <span className="flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-gray-200 animate-in fade-in zoom-in-90">
                    <Lock size={12} /> <span>Secured</span>
                 </span>
               )}
            </div>
            {activeMode === 'dynamic' ? (
              <div className="text-xs font-black text-blue-600 uppercase tracking-widest">Global Demand Management</div>
            ) : (
              <div className="flex items-center space-x-2 text-xs font-black text-gray-400 uppercase tracking-widest">
                <span>City:</span>
                <span className="text-blue-600 font-black">{activeLocation.name}</span>
                <span className="text-gray-300 mx-2">|</span>
                <span>Currency:</span>
                <span className="text-gray-900 font-black">{activeLocation.currency}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
           <div className={`flex bg-gray-100 p-1.5 rounded-2xl transition-opacity`}>
              <button 
                onClick={() => setActiveMode('matrix')}
                className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeMode === 'matrix' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <DollarSign size={14} /> <span>Pricing</span>
              </button>
              <button 
                onClick={() => setActiveMode('dynamic')}
                className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeMode === 'dynamic' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <Zap size={14} /> <span>Dynamic</span>
              </button>
              <button 
                onClick={() => setActiveMode('setup')}
                className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeMode === 'setup' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <Layers size={14} /> <span>Setup</span>
              </button>
           </div>
           
           <button 
             onClick={toggleLock}
             className={`flex flex-col items-center justify-center h-14 min-w-[140px] px-6 rounded-2xl border-2 transition-all group ${
               isCurrentViewLocked 
               ? 'bg-white border-gray-900 text-gray-900' 
               : 'bg-gray-900 border-gray-900 text-white shadow-xl hover:scale-[1.02] active:scale-[0.98]'
             }`}
           >
             <div className="flex items-center space-x-3">
               {isCurrentViewLocked ? <Edit2 size={20} /> : <Save size={20} />}
               <div className="flex flex-col items-start leading-none">
                 <span className="text-[12px] font-black uppercase tracking-wider">{isCurrentViewLocked ? 'Edit' : 'Save'}</span>
                 <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{isCurrentViewLocked ? 'Config' : 'Changes'}</span>
               </div>
             </div>
           </button>
        </div>
      </div>

      <div className={`flex-1 space-y-8 overflow-y-auto pr-2 no-scrollbar pb-12 transition-all`}>
        {activeMode === 'setup' ? (
          <MarketSetup 
            locations={locations} 
            setLocations={setLocations} 
            zones={zones} 
            setZones={setZones} 
            selectedLocationId={selectedLocationId}
            setSelectedLocationId={setSelectedLocationId}
            disabled={isCurrentViewLocked}
          />
        ) : activeMode === 'dynamic' ? (
          <DynamicPricingHub 
            rules={globalSurgeRules} 
            setRules={setGlobalSurgeRules} 
            availableLocations={locations} 
            disabled={isCurrentViewLocked}
          />
        ) : (
          <div className="animate-in fade-in duration-500 space-y-8">
            <div className={`flex items-center space-x-3 overflow-x-auto pb-2 no-scrollbar`}>
               {Object.values(VehicleType).map((type) => (
                 <button
                   key={type}
                   onClick={() => setSelectedVehicle(type)}
                   className={`shrink-0 flex items-center space-x-3 px-10 py-5 rounded-[24px] border transition-all ${
                     selectedVehicle === type 
                       ? 'bg-gray-900 border-gray-900 text-white shadow-xl -translate-y-1' 
                       : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300'
                   }`}
                 >
                   <CheckCircle2 size={18} className={selectedVehicle === type ? 'text-blue-400' : 'text-gray-200'} />
                   <span className="text-sm font-black uppercase tracking-tight">{type.replace('_', ' ')}</span>
                 </button>
               ))}
            </div>

            <div className={`bg-white rounded-[48px] border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-[600px] transition-opacity ${isCurrentViewLocked ? 'opacity-90' : 'opacity-100'}`}>
               <div className="flex border-b border-gray-100 px-12 bg-gray-50/30">
                  <TabItem active={subTab === 'rate'} onClick={() => setSubTab('rate')} label="Base Rate Card" icon={<Navigation size={18} />} />
                  <TabItem active={subTab === 'surcharge'} onClick={() => setSubTab('surcharge')} label="Fixed Hub Fees" icon={<MapPin size={18} />} />
               </div>

               <div className="p-12 flex-1">
                  {subTab === 'rate' && (
                    <RateCardView 
                      config={activeConfig} 
                      onUpdate={updateActiveConfig} 
                      location={activeLocation} 
                      disabled={isCurrentViewLocked}
                    />
                  )}
                  {subTab === 'surcharge' && (
                    <SurchargeView 
                      config={activeConfig} 
                      onUpdate={updateActiveConfig} 
                      availableZones={filteredZones} 
                      location={activeLocation} 
                      disabled={isCurrentViewLocked}
                    />
                  )}
               </div>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={showGlobalInfo} onClose={() => setShowGlobalInfo(false)} title="Advanced Pricing Architecture">
        <div className="space-y-6">
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
            <h4 className="flex items-center text-blue-900 font-bold mb-2">
              <Calculator size={18} className="mr-2" /> Live Pricing Formula
            </h4>
            <div className="bg-white/80 p-4 rounded-xl font-mono text-xs leading-relaxed text-blue-800 border border-blue-200">
              <div className="font-bold border-b border-blue-100 pb-2 mb-2">Customer Fare =</div>
              <div className="pl-4">
                Max( <span className="text-blue-900 font-bold">Minimum Fare</span>, <br/>
                &nbsp;&nbsp;(<span className="text-blue-900">Base Fare</span> + <br/>
                &nbsp;&nbsp;<span className="text-blue-600 italic font-bold">Sum of Distance Tiered Slabs</span> + <br/>
                &nbsp;&nbsp;(<span className="text-blue-900">Time</span> × <span className="text-blue-900">Rate/Min</span>) + <br/>
                &nbsp;&nbsp;<span className="text-blue-600 italic font-bold">Active Time-Gated Hub Fees</span> + <br/>
                &nbsp;&nbsp;<span className="text-yellow-600 italic font-bold">Active Night Premium</span>) × <span className="text-blue-600 font-black">Dynamic Multiplier</span><br/>
                ) + <span className="text-blue-900 italic font-bold">Wait Fees</span> + <span className="text-blue-900">Tax</span>
              </div>
            </div>
          </div>
          
          <div className="pt-4">
            <Button variant="black" fullWidth onClick={() => setShowGlobalInfo(false)}>Acknowledge & Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const TabItem: React.FC<{ active: boolean; onClick: () => void; label: string; icon: React.ReactNode }> = ({ active, onClick, label, icon }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-3 px-12 py-7 text-xs font-black uppercase tracking-widest transition-all relative ${
      active ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
    }`}
  >
    {icon}
    <span>{label}</span>
    {active && <div className="absolute bottom-0 left-12 right-12 h-1.5 bg-blue-600 rounded-t-full shadow-[0_-4px_10px_rgba(37,99,235,0.3)]" />}
  </button>
);

const RateCardView: React.FC<{ config: VehiclePricingConfig; onUpdate: (u: Partial<VehiclePricingConfig>) => void; location: Location; disabled?: boolean }> = ({ config, onUpdate, location, disabled }) => {
  const [testDistance, setTestDistance] = useState(12);
  const [testWaitDuration, setTestWaitDuration] = useState(8);
  const tripTime = 15;

  // Tiered Pricing Calculation (Slab Based)
  const calculateTieredDistanceFare = (dist: number, tiers: DistanceTier[]) => {
    let remainingDist = dist;
    let totalFare = 0;
    let lastUpTo = 0;
    const sortedTiers = [...tiers].sort((a, b) => a.upToKm - b.upToKm);
    const breakdown: { slab: string, km: number, rate: number, total: number }[] = [];

    for (const tier of sortedTiers) {
      if (remainingDist <= 0) break;
      const slabMax = tier.upToKm - lastUpTo;
      const kmInThisSlab = Math.min(remainingDist, slabMax);
      const slabTotal = kmInThisSlab * tier.rate;
      
      totalFare += slabTotal;
      breakdown.push({ 
        slab: `${lastUpTo} - ${tier.upToKm === 999 ? '∞' : tier.upToKm} km`, 
        km: kmInThisSlab, 
        rate: tier.rate, 
        total: slabTotal 
      });
      
      remainingDist -= kmInThisSlab;
      lastUpTo = tier.upToKm;
    }

    return { totalFare, breakdown };
  };

  const { totalFare: distanceFare, breakdown: slabsBreakdown } = calculateTieredDistanceFare(testDistance, config.distanceTiers);
  const surchargeTotal = config.nightSurchargeActive ? config.nightSurcharge : 0;
  
  // Wait Charges Calculation
  const billableWaitMinutes = Math.max(0, testWaitDuration - config.safeWaitTime);
  const totalWaitCharge = billableWaitMinutes * config.waitRate;

  const calculatedTripFare = config.baseFare + distanceFare + (tripTime * config.ratePerMin) + surchargeTotal;
  const tripWithMinFare = Math.max(config.minFare, calculatedTripFare);
  const finalFare = tripWithMinFare + totalWaitCharge;

  const addTier = () => {
    const newTier: DistanceTier = { 
      id: Date.now().toString(), 
      upToKm: (config.distanceTiers[config.distanceTiers.length - 1]?.upToKm || 0) + 10, 
      rate: config.ratePerKm 
    };
    onUpdate({ distanceTiers: [...config.distanceTiers, newTier] });
  };

  const removeTier = (id: string) => {
    onUpdate({ distanceTiers: config.distanceTiers.filter(t => t.id !== id) });
  };

  const updateTier = (id: string, updates: Partial<DistanceTier>) => {
    onUpdate({
      distanceTiers: config.distanceTiers.map(t => t.id === id ? { ...t, ...updates } : t)
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 animate-in fade-in slide-in-from-bottom-4 duration-400">
       <div className="lg:col-span-8 space-y-12">
          {/* Core Settings */}
          <section>
             <div className="flex items-center space-x-4 mb-10">
                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600"><Timer size={24} /></div>
                <div>
                   <h3 className="text-xl font-black text-gray-900 tracking-tight">Core Trip Settings</h3>
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">Primary pricing parameters</p>
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                <Input 
                  label={`Base Flagfall (${location.currency})`} 
                  info="The initial cost charged at the start of every trip."
                  type="number" step="0.01" value={config.baseFare} 
                  disabled={disabled}
                  onChange={e => onUpdate({ baseFare: parseFloat(e.target.value) || 0 })} 
                />
                <Input 
                  label={`Minimum Fare (${location.currency})`} 
                  info="The floor price for any trip."
                  type="number" step="0.01" value={config.minFare} 
                  disabled={disabled}
                  onChange={e => onUpdate({ minFare: parseFloat(e.target.value) || 0 })} 
                />
                <Input 
                  label={`Rate per Minute (${location.currency})`} 
                  info="Charge applied for every minute elapsed during the trip."
                  type="number" step="0.01" value={config.ratePerMin} 
                  disabled={disabled}
                  onChange={e => onUpdate({ ratePerMin: parseFloat(e.target.value) || 0 })} 
                />
                <Input 
                  label={`Standard Rate/Km (Fallback)`} 
                  info="Used if no distance tiers match."
                  type="number" step="0.01" value={config.ratePerKm} 
                  disabled={disabled}
                  onChange={e => onUpdate({ ratePerKm: parseFloat(e.target.value) || 0 })} 
                />
             </div>
          </section>

          {/* Operational Settings (Wait Time & Cancel) */}
          <section className="pt-12 border-t border-gray-100">
             <div className="flex items-center space-x-4 mb-10">
                <div className="p-3 bg-amber-50 rounded-2xl text-amber-600"><Coffee size={24} /></div>
                <div>
                   <h3 className="text-xl font-black text-gray-900 tracking-tight">Wait & Cancellation Policy</h3>
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">Automated wait logic and drop fees</p>
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Input 
                  label={`Wait Rate / Min (${location.currency})`} 
                  info="Cost applied for every minute the driver waits at the pickup location."
                  type="number" step="0.01" value={config.waitRate} 
                  disabled={disabled}
                  onChange={e => onUpdate({ waitRate: parseFloat(e.target.value) || 0 })} 
                />
                <Input 
                  label="Free Wait Time (Min)" 
                  info="The number of minutes a driver must wait for free before charges begin."
                  type="number" value={config.safeWaitTime} 
                  disabled={disabled}
                  onChange={e => onUpdate({ safeWaitTime: parseInt(e.target.value) || 0 })} 
                />
                <Input 
                  label={`Cancel Fee (${location.currency})`} 
                  info="Flat fee charged to the user for cancelling a ride after a certain point."
                  type="number" step="0.01" value={config.cancelFee} 
                  disabled={disabled}
                  onChange={e => onUpdate({ cancelFee: parseFloat(e.target.value) || 0 })} 
                />
             </div>
          </section>

          {/* Distance Tiers */}
          <section className="pt-12 border-t border-gray-100">
             <div className="flex items-center justify-between mb-10">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600"><Layers size={24} /></div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Tiered Distance Tiers</h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">Non-linear distance billing</p>
                  </div>
                </div>
                {!disabled && (
                  <Button variant="ghost" size="sm" icon={<Plus size={16} />} onClick={addTier} className="text-indigo-600 hover:bg-indigo-50 font-black uppercase text-[10px] tracking-widest">Add Tier</Button>
                )}
             </div>

             <div className="space-y-4">
                {config.distanceTiers.sort((a,b) => a.upToKm - b.upToKm).map((tier, idx) => (
                  <div key={tier.id} className="flex items-center gap-6 p-6 bg-gray-50 rounded-[24px] border border-gray-100 group">
                    <div className="flex-1 grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Up to distance (km)</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            value={tier.upToKm} 
                            disabled={disabled}
                            onChange={(e) => updateTier(tier.id, { upToKm: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none" 
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 uppercase">KM</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Rate per KM</label>
                        <div className="relative">
                           <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">{location.currency}</span>
                           <input 
                            type="number" 
                            step="0.01"
                            value={tier.rate} 
                            disabled={disabled}
                            onChange={(e) => updateTier(tier.id, { rate: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none" 
                          />
                        </div>
                      </div>
                    </div>
                    {!disabled && config.distanceTiers.length > 1 && (
                      <button onClick={() => removeTier(tier.id)} className="p-2.5 text-gray-300 hover:text-red-500 transition-colors bg-white rounded-xl shadow-sm border border-gray-100 opacity-0 group-hover:opacity-100"><Trash size={16} /></button>
                    )}
                  </div>
                ))}
             </div>
          </section>

          {/* Fees */}
          <section className="pt-12 border-t border-gray-100">
             <div className="flex items-center space-x-4 mb-10">
                <div className="p-3 bg-orange-50 rounded-2xl text-orange-600"><Shield size={24} /></div>
                <div>
                   <h3 className="text-xl font-black text-gray-900 tracking-tight">System & Platform Fees</h3>
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                <Input label="Platform Commission (%)" type="number" step="0.1" value={config.commission} disabled={disabled} onChange={e => onUpdate({ commission: parseFloat(e.target.value) || 0 })} />
                <Input label="Regulatory Tax (%)" type="number" step="0.1" value={config.tax} disabled={disabled} onChange={e => onUpdate({ tax: parseFloat(e.target.value) || 0 })} />
             </div>
          </section>
       </div>

       {/* Enhanced Fare Breakdown Insight */}
       <div className="lg:col-span-4">
          <div className="sticky top-8 space-y-6">
            <div className={`bg-gray-900 text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden transition-all duration-500`}>
               <div className="relative z-10">
                  <div className="flex justify-between items-center mb-8">
                    <h4 className="text-[10px] font-black uppercase text-blue-400 tracking-widest flex items-center">
                       <Calculator size={14} className="mr-3" /> Fare Insight Engine
                    </h4>
                    <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black tracking-widest text-white/50">LIVE TEST</span>
                  </div>

                  {/* Simulator Controls */}
                  <div className="mb-8 p-5 bg-white/5 rounded-3xl border border-white/10 space-y-6">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest flex justify-between">
                        <span className="flex items-center gap-2"><Navigation size={10} /> Test Distance</span>
                        <span className="text-blue-400 font-bold">{testDistance} KM</span>
                       </label>
                       <input type="range" min="1" max="100" value={testDistance} onChange={e => setTestDistance(parseInt(e.target.value))} className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-400" />
                    </div>
                    
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest flex justify-between">
                        <span className="flex items-center gap-2"><Clock size={10} /> Wait Duration</span>
                        <span className="text-amber-400 font-bold">{testWaitDuration} Min</span>
                       </label>
                       <input type="range" min="0" max="30" value={testWaitDuration} onChange={e => setTestWaitDuration(parseInt(e.target.value))} className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-400" />
                    </div>
                  </div>

                  <div className="space-y-5">
                     <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm font-medium">
                           <span className="text-gray-400">Base Start Fee</span>
                           <span className="text-white">{location.currency} {config.baseFare.toFixed(2)}</span>
                        </div>
                        
                        {/* Distance Tiers Breakdown */}
                        <div className="space-y-2 pt-2 border-t border-white/5">
                           <span className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Distance Slabs ({testDistance}km)</span>
                           {slabsBreakdown.map((slab, i) => (
                             <div key={i} className="flex justify-between items-center text-[12px]">
                                <span className="text-gray-400 flex items-center">
                                  <div className="w-1 h-1 bg-indigo-400 rounded-full mr-2" />
                                  {slab.slab} ({slab.km}km × {slab.rate.toFixed(2)})
                                </span>
                                <span className="font-bold text-indigo-300">{location.currency} {slab.total.toFixed(2)}</span>
                             </div>
                           ))}
                        </div>

                        {/* Trip Time Fee */}
                        <div className="flex justify-between items-center text-[12px] pt-2 border-t border-white/5">
                           <span className="text-gray-400">Trip Time Fee (15m × {config.ratePerMin.toFixed(2)})</span>
                           <span className="text-white font-medium">{location.currency} {(15 * config.ratePerMin).toFixed(2)}</span>
                        </div>

                        {/* Wait Charges Breakdown */}
                        {totalWaitCharge > 0 && (
                          <div className="flex justify-between items-center text-[12px] pt-2 border-t border-white/5">
                             <span className="text-amber-400 flex items-center gap-2">
                                <Coffee size={12} /> Billable Wait ({billableWaitMinutes}m × {config.waitRate.toFixed(2)})
                             </span>
                             <span className="text-amber-300 font-bold">{location.currency} {totalWaitCharge.toFixed(2)}</span>
                          </div>
                        )}

                        {config.nightSurchargeActive && (
                        <div className="flex justify-between items-center text-[12px] pt-2 border-t border-white/5">
                           <span className="text-yellow-400 flex items-center font-bold">
                             <Moon size={12} className="mr-1.5" /> Night Shift Premium
                           </span>
                           <span className="font-bold text-white">{location.currency} {config.nightSurcharge.toFixed(2)}</span>
                        </div>
                        )}
                     </div>

                     <div className="h-px bg-white/10 my-4" />
                     
                     <div className="space-y-2">
                        <div className="flex justify-between items-center">
                           <div className="flex flex-col">
                             <span className="text-gray-400 text-sm">Final Estimated Fare</span>
                             <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest italic">Includes all overrides</span>
                           </div>
                           <div className="text-right">
                             <span className="block text-4xl font-black text-blue-400">{location.currency} {finalFare.toFixed(2)}</span>
                           </div>
                        </div>
                        {calculatedTripFare < config.minFare && (
                          <div className="p-2.5 bg-blue-400/10 border border-blue-400/20 rounded-xl">
                            <p className="text-[10px] text-blue-400 font-black uppercase text-center tracking-widest flex items-center justify-center gap-2">
                              <AlertTriangle size={12} /> Min Trip Fare Applied ({location.currency}{config.minFare.toFixed(2)})
                            </p>
                          </div>
                        )}
                     </div>

                     <div className="pt-6 border-t border-white/10 flex gap-4">
                        <div className="flex-1 text-center">
                           <span className="block text-[9px] font-black text-gray-500 uppercase tracking-widest">Platform Take</span>
                           <span className="text-xs font-bold text-white">{location.currency} {((finalFare * config.commission) / 100).toFixed(2)}</span>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div className="flex-1 text-center">
                           <span className="block text-[9px] font-black text-gray-500 uppercase tracking-widest">Service Tax</span>
                           <span className="text-xs font-bold text-white">{location.currency} {((finalFare * config.tax) / 100).toFixed(2)}</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
            
            <div className="p-6 bg-white border border-gray-200 rounded-[32px] shadow-sm">
               <h5 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4">Pricing Strategy Detail</h5>
               <ul className="space-y-3">
                  <li className="flex gap-3 items-start">
                     <div className="p-1.5 bg-green-50 text-green-600 rounded-lg"><Check size={12}/></div>
                     <p className="text-[11px] text-gray-600 font-medium">Wait charges kick in after <span className="font-bold text-gray-900">{config.safeWaitTime} minutes</span> of arrival.</p>
                  </li>
                  <li className="flex gap-3 items-start">
                     <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Check size={12}/></div>
                     <p className="text-[11px] text-gray-600 font-medium italic">Wait fees are added <span className="font-black">after</span> the minimum fare check.</p>
                  </li>
                  <li className="flex gap-3 items-start">
                     <div className="p-1.5 bg-red-50 text-red-600 rounded-lg"><AlertTriangle size={12}/></div>
                     <p className="text-[11px] text-gray-600 font-medium">Cancellation fee is currently set to <span className="font-black text-gray-900">{location.currency}{config.cancelFee.toFixed(2)}</span>.</p>
                  </li>
               </ul>
            </div>
          </div>
       </div>
    </div>
  );
};

const SurchargeView: React.FC<{ config: VehiclePricingConfig; onUpdate: (u: Partial<VehiclePricingConfig>) => void; availableZones: OperationalZone[]; location: Location; disabled?: boolean }> = ({ config, onUpdate, availableZones, location, disabled }) => {
  const [modalState, setModalState] = useState<{ open: boolean; editId?: string }>({ open: false });
  const [formData, setFormData] = useState<Partial<ZoneFee>>({ zoneId: '', amount: 0, isActive: true, startTime: '00:00', endTime: '23:59' });

  const handleOpen = (fee?: ZoneFee) => {
    if (disabled) return;
    if (fee) {
       setFormData(fee);
       setModalState({ open: true, editId: fee.id });
    } else {
       setFormData({ zoneId: '', amount: 0, isActive: true, startTime: '00:00', endTime: '23:59' });
       setModalState({ open: true });
    }
  };

  const handleSave = () => {
    if (!formData.zoneId || formData.amount === undefined) return;
    
    if (modalState.editId) {
       onUpdate({ 
         surcharges: config.surcharges.map(f => f.id === modalState.editId ? { ...f, ...formData } as ZoneFee : f) 
       });
    } else {
       const newFee: ZoneFee = { 
         id: Date.now().toString(), 
         zoneId: formData.zoneId, 
         amount: formData.amount, 
         isActive: formData.isActive ?? true,
         startTime: formData.startTime || '00:00',
         endTime: formData.endTime || '23:59'
       };
       onUpdate({ surcharges: [...config.surcharges, newFee] });
    }
    setModalState({ open: false });
  };

  const removeFee = (id: string) => {
    if (disabled) return;
    onUpdate({ surcharges: config.surcharges.filter(f => f.id !== id) });
  }
  
  const toggleFee = (id: string) => {
    if (disabled) return;
    onUpdate({
      surcharges: config.surcharges.map(f => f.id === id ? { ...f, isActive: !f.isActive } : f)
    });
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-400">
       <div className={`bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group transition-all duration-500 ${disabled ? 'bg-gray-50/50 grayscale-[0.5]' : ''}`}>
          <div className="absolute top-0 right-0 p-8">
            <div className={`flex items-center space-x-3 transition-all duration-300 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
              <span className={`text-[10px] font-black uppercase tracking-widest ${config.nightSurchargeActive ? 'text-blue-600' : 'text-gray-400'}`}>
                {config.nightSurchargeActive ? 'Operational' : 'Paused'}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={config.nightSurchargeActive} onChange={() => onUpdate({ nightSurchargeActive: !config.nightSurchargeActive })} />
                <div className="w-12 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-6"></div>
              </label>
            </div>
          </div>

          <div className="flex items-center space-x-4 mb-10">
             <div className={`p-3 rounded-2xl transition-all duration-500 ${config.nightSurchargeActive ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'}`}><Moon size={24} /></div>
             <div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Night Premium Policy</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">Automated late-shift billing</p>
             </div>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-3 gap-12 transition-all duration-500 ${(!config.nightSurchargeActive || disabled) ? 'opacity-30 grayscale pointer-events-none' : 'opacity-100'}`}>
             <Input 
                label={`Flat Premium (${location.currency})`} 
                info="The extra amount added to trips starting during the designated night window."
                type="number" step="0.01" value={config.nightSurcharge} 
                onChange={e => onUpdate({ nightSurcharge: parseFloat(e.target.value) || 0 })} 
             />
             <Input label="Window Start" info="The time (HH:MM) when night rates begin applying." type="time" value={config.nightSurchargeStart} onChange={e => onUpdate({ nightSurchargeStart: e.target.value })} />
             <Input label="Window End" info="The time (HH:MM) when night rates stop being charged." type="time" value={config.nightSurchargeEnd} onChange={e => onUpdate({ nightSurchargeEnd: e.target.value })} />
          </div>
       </div>

       <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight">Time-Gated Hub Fees</h3>
            <p className="text-sm text-gray-400 font-medium italic">Define fixed premiums for entering/exiting specific operational hubs.</p>
          </div>
          {!disabled && (
            <Button variant="black" icon={<Plus size={18} />} onClick={() => handleOpen()} className="rounded-2xl h-12 px-8 shadow-md">Define New Hub Fee</Button>
          )}
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {config.surcharges.map(fee => {
            const zone = availableZones.find(z => z.id === fee.zoneId);
            return (
              <div key={fee.id} className={`p-8 bg-white rounded-[40px] border border-gray-100 flex flex-col group hover:shadow-2xl transition-all border-b-8 ${fee.isActive ? 'border-b-blue-600/10' : 'border-b-gray-200 grayscale opacity-60'}`}>
                 <div className="flex items-center justify-between mb-8">
                    <div className="p-4 bg-gray-50 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all"><MapPin size={24} /></div>
                    <div className={`flex items-center space-x-2 transition-all translate-x-2 group-hover:translate-x-0 ${disabled ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
                       <button onClick={() => handleOpen(fee)} className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 rounded-xl transition-all shadow-sm"><Edit2 size={16} /></button>
                       <button onClick={() => removeFee(fee.id)} className="p-2 text-gray-300 hover:text-red-500 bg-gray-50 rounded-xl transition-all shadow-sm"><Trash2 size={16} /></button>
                    </div>
                 </div>
                 <div className="flex-1 mb-6">
                    <span className="block text-base font-black text-gray-900 mb-1">{zone?.name || 'Hub Area'}</span>
                    <div className="space-y-1.5">
                       <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center">
                         <DollarSign size={10} className="mr-0.5" />{fee.amount.toFixed(2)} Platform Surcharge
                       </span>
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center">
                         <Clock size={10} className="mr-1.5 text-blue-400" /> Effective: {fee.startTime} - {fee.endTime}
                       </span>
                    </div>
                 </div>
                 <div className="flex justify-between items-center pt-6 border-t border-gray-100">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${fee.isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                      {fee.isActive ? 'Live' : 'Off-Duty'}
                    </span>
                    {!disabled && (
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={fee.isActive} onChange={() => toggleFee(fee.id)} />
                        <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5"></div>
                      </label>
                    )}
                 </div>
              </div>
            );
          })}
       </div>

       <Modal isOpen={modalState.open} onClose={() => setModalState({ open: false })} title={modalState.editId ? "Modify Hub Rule" : "Initialize Hub Premium"}>
          <div className="space-y-6">
             <Select label="Operational Zone" options={availableZones.map(z => ({ value: z.id, label: z.name }))} value={formData.zoneId} onChange={e => setFormData({...formData, zoneId: e.target.value})} />
             <Input label={`Flat Surcharge (${location.currency})`} type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})} />
             <div className="grid grid-cols-2 gap-4">
               <Input label="Activation Time" type="time" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
               <Input label="Expiry Time" type="time" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} />
             </div>
             <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <span className="text-sm font-bold text-gray-900">Active Monitoring</span>
                <label className="relative inline-flex items-center cursor-pointer">
                   <input type="checkbox" className="sr-only peer" checked={formData.isActive} onChange={() => setFormData({...formData, isActive: !formData.isActive})} />
                   <div className="w-12 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-6"></div>
                </label>
             </div>
             <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <Button variant="secondary" onClick={() => setModalState({ open: false })}>Discard</Button>
                <Button variant="black" onClick={handleSave}>Confirm Hub Policy</Button>
             </div>
          </div>
       </Modal>
    </div>
  );
};

const DynamicPricingHub: React.FC<{ rules: SurgeRule[]; setRules: React.Dispatch<React.SetStateAction<SurgeRule[]>>; availableLocations: Location[]; disabled?: boolean; }> = ({ rules, setRules, availableLocations, disabled }) => {
  const [modalState, setModalState] = useState<{ open: boolean; editId?: string }>({ open: false });
  const [formData, setFormData] = useState<Partial<SurgeRule>>({ name: '', multiplier: 1.5, locationIds: [], vehicleTypes: [], startTime: '09:00', endTime: '18:00', isActive: true });

  const handleOpen = (rule?: SurgeRule) => {
    if (disabled) return;
    if (rule) {
       setFormData(rule);
       setModalState({ open: true, editId: rule.id });
    } else {
       setFormData({ name: '', multiplier: 1.5, locationIds: [], vehicleTypes: [], startTime: '09:00', endTime: '18:00', isActive: true });
       setModalState({ open: true });
    }
  };

  const handleSave = () => {
    if (!formData.name || formData.locationIds?.length === 0 || formData.vehicleTypes?.length === 0) return;
    if (modalState.editId) {
       setRules(rules.map(r => r.id === modalState.editId ? { ...r, ...formData } as SurgeRule : r));
    } else {
       const newRule: SurgeRule = { 
         id: Date.now().toString(), 
         name: formData.name!, 
         multiplier: formData.multiplier || 1, 
         locationIds: formData.locationIds || [], 
         vehicleTypes: formData.vehicleTypes || [], 
         zoneIds: [],
         startTime: formData.startTime || '09:00', 
         endTime: formData.endTime || '18:00', 
         isActive: true 
       };
       setRules([...rules, newRule]);
    }
    setModalState({ open: false });
  };

  const toggleRule = (id: string) => {
    if (disabled) return;
    setRules(rules.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
  }
  
  const removeRule = (id: string) => {
    if (disabled) return;
    setRules(rules.filter(r => r.id !== id));
  }

  const MultiSelect = ({ label, options, selected, onToggle }: { label: string; options: {id: string; name: string}[]; selected: string[]; onToggle: (id: string) => void }) => (
    <div className="space-y-3">
       <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{label}</label>
       <div className="flex flex-wrap gap-2">
          {options.map(opt => (
            <button
              key={opt.id}
              onClick={() => onToggle(opt.id)}
              disabled={disabled}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${selected.includes(opt.id) ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {selected.includes(opt.id) && <Check size={14} />}
              {opt.name}
            </button>
          ))}
       </div>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-400 pb-20">
       <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Global Demand Triggers</h3>
            <p className="text-sm text-gray-400 font-medium italic">Apply multipliers based on real-time traffic and peak event data.</p>
          </div>
          {!disabled && (
            <Button variant="black" icon={<Plus size={18} />} onClick={() => handleOpen()} className="rounded-2xl h-12 px-8 shadow-lg">Launch New Surge</Button>
          )}
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {rules.map(rule => (
            <div key={rule.id} className={`p-10 bg-white rounded-[48px] border border-gray-200 shadow-sm hover:shadow-2xl transition-all border-b-[12px] relative group ${rule.isActive ? 'border-b-yellow-400' : 'border-b-gray-200 grayscale opacity-60'}`}>
               <div className="flex justify-between items-start mb-8">
                  <div className="p-4 bg-yellow-50 text-yellow-600 rounded-[20px] shadow-sm"><Zap size={32} /></div>
                  <div className={`flex gap-2 transition-all translate-x-2 group-hover:translate-x-0 ${disabled ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
                     <button onClick={() => handleOpen(rule)} className="p-3 text-gray-400 hover:text-blue-600 bg-gray-50 rounded-xl transition-all shadow-sm"><Edit2 size={18} /></button>
                     <button onClick={() => removeRule(rule.id)} className="p-3 text-gray-300 hover:text-red-500 bg-gray-50 rounded-xl transition-all shadow-sm"><Trash2 size={18} /></button>
                  </div>
               </div>
               <h4 className="text-2xl font-black text-gray-900 mb-2">{rule.name}</h4>
               <div className="flex items-baseline gap-3 mb-8">
                  <span className="text-6xl font-black text-gray-900 tracking-tighter">{rule.multiplier}</span>
                  <span className="text-3xl font-black text-yellow-500">x</span>
               </div>
               
               <div className="flex flex-wrap gap-2 mb-8">
                  {rule.locationIds.map(locId => {
                    const loc = availableLocations.find(l => l.id === locId);
                    return <span key={locId} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">{loc?.name}</span>;
                  })}
                  {rule.vehicleTypes.map(vType => (
                    <span key={vType} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-black uppercase tracking-widest">{vType.replace('_', ' ')}</span>
                  ))}
               </div>

               <div className="flex items-center justify-between border-t border-gray-100 pt-8">
                  <div className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                     <Clock size={16} className="mr-3 text-blue-500" /> {rule.startTime} - {rule.endTime}
                  </div>
                  {!disabled && (
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={rule.isActive} onChange={() => toggleRule(rule.id)} />
                      <div className="w-14 h-7 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:after:translate-x-7"></div>
                    </label>
                  )}
               </div>
            </div>
          ))}
       </div>

       <Modal isOpen={modalState.open} onClose={() => setModalState({ open: false })} title={modalState.editId ? "Edit Global Surge" : "New Dynamic Trigger"}>
          <div className="space-y-8 max-h-[70vh] overflow-y-auto pr-2 no-scrollbar">
             <Input label="Event Name" placeholder="e.g. Festival Rush" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
             <Input label="Multiplier Factor" type="number" step="0.1" value={formData.multiplier} onChange={e => setFormData({...formData, multiplier: parseFloat(e.target.value)})} />
             
             <MultiSelect 
               label="Affected Locations" 
               options={availableLocations.map(l => ({ id: l.id, name: l.name }))} 
               selected={formData.locationIds || []}
               onToggle={id => {
                 const current = formData.locationIds || [];
                 setFormData({...formData, locationIds: current.includes(id) ? current.filter(x => x !== id) : [...current, id]});
               }}
             />

             <MultiSelect 
               label="Affected Vehicle Types" 
               options={Object.values(VehicleType).map(v => ({ id: v, name: v.replace('_', ' ') }))} 
               selected={formData.vehicleTypes || []}
               onToggle={id => {
                 const current = formData.vehicleTypes || [];
                 const vId = id as VehicleType;
                 setFormData({...formData, vehicleTypes: current.includes(vId) ? current.filter(x => x !== vId) : [...current, vId]});
               }}
             />

             <div className="grid grid-cols-2 gap-4">
                <Input label="Starts At" type="time" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
                <Input label="Ends At" type="time" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} />
             </div>

             <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <Button variant="secondary" onClick={() => setModalState({ open: false })}>Discard</Button>
                <Button variant="black" onClick={handleSave}>{modalState.editId ? 'Commit Logic' : 'Activate Surge'}</Button>
             </div>
          </div>
       </Modal>
    </div>
  );
};

const MarketSetup: React.FC<{ locations: Location[]; setLocations: React.Dispatch<React.SetStateAction<Location[]>>; zones: OperationalZone[]; setZones: React.Dispatch<React.SetStateAction<OperationalZone[]>>; selectedLocationId: string; setSelectedLocationId: (id: string) => void; disabled?: boolean; }> = ({ locations, setLocations, zones, setZones, selectedLocationId, setSelectedLocationId, disabled }) => {
  const [locModal, setLocModal] = useState<{ open: boolean; editId?: string }>({ open: false });
  const [zoneModal, setZoneModal] = useState<{ open: boolean; editId?: string }>({ open: false });
  const [locData, setLocData] = useState<Partial<Location>>({ name: '', country: '', currency: 'USD' });
  const [zoneData, setZoneData] = useState<Partial<OperationalZone>>({ name: '', radius: 1000, lat: 40.7128, lng: -74.0060, isActive: true });

  const activeZones = zones.filter(z => z.locationId === selectedLocationId);
  const activeLocation = locations.find(l => l.id === selectedLocationId) || locations[0];

  const handleOpenLoc = (loc?: Location) => {
    if (disabled) return;
    if (loc) {
       setLocData(loc);
       setLocModal({ open: true, editId: loc.id });
    } else {
       setLocData({ name: '', country: '', currency: 'USD' });
       setLocModal({ open: true });
    }
  };

  const handleOpenZone = (zone?: OperationalZone) => {
    if (disabled) return;
    if (zone) {
       setZoneData(zone);
       setZoneModal({ open: true, editId: zone.id });
    } else {
       setZoneData({ name: '', radius: 1000, lat: 40.7128, lng: -74.0060, isActive: true });
       setZoneModal({ open: true });
    }
  };

  const saveLoc = () => {
    if (!locData.name) return;
    if (locModal.editId) {
       setLocations(locations.map(l => l.id === locModal.editId ? { ...l, ...locData } as Location : l));
    } else {
       setLocations([...locations, { id: Date.now().toString(), name: locData.name!, country: locData.country || '', currency: locData.currency!, isActive: true }]);
    }
    setLocModal({ open: false });
  };

  const saveZone = () => {
    if (!zoneData.name) return;
    if (zoneModal.editId) {
       setZones(zones.map(z => z.id === zoneModal.editId ? { ...z, ...zoneData } as OperationalZone : z));
    } else {
       setZones([...zones, { 
         id: Date.now().toString(), 
         name: zoneData.name!, 
         locationId: selectedLocationId, 
         lat: zoneData.lat || 40, 
         lng: zoneData.lng || -74, 
         radius: zoneData.radius || 1000,
         isActive: zoneData.isActive ?? true 
       }]);
    }
    setZoneModal({ open: false });
  };

  const toggleZoneStatus = (id: string) => {
    if (disabled) return;
    setZones(zones.map(z => z.id === id ? { ...z, isActive: !z.isActive } : z));
  };

  const removeLocation = (id: string) => {
    if (disabled || locations.length <= 1) return;
    setLocations(locations.filter(l => l.id !== id));
    if (selectedLocationId === id) setSelectedLocationId(locations[0].id);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in fade-in slide-in-from-right-8 duration-500 pb-20">
       <div className="lg:col-span-4 space-y-8">
          <div className="bg-white p-8 rounded-[40px] border border-gray-200 shadow-sm transition-opacity">
             <div className="flex justify-between items-center mb-10">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400">Active Markets</h3>
                {!disabled && (
                  <Button size="sm" variant="ghost" className="text-blue-600 font-black hover:bg-blue-50 rounded-xl" onClick={() => handleOpenLoc()}><Plus size={20} /></Button>
                )}
             </div>
             <div className="space-y-3">
                {locations.map(loc => (
                   <div key={loc.id} className="relative group">
                     <button onClick={() => setSelectedLocationId(loc.id)} className={`w-full flex items-center justify-between p-5 rounded-2xl transition-all border ${selectedLocationId === loc.id ? 'bg-blue-50 border-blue-200 text-blue-900 shadow-sm' : 'bg-gray-50 border-transparent text-gray-500 hover:border-gray-200'}`}>
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
                        <div className="absolute top-1/2 -right-12 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all group-hover:right-4">
                           <button onClick={() => handleOpenLoc(loc)} className="p-2 bg-white border border-gray-100 rounded-lg text-blue-600 shadow-sm hover:scale-110 transition-all"><Edit2 size={12} /></button>
                           {locations.length > 1 && (
                              <button onClick={() => removeLocation(loc.id)} className="p-2 bg-white border border-gray-100 rounded-lg text-red-500 shadow-sm hover:scale-110 transition-all"><Trash size={12} /></button>
                           )}
                        </div>
                     )}
                   </div>
                ))}
             </div>
          </div>
       </div>

       <div className="lg:col-span-8 space-y-8">
          <div className={`bg-white p-10 rounded-[48px] border border-gray-200 shadow-sm min-h-[500px] transition-opacity ${disabled ? 'opacity-80' : ''}`}>
             <div className="flex justify-between items-center mb-10">
                <div>
                   <h3 className="text-2xl font-black text-gray-900 tracking-tight">Geo-Spatial Registry</h3>
                   <p className="text-sm text-gray-500 font-medium italic">High-priority operational geofences for {activeLocation.name}.</p>
                </div>
                {!disabled && (
                  <Button variant="black" icon={<Plus size={18} />} onClick={() => handleOpenZone()} className="rounded-2xl h-12 px-8 shadow-lg">New Hub Geofence</Button>
                )}
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {activeZones.map(zone => (
                   <div key={zone.id} className={`p-8 bg-white rounded-[40px] border border-gray-100 group relative hover:shadow-xl transition-all border-b-4 border-b-transparent hover:border-b-blue-600 ${!zone.isActive ? 'grayscale opacity-60' : ''}`}>
                      <div className="flex justify-between items-start mb-6">
                         <div className="flex items-center space-x-4">
                            <div className={`p-3 rounded-2xl shadow-sm transition-transform ${zone.isActive ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}><MapPin size={24} /></div>
                            <h4 className="font-black text-gray-900 tracking-tight">{zone.name}</h4>
                         </div>
                         <button onClick={() => handleOpenZone(zone)} className="p-2.5 text-gray-400 hover:text-blue-600 bg-gray-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"><Edit2 size={16} /></button>
                      </div>
                      
                      <div className="space-y-1 mb-8">
                         <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Coordinates</span>
                         <span className="text-xs font-bold text-gray-900">{zone.lat.toFixed(4)}, {zone.lng.toFixed(4)}</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-black text-gray-400 uppercase tracking-widest mt-auto pt-6 border-t border-gray-100">
                         <span className="flex items-center"><Layers size={14} className="mr-2 text-blue-500" />{zone.radius}m Detection Radius</span>
                         <div className="flex items-center space-x-3">
                            <span className={`flex items-center font-black ${zone.isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                               {zone.isActive ? 'Active' : 'Inactive'}
                            </span>
                            {!disabled && (
                              <label className="relative inline-flex items-center cursor-pointer">
                                 <input type="checkbox" className="sr-only peer" checked={zone.isActive} onChange={() => toggleZoneStatus(zone.id)} />
                                 <div className="w-8 h-4 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:after:translate-x-4"></div>
                              </label>
                            )}
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          </div>
       </div>

       <Modal isOpen={locModal.open} onClose={() => setLocModal({ open: false })} title={locModal.editId ? "Update Market" : "Register Market"}>
          <div className="space-y-6">
             <Input label="Market Name" placeholder="e.g. New York City" value={locData.name} onChange={e => setLocData({...locData, name: e.target.value})} />
             <Input label="Country Code" placeholder="e.g. USA" value={locData.country} onChange={e => setLocData({...locData, country: e.target.value})} />
             <Input label="Local Currency" placeholder="e.g. USD" value={locData.currency} onChange={e => setLocData({...locData, currency: e.target.value})} />
             <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button variant="secondary" onClick={() => setLocModal({ open: false })}>Discard</Button>
                <Button variant="black" onClick={saveLoc}>Commit Market</Button>
             </div>
          </div>
       </Modal>

       <Modal isOpen={zoneModal.open} onClose={() => setZoneModal({ open: false })} title="Geofence Specs">
          <div className="space-y-6">
             <Input label="Area Identifier" placeholder="e.g. Terminal 4 Hub" value={zoneData.name} onChange={e => setZoneData({...zoneData, name: e.target.value})} />
             
             <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Map Selection</label>
                <MapPicker 
                  lat={zoneData.lat || 40.7128} 
                  lng={zoneData.lng || -74.0060} 
                  radius={zoneData.radius || 1000} 
                  onChange={(lat, lng) => setZoneData({ ...zoneData, lat, lng })}
                />
             </div>

             <Input label="Radius (Meters)" type="number" value={zoneData.radius} onChange={e => setZoneData({...zoneData, radius: parseInt(e.target.value)})} />
             
             <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <span className="text-sm font-bold text-gray-900">Live Monitoring</span>
                <label className="relative inline-flex items-center cursor-pointer">
                   <input type="checkbox" className="sr-only peer" checked={zoneData.isActive} onChange={() => setZoneData({...zoneData, isActive: !zoneData.isActive})} />
                   <div className="w-12 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-6"></div>
                </label>
             </div>
             
             <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button variant="secondary" onClick={() => setZoneModal({ open: false })}>Discard</Button>
                <Button variant="black" onClick={saveZone}>Finalize Geofence</Button>
             </div>
          </div>
       </Modal>
    </div>
  );
};
