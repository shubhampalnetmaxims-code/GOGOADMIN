
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { MakeModelPage } from './pages/MakeModelPage';
import { PricingPage } from './pages/PricingPage';
import { LoginPage } from './pages/LoginPage';
import { BillingPayoutPage } from './pages/BillingPayoutPage';
import { TripsPage } from './pages/TripsPage';
import { DriverDashboardPage } from './pages/DriverDashboardPage';
import { PricingService } from './types';
import { Menu } from 'lucide-react';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('gogo_auth') === 'true');
  const [interfaceMode, setInterfaceMode] = useState<'admin' | 'driver'>(
    (localStorage.getItem('gogo_mode') as 'admin' | 'driver') || 'admin'
  );
  const [currentPage, setCurrentPage] = useState('make-model');
  const [tripsFilter, setTripsFilter] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogin = (mode: 'admin' | 'driver' = 'admin') => {
    localStorage.setItem('gogo_auth', 'true');
    localStorage.setItem('gogo_mode', mode);
    setIsLoggedIn(true);
    setInterfaceMode(mode);
  };

  const handleLogout = () => {
    localStorage.removeItem('gogo_auth');
    localStorage.removeItem('gogo_mode');
    setIsLoggedIn(false);
  };

  const navigateToTrips = (filter: string) => {
    setTripsFilter(filter);
    setCurrentPage('trips');
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => handleLogin('admin')} onDriverLogin={() => handleLogin('driver')} />;
  }

  // Render Driver Interface
  if (interfaceMode === 'driver') {
    return <DriverDashboardPage onLogout={handleLogout} />;
  }

  // Render Admin Interface
  const renderPage = () => {
    switch (currentPage) {
      case 'make-model':
        return <MakeModelPage />;
      case 'billings':
        return <BillingPayoutPage onNavigateToTrips={navigateToTrips} />;
      case 'trips':
        return <TripsPage initialFilter={tripsFilter} onFilterChange={setTripsFilter} />;
      case 'pricing-book-ride':
        return <PricingPage service={PricingService.BOOK_RIDE} />;
      case 'pricing-sharing':
        return <PricingPage service={PricingService.SHARING} />;
      case 'pricing-parcel':
        return <PricingPage service={PricingService.PARCEL} />;
      case 'pricing-chauffer':
        return <PricingPage service={PricingService.CHAUFFER} />;
      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-500 flex-col space-y-4 p-8">
            <div className="text-4xl">🚧</div>
            <p className="text-lg font-medium text-center">This section is currently under development.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden relative">
      <div className={`fixed inset-y-0 left-0 z-50 transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <Sidebar 
          currentPage={currentPage} 
          onPageChange={(page) => {
            if (page !== 'trips') setTripsFilter('');
            setCurrentPage(page);
            if (window.innerWidth < 1024) setIsSidebarOpen(false);
          }} 
          onLogout={handleLogout} 
          onToggle={() => setIsSidebarOpen(false)}
        />
      </div>

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <main className="flex-1 overflow-auto bg-gray-50 relative">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`fixed top-4 left-4 z-30 p-2.5 bg-white border border-gray-200 rounded-xl shadow-lg hover:bg-gray-50 transition-all active:scale-95 lg:hidden flex items-center justify-center`}
        >
          <Menu size={20} className="text-gray-900" />
        </button>

        <div className="pt-16 lg:pt-0 min-h-full">
          {renderPage()}
        </div>
      </main>
    </div>
  );
};

export default App;
