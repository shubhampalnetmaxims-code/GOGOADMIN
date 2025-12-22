import React, { useState, useMemo } from 'react';
import { Plus, Search, MoreHorizontal, ChevronLeft, ChevronRight, Edit2, Trash2, Car, AlertCircle } from 'lucide-react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Make, Model, VehicleType } from '../types';

// Rich Mock Data
const INITIAL_MAKES: Make[] = [
  { id: '1', name: 'Toyota', modelsCount: 3, createdOn: '12/17/2025' },
  { id: '2', name: 'Ford', modelsCount: 2, createdOn: '12/17/2025' },
  { id: '3', name: 'Honda', modelsCount: 5, createdOn: '12/18/2025' },
  { id: '4', name: 'BMW', modelsCount: 2, createdOn: '12/20/2025' },
  { id: '5', name: 'Tesla', modelsCount: 4, createdOn: '01/05/2026' },
  { id: '6', name: 'Mercedes-Benz', modelsCount: 1, createdOn: '01/12/2026' },
];

const INITIAL_MODELS: Model[] = [
  { id: '1', name: 'Camry', makeId: '1', makeName: 'Toyota', vehicleCount: 45, vehicleType: VehicleType.SEDAN, maxPassengers: 5 },
  { id: '2', name: 'F-150', makeId: '2', makeName: 'Ford', vehicleCount: 12, vehicleType: VehicleType.SUV, maxPassengers: 5 },
  { id: '3', name: 'Civic', makeId: '3', makeName: 'Honda', vehicleCount: 89, vehicleType: VehicleType.SEDAN, maxPassengers: 5 },
  { id: '4', name: 'X5', makeId: '4', makeName: 'BMW', vehicleCount: 23, vehicleType: VehicleType.SUV, maxPassengers: 5 },
  { id: '5', name: 'Model 3', makeId: '5', makeName: 'Tesla', vehicleCount: 156, vehicleType: VehicleType.PREMIUM_SEDAN, maxPassengers: 5 },
  { id: '6', name: 'Hilux', makeId: '1', makeName: 'Toyota', vehicleCount: 34, vehicleType: VehicleType.SUV, maxPassengers: 5 },
];

