import React, { useState, useMemo } from 'react';
import { Plus, Search, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Make, Model, VehicleType } from '../types';

// Mock Data
const INITIAL_MAKES: Make[] = [
  { id: '1', name: 'Toyota', modelsCount: 1, createdOn: '12/17/2025' },
  { id: '2', name: 'Ford', modelsCount: 1, createdOn: '12/17/2025' },
  { id: '3', name: 'Honda', modelsCount: 5, createdOn: '12/18/2025' },
  { id: '4', name: 'BMW', modelsCount: 2, createdOn: '12/20/2025' },
];

const INITIAL_MODELS: Model[] = [
  { id: '1', name: 'Hilux', makeId: '1', makeName: 'Toyota', vehicleCount: 1, vehicleType: VehicleType.SUV, maxPassengers: 6 },
  { id: '2', name: 'GT40', makeId: '2', makeName: 'Ford', vehicleCount: 2, vehicleType: VehicleType.ECONOMY, maxPassengers: 4 },
  { id: '3', name: 'Civic', makeId: '3', makeName: 'Honda', vehicleCount: 10, vehicleType: VehicleType.SEDAN, maxPassengers: 5 },
  { id: '4', name: 'X5', makeId: '4', makeName: 'BMW', vehicleCount: 3, vehicleType: VehicleType.SUV, maxPassengers: 5 },
];

export const MakeModelPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'make' | 'model'>('model');
  const [makes, setMakes] = useState<Make[]>(INITIAL_MAKES);
  const [models, setModels] = useState<Model[]>(INITIAL_MODELS);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal States
  const [isMakeModalOpen, setIsMakeModalOpen] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);

  // Form States
  const [newMakeName, setNewMakeName] = useState('');
  
  const [newModelData, setNewModelData] = useState({
    makeId: '',
    name: '',
    vehicleType: '' as VehicleType | '',
    maxPassengers: '',
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

  // Handlers
  const handleAddMake = () => {
    if (!newMakeName.trim()) return;
    const newMake: Make = {
      id: Date.now().toString(),
      name: newMakeName,
      modelsCount: 0,
      createdOn: new Date().toLocaleDateString('en-US'),
    };
    setMakes([...makes, newMake]);
    setNewMakeName('');
    setIsMakeModalOpen(false);
  };

  const handleAddModel = () => {
    if (!newModelData.makeId || !newModelData.name || !newModelData.vehicleType || !newModelData.maxPassengers) return;
    
    const selectedMake = makes.find(m => m.id === newModelData.makeId);
    if (!selectedMake) return;

    const newModel: Model = {
      id: Date.now().toString(),
      name: newModelData.name,
      makeId: newModelData.makeId,
      makeName: selectedMake.name,
      vehicleCount: 0,
      vehicleType: newModelData.vehicleType as VehicleType,
      maxPassengers: parseInt(newModelData.maxPassengers),
    };

    // Update make count
    setMakes(prev => prev.map(m => m.id === newModel.makeId ? { ...m, modelsCount: m.modelsCount + 1 } : m));
    setModels([...models, newModel]);
    setNewModelData({ makeId: '', name: '', vehicleType: '', maxPassengers: '' });
    setIsModelModalOpen(false);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {activeTab === 'make' ? 'Make' : 'Model'}
        </h1>
        <Button 
          icon={<Plus size={18} />} 
          onClick={() => activeTab === 'make' ? setIsMakeModalOpen(true) : setIsModelModalOpen(true)}
        >
          {activeTab === 'make' ? 'Add Make' : 'Add Model'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => { setActiveTab('make'); setSearchQuery(''); }}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'make'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Make
          </button>
          <button
            onClick={() => { setActiveTab('model'); setSearchQuery(''); }}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'model'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Model
          </button>
        </nav>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col">
        {/* Search */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={`Search ${activeTab === 'make' ? 'Make' : 'Model'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              {activeTab === 'make' ? (
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Make</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Models</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Created On</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Actions</th>
                </tr>
              ) : (
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Models</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Make</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Vehicle</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Vehicle Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Max Passenger</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Actions</th>
                </tr>
              )}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activeTab === 'make' ? (
                filteredMakes.map((make) => (
                  <tr key={make.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{make.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{make.modelsCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{make.createdOn}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreHorizontal size={20} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                filteredModels.map((model) => (
                  <tr key={model.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{model.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{model.makeName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{model.vehicleCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{model.vehicleType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{model.maxPassengers}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreHorizontal size={20} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
              {((activeTab === 'make' && filteredMakes.length === 0) || (activeTab === 'model' && filteredModels.length === 0)) && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                    No results found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="flex items-center">
            <span className="text-sm text-gray-700 mr-2">Rows per page:</span>
            <select className="border border-gray-300 rounded text-sm p-1 bg-white focus:ring-blue-500 focus:border-blue-500">
              <option>10</option>
              <option>20</option>
              <option>50</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <button className="flex items-center px-2 py-1 border border-transparent text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50">
              <ChevronLeft size={16} className="mr-1" />
              Previous
            </button>
            <span className="inline-flex items-center justify-center px-3 py-1 border border-gray-300 rounded text-sm font-medium text-gray-900 bg-gray-100">
              1
            </span>
            <button className="flex items-center px-2 py-1 border border-transparent text-sm text-gray-500 hover:text-gray-700">
              Next
              <ChevronRight size={16} className="ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Add Make Modal */}
      <Modal
        isOpen={isMakeModalOpen}
        onClose={() => setIsMakeModalOpen(false)}
        title="Add Manufacture"
        footer={
          <>
             <Button variant="secondary" onClick={() => setIsMakeModalOpen(false)}>Cancel</Button>
             <Button variant="black" onClick={handleAddMake}>Add</Button>
          </>
        }
      >
        <Input 
          label="Make" 
          placeholder="e.g. Toyota" 
          value={newMakeName}
          onChange={(e) => setNewMakeName(e.target.value)}
        />
      </Modal>

      {/* Add Model Modal */}
      <Modal
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
        title="Add Model"
        footer={
          <>
             <Button variant="secondary" onClick={() => setIsModelModalOpen(false)}>Cancel</Button>
             <Button variant="black" onClick={handleAddModel}>Add</Button>
          </>
        }
      >
        <Select 
          label="Make"
          placeholder="Select make"
          value={newModelData.makeId}
          onChange={(e) => setNewModelData({ ...newModelData, makeId: e.target.value })}
          options={makes.map(m => ({ value: m.id, label: m.name }))}
        />
        <Input 
          label="Model" 
          placeholder="e.g. Camry" 
          value={newModelData.name}
          onChange={(e) => setNewModelData({ ...newModelData, name: e.target.value })}
        />
        <Select 
          label="Vehicle Type"
          placeholder="Select type"
          value={newModelData.vehicleType}
          onChange={(e) => setNewModelData({ ...newModelData, vehicleType: e.target.value as VehicleType })}
          options={Object.values(VehicleType).map(t => ({ value: t, label: t }))}
        />
        <Input 
          label="Max Passenger" 
          placeholder="e.g. 4" 
          type="number"
          value={newModelData.maxPassengers}
          onChange={(e) => setNewModelData({ ...newModelData, maxPassengers: e.target.value })}
        />
      </Modal>
    </div>
  );
};