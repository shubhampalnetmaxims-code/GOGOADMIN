
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { MakeModelPage } from './pages/MakeModelPage';
import { PricingPage } from './pages/PricingPage';
import { LoginPage } from './pages/LoginPage';
import { BillingPayoutPage } from './pages/BillingPayoutPage';
import { TripsPage } from './pages/TripsPage';
import { PricingService } from './types';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('gogo_auth') === 'true');
  const [currentPage, setCurrentPage] = useState('make-model');
  const [tripsFilter, setTripsFilter] = useState('');

  const handleLogin = () => {
    localStorage.setItem('gogo_auth', 'true');
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('gogo_auth');
    setIsLoggedIn(false);
  };

  const navigateToTrips = (filter: string) => {
    setTripsFilter(filter);
    setCurrentPage('trips');
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

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
          <div className="flex items-center justify-center h-full text-gray-500 flex-col space-y-4">
            <div className="text-4xl">🚧</div>
            <p className="text-lg font-medium">This section is currently under development.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar 
        currentPage={currentPage} 
        onPageChange={(page) => {
          if (page !== 'trips') setTripsFilter('');
          setCurrentPage(page);
        }} 
        onLogout={handleLogout} 
      />
      <main className="flex-1 overflow-auto bg-gray-50">
        {renderPage()}
      </main>
    </div>
  );
};

export default App;