export const MakeModelPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'make' | 'model'>('model');
  const [makes, setMakes] = useState<Make[]>(INITIAL_MAKES);
  const [models, setModels] = useState<Model[]>(INITIAL_MODELS);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal States
  const [makeModal, setMakeModal] = useState<{ open: boolean; editId?: string }>({ open: false });
  const [modelModal, setModelModal] = useState<{ open: boolean; editId?: string }>({ open: false });

  // Form States
  const [newMakeName, setNewMakeName] = useState('');
  const [modelFormData, setModelFormData] = useState<Partial<Model>>({
    makeId: '',
    name: '',
    vehicleType: '' as VehicleType,
    maxPassengers: 0,
  });

  // Filtered Data
  const filteredMakes = useMemo(() => {
    return makes.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [makes, searchQuery]);

  const filteredModels = useMemo(() => {
    return models.filter(m => 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      m.makeName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [models, searchQuery]);

  // Handlers for Makes
  const handleOpenMake = (make?: Make) => {
    if (make) {
       setNewMakeName(make.name);
       setMakeModal({ open: true, editId: make.id });
    } else {
       setNewMakeName('');
       setMakeModal({ open: true });
    }
  };

  const handleSaveMake = () => {
    if (!newMakeName.trim()) return;
    if (makeModal.editId) {
       setMakes(makes.map(m => m.id === makeModal.editId ? { ...m, name: newMakeName } : m));
       // Also update models linked to this make
       setModels(models.map(mod => mod.makeId === makeModal.editId ? { ...mod, makeName: newMakeName } : mod));
    } else {
       const newMake: Make = {
         id: Date.now().toString(),
         name: newMakeName,
         modelsCount: 0,
         createdOn: new Date().toLocaleDateString('en-US'),
       };
       setMakes([...makes, newMake]);
    }
    setMakeModal({ open: false });
  };

  const handleDeleteMake = (id: string) => {
    if (confirm('Deleting this manufacture will also affect associated models. Continue?')) {
       setMakes(makes.filter(m => m.id !== id));
       setModels(models.filter(mod => mod.makeId !== id));
    }
  };

  // Handlers for Models
  const handleOpenModel = (model?: Model) => {
    if (model) {
       setModelFormData(model);
       setModelModal({ open: true, editId: model.id });
    } else {
       setModelFormData({ makeId: '', name: '', vehicleType: '' as VehicleType, maxPassengers: 0 });
       setModelModal({ open: true });
    }
  };

  const handleSaveModel = () => {
    if (!modelFormData.makeId || !modelFormData.name || !modelFormData.vehicleType) return;
    
    const selectedMake = makes.find(m => m.id === modelFormData.makeId);
    if (!selectedMake) return;

    if (modelModal.editId) {
       setModels(models.map(m => m.id === modelModal.editId ? { ...m, ...modelFormData, makeName: selectedMake.name } as Model : m));
    } else {
       const newModel: Model = {
         id: Date.now().toString(),
         name: modelFormData.name!,
         makeId: modelFormData.makeId!,
         makeName: selectedMake.name,
         vehicleCount: 0,
         vehicleType: modelFormData.vehicleType as VehicleType,
         maxPassengers: modelFormData.maxPassengers || 0,
       };
       setModels([...models, newModel]);
       setMakes(makes.map(m => m.id === modelFormData.makeId ? { ...m, modelsCount: m.modelsCount + 1 } : m));
    }
    setModelModal({ open: false });
  };

  const handleDeleteModel = (id: string) => {
    const model = models.find(m => m.id === id);
    if (model) {
       setMakes(makes.map(m => m.id === model.makeId ? { ...m, modelsCount: Math.max(0, m.modelsCount - 1) } : m));
       setModels(models.filter(m => m.id !== id));
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <div>
           <h1 className="text-3xl font-black text-gray-900 tracking-tight">
             {activeTab === 'make' ? 'Manufactures' : 'Fleet Models'}
           </h1>
           <p className="text-sm text-gray-500 font-medium">Manage the core structural data for your global vehicle inventory.</p>
        </div>
        <Button 
          variant="black"
          icon={<Plus size={18} />} 
          onClick={() => activeTab === 'make' ? handleOpenMake() : handleOpenModel()}
          className="rounded-2xl h-12 px-8 shadow-lg shadow-gray-200"
        >
          {activeTab === 'make' ? 'New Manufacture' : 'New Model'}
        </Button>
      </div>

      {/* Modern Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-[24px] mb-8 w-fit border border-gray-200 shadow-inner">
          <button
            onClick={() => { setActiveTab('make'); setSearchQuery(''); }}
            className={`px-10 py-3 text-xs font-black uppercase tracking-widest rounded-[20px] transition-all duration-300 ${
              activeTab === 'make' ? 'bg-white text-gray-900 shadow-md ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Manufactures
          </button>
          <button
            onClick={() => { setActiveTab('model'); setSearchQuery(''); }}
            className={`px-10 py-3 text-xs font-black uppercase tracking-widest rounded-[20px] transition-all duration-300 ${
              activeTab === 'model' ? 'bg-white text-gray-900 shadow-md ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Fleet Models
          </button>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-[40px] shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
        {/* Search Bar Area */}
        <div className="p-6 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
          <div className="relative max-w-md w-full group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder={`Quick search ${activeTab === 'make' ? 'manufactures' : 'models'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-[20px] leading-5 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 sm:text-sm transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center space-x-2 px-6 py-2 bg-white rounded-2xl border border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400">
             <Car size={14} className="mr-2" />
             Total: {activeTab === 'make' ? makes.length : models.length} Entries
          </div>
        </div>

        {/* Dynamic Table */}
        <div className="overflow-auto flex-1 no-scrollbar">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50 sticky top-0 backdrop-blur-sm z-10">
              {activeTab === 'make' ? (
                <tr>
                  <th scope="col" className="px-10 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Brand Name</th>
                  <th scope="col" className="px-10 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Linked Models</th>
                  <th scope="col" className="px-10 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Registration Date</th>
                  <th scope="col" className="px-10 py-5 text-right text-[11px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
              ) : (
                <tr>
                  <th scope="col" className="px-10 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Model Name</th>
                  <th scope="col" className="px-10 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Manufacture</th>
                  <th scope="col" className="px-10 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Active Units</th>
                  <th scope="col" className="px-10 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Classification</th>
                  <th scope="col" className="px-10 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Cap.</th>
                  <th scope="col" className="px-10 py-5 text-right text-[11px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
              )}
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {activeTab === 'make' ? (
                filteredMakes.map((make) => (
                  <tr key={make.id} className="hover:bg-gray-50 transition-all group">
                    <td className="px-10 py-6 whitespace-nowrap text-sm font-black text-gray-900">{make.name}</td>
                    <td className="px-10 py-6 whitespace-nowrap text-sm font-bold text-gray-500">
                       <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs">{make.modelsCount} Variations</span>
                    </td>
                    <td className="px-10 py-6 whitespace-nowrap text-sm text-gray-400 font-medium tracking-tight">{make.createdOn}</td>
                    <td className="px-10 py-6 whitespace-nowrap text-right">
                       <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleOpenMake(make)} className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-white rounded-xl shadow-sm transition-all"><Edit2 size={16} /></button>
                          <button onClick={() => handleDeleteMake(make.id)} className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-white rounded-xl shadow-sm transition-all"><Trash2 size={16} /></button>
                       </div>
                    </td>
                  </tr>
                ))
              ) : (
                filteredModels.map((model) => (
                  <tr key={model.id} className="hover:bg-gray-50 transition-all group">
                    <td className="px-10 py-6 whitespace-nowrap text-sm font-black text-gray-900">{model.name}</td>
                    <td className="px-10 py-6 whitespace-nowrap text-sm font-bold text-gray-500">{model.makeName}</td>
                    <td className="px-10 py-6 whitespace-nowrap text-sm font-black text-gray-900">
                       <div className="flex items-center">
                          <span className="h-1.5 w-1.5 bg-green-500 rounded-full mr-2"></span>
                          {model.vehicleCount} Units
                       </div>
                    </td>
                    <td className="px-10 py-6 whitespace-nowrap">
                       <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-gray-100 text-gray-500 rounded-lg">{model.vehicleType.replace('_', ' ')}</span>
                    </td>
                    <td className="px-10 py-6 whitespace-nowrap text-sm font-bold text-gray-900">
                       <div className="flex items-center">
                          <AlertCircle size={12} className="mr-1 text-gray-300" /> {model.maxPassengers}
                       </div>
                    </td>
                    <td className="px-10 py-6 whitespace-nowrap text-right">
                       <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleOpenModel(model)} className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-white rounded-xl shadow-sm transition-all"><Edit2 size={16} /></button>
                          <button onClick={() => handleDeleteModel(model.id)} className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-white rounded-xl shadow-sm transition-all"><Trash2 size={16} /></button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
              {((activeTab === 'make' && filteredMakes.length === 0) || (activeTab === 'model' && filteredModels.length === 0)) && (
                <tr>
                  <td colSpan={6} className="px-10 py-24 text-center">
                    <div className="flex flex-col items-center justify-center opacity-30 grayscale">
                       <Search size={48} className="mb-4" />
                       <p className="text-sm font-black uppercase tracking-widest">Zero matches found in database</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Enhanced Pagination */}
        <div className="px-10 py-6 flex items-center justify-between border-t border-gray-100 bg-gray-50/20">
          <div className="flex items-center">
            <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest mr-4">Rows per frame</span>
            <select className="border border-gray-200 rounded-xl text-xs font-bold px-4 py-2 bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none cursor-pointer">
              <option>10</option>
              <option>25</option>
              <option>50</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <button className="flex items-center px-4 py-2 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 disabled:opacity-30 transition-colors">
              <ChevronLeft size={16} className="mr-2" /> Previous
            </button>
            <div className="h-8 w-8 flex items-center justify-center bg-gray-900 text-white rounded-xl text-xs font-black shadow-lg shadow-gray-200">
              1
            </div>
            <button className="flex items-center px-4 py-2 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">
              Next <ChevronRight size={16} className="ml-2" />
            </button>
          </div>
        </div>
      </div>

      {/* CRUD Modals */}
      <Modal
        isOpen={makeModal.open}
        onClose={() => setMakeModal({ open: false })}
        title={makeModal.editId ? "Update Manufacturer" : "New Manufacture Registration"}
      >
        <div className="space-y-6">
           <Input 
             label="Brand Identity" 
             placeholder="e.g. Porsche" 
             value={newMakeName}
             onChange={(e) => setNewMakeName(e.target.value)}
           />
           <p className="text-[10px] text-gray-400 leading-relaxed font-medium">Registering a new brand allows for model assignment and structural fleet grouping. Please ensure naming accuracy.</p>
           <div className="flex justify-end gap-3 pt-6 border-t border-gray-50">
              <Button variant="secondary" onClick={() => setMakeModal({ open: false })}>Discard</Button>
              <Button variant="black" onClick={handleSaveMake}>{makeModal.editId ? 'Apply Update' : 'Initialize Brand'}</Button>
           </div>
        </div>
      </Modal>

      <Modal
        isOpen={modelModal.open}
        onClose={() => setModelModal({ open: false })}
        title={modelModal.editId ? "Modify Model Specs" : "Register Fleet Variant"}
      >
        <div className="space-y-6">
           <Select 
             label="Parent Manufacture"
             placeholder="Choose brand..."
             value={modelFormData.makeId}
             onChange={(e) => setModelFormData({ ...modelFormData, makeId: e.target.value })}
             options={makes.map(m => ({ value: m.id, label: m.name }))}
           />
           <Input 
             label="Model Identifier" 
             placeholder="e.g. Taycan Turbo S" 
             value={modelFormData.name}
             onChange={(e) => setModelFormData({ ...modelFormData, name: e.target.value })}
           />
           <div className="grid grid-cols-2 gap-6">
              <Select 
                label="Vehicle Category"
                placeholder="Type..."
                value={modelFormData.vehicleType}
                onChange={(e) => setModelFormData({ ...modelFormData, vehicleType: e.target.value as VehicleType })}
                options={Object.values(VehicleType).map(t => ({ value: t, label: t.replace('_', ' ') }))}
              />
              <Input 
                label="Pax Cap." 
                placeholder="e.g. 4" 
                type="number"
                value={modelFormData.maxPassengers?.toString()}
                onChange={(e) => setModelFormData({ ...modelFormData, maxPassengers: parseInt(e.target.value) || 0 })}
              />
           </div>
           <div className="flex justify-end gap-3 pt-6 border-t border-gray-50">
              <Button variant="secondary" onClick={() => setModelModal({ open: false })}>Cancel</Button>
              <Button variant="black" onClick={handleSaveModel}>{modelModal.editId ? 'Commit Update' : 'Enable Variant'}</Button>
           </div>
        </div>
      </Modal>
    </div>
  );
};
