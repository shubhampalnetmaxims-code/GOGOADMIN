
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { MakeModelPage } from './pages/MakeModelPage';
import { PricingPage } from './pages/PricingPage';
import { LoginPage } from './pages/LoginPage';
import { BillingPayoutPage } from './pages/BillingPayoutPage';
import { PricingService } from './types';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('gogo_auth') === 'true');
  const [currentPage, setCurrentPage] = useState('make-model');

  const handleLogin = () => {
    localStorage.setItem('gogo_auth', 'true');
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('gogo_auth');
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'make-model':
        return <MakeModelPage />;
      case 'billings':
        return <BillingPayoutPage />;
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
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} onLogout={handleLogout} />
      <main className="flex-1 overflow-auto bg-gray-50">
        {renderPage()}
      </main>
    </div>
  );
};

export default App;
