
import React, { useState } from 'react';
import { LayoutDashboard, Users, Car, Wrench, Banknote, ChevronDown, ChevronRight, Tablet, Share2, Package, UserCheck, LogOut, ReceiptText, Navigation, X } from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  onLogout: () => void;
  onToggle?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange, onLogout, onToggle }) => {
  const [pricingExpanded, setPricingExpanded] = useState(true);

  const isPricingPage = currentPage.startsWith('pricing-');

  return (
    <div className="w-64 bg-gray-100 h-full flex flex-col border-r border-gray-200 relative">
      {/* Close button for mobile/collapsed state */}
      <button 
        onClick={onToggle}
        className="lg:hidden absolute top-6 right-4 p-2 text-gray-400 hover:text-gray-900 transition-colors"
      >
        <X size={20} />
      </button>

      {/* Logo Area */}
      <div className="p-6 flex items-center justify-center">
        <div className="text-3xl font-black text-blue-600 tracking-tighter flex items-center">
          <span>G</span>
          <span className="text-yellow-500 mx-0.5 relative top-1">
             <Car size={24} fill="currentColor" strokeWidth={0} />
          </span>
          <span>go</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto no-scrollbar">
        <div className="mb-6">
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Summary" 
            active={currentPage === 'summary'} 
            onClick={() => onPageChange('summary')}
          />
        </div>

        <div className="mb-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          People
        </div>
        <div className="mb-6 space-y-1">
          <NavItem 
            icon={<Users size={20} />} 
            label="Drivers" 
            active={currentPage === 'drivers'}
            onClick={() => onPageChange('drivers')}
          />
          <NavItem 
            icon={<ReceiptText size={20} />} 
            label="Billings & Payouts" 
            active={currentPage === 'billings'}
            onClick={() => onPageChange('billings')}
          />
        </div>

        <div className="mb-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Operations
        </div>
        <div className="mb-6 space-y-1">
          <NavItem 
            icon={<Navigation size={20} />} 
            label="Trips" 
            active={currentPage === 'trips'}
            onClick={() => onPageChange('trips')}
          />
        </div>

        <div className="mb-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Fleet
        </div>
        <div className="space-y-1">
          <NavItem 
            icon={<Car size={20} />} 
            label="Vehicle" 
            active={currentPage === 'vehicle'}
            onClick={() => onPageChange('vehicle')}
          />
          <NavItem 
            icon={<Wrench size={20} />} 
            label="Make & Model" 
            active={currentPage === 'make-model'}
            onClick={() => onPageChange('make-model')}
          />
          
          <div>
            <button
              onClick={() => setPricingExpanded(!pricingExpanded)}
              className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                isPricingPage ? 'text-gray-900 bg-gray-200/50' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center">
                <Banknote size={20} className={`mr-3 ${isPricingPage ? 'text-gray-900' : 'text-gray-500'}`} />
                Pricing
              </div>
              {pricingExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            
            {pricingExpanded && (
              <div className="mt-1 ml-4 pl-4 border-l border-gray-300 space-y-1">
                <SubNavItem 
                  icon={<Tablet size={16} />}
                  label="Book Ride" 
                  active={currentPage === 'pricing-book-ride'} 
                  onClick={() => onPageChange('pricing-book-ride')} 
                />
                <SubNavItem 
                  icon={<Share2 size={16} />}
                  label="Sharing" 
                  active={currentPage === 'pricing-sharing'} 
                  onClick={() => onPageChange('pricing-sharing')} 
                />
                <SubNavItem 
                  icon={<Package size={16} />}
                  label="Parcel" 
                  active={currentPage === 'pricing-parcel'} 
                  onClick={() => onPageChange('pricing-parcel')} 
                />
                <SubNavItem 
                  icon={<UserCheck size={16} />}
                  label="Chauffer" 
                  active={currentPage === 'pricing-chauffer'} 
                  onClick={() => onPageChange('pricing-chauffer')} 
                />
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between group">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center text-white overflow-hidden shadow-sm">
               <img src="https://picsum.photos/100/100" alt="Admin" className="w-full h-full object-cover" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-black text-gray-900 leading-tight">Admin</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">gogo@gmail.com</p>
            </div>
          </div>
          <button 
            onClick={onLogout} 
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            title="Log Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
        active
          ? 'bg-gray-200 text-gray-900'
          : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
      }`}
    >
      <span className={`mr-3 ${active ? 'text-gray-900' : 'text-gray-500'}`}>{icon}</span>
      {label}
    </button>
  );
};

const SubNavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center px-3 py-2 text-xs font-medium rounded-md transition-colors ${
        active
          ? 'bg-blue-50 text-blue-700'
          : 'text-gray-500 hover:bg-gray-200 hover:text-gray-900'
      }`}
    >
      <span className={`mr-2 ${active ? 'text-blue-600' : 'text-gray-400'}`}>{icon}</span>
      {label}
    </button>
  );
};
