import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AppProvider, useApp } from './store/useAppStore';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import MiniBanner from './components/MiniBanner';
import TabNav from './components/TabNav';
import PlanTab from './components/tabs/PlanTab';
import PortfolioTab from './components/tabs/PortfolioTab';
import ScenariosTab from './components/tabs/ScenariosTab';
import MapTab from './components/tabs/MapTab';
import ReviewActTab from './components/tabs/ReviewActTab';
import GameTab from './components/tabs/GameTab';
import BrokerageSimulation from './components/tabs/simulations/BrokerageSimulation';
import RothIRASimulation from './components/tabs/simulations/RothIRASimulation';
import HSASimulation from './components/tabs/simulations/HSASimulation';
import Traditional401kSimulation from './components/tabs/simulations/Traditional401kSimulation';
import FivetwonineSimulation from './components/tabs/simulations/FivetwonineSimulation';
import './App.css';

function AccountView({ account, onBack }) {
  const [activeTab, setActiveTab] = useState('plan');

  // Determine which tabs to show based on account type
  const baseTabs = [
    { id: 'plan', label: '🎯 Plan', emoji: '🎯' },
    { id: 'portfolio', label: '💼 Portfolio', emoji: '💼' }
  ];

  const simulationTab = { id: 'simulation', label: '📈 Simulation', emoji: '📈' };

  const otherTabs = [
    { id: 'scenarios', label: '🔮 What-If', emoji: '🔮' },
    { id: 'map', label: '🗺️ Risk Map', emoji: '🗺️' },
    { id: 'review', label: '✓ Review & Act', emoji: '✓' }
  ];

  // Show simulation tab for Brokerage, Roth IRA, HSA, 401(k), and 529 Plan accounts
  const showSimulation = account.type === 'Brokerage' || 
                         account.type === 'Roth IRA' || 
                         account.type === 'HSA' ||
                         account.type === 'Traditional 401(k)' ||
                         account.type === '529 Plan';

  const tabs = showSimulation 
    ? [...baseTabs, simulationTab, ...otherTabs]
    : [...baseTabs, ...otherTabs];

  // Render appropriate simulation component based on account type
  const renderSimulation = () => {
    if (account.type === 'Brokerage') {
      return <BrokerageSimulation />;
    } else if (account.type === 'Roth IRA') {
      return <RothIRASimulation />;
    } else if (account.type === 'HSA') {
      return <HSASimulation />;
    } else if (account.type === 'Traditional 401(k)') {
      return <Traditional401kSimulation />;
    } else if (account.type === '529 Plan') {
      return <FivetwonineSimulation />;
    }
    return null;
  };

  return (
    <>
      <header className="topbar">
        <div className="topbar-left">
          <button className="back-button" onClick={onBack} aria-label="Back to dashboard">
            ← Back
          </button>
          <div className="account-breadcrumb">
            <p className="eyebrow">{account.type}</p>
            <h1>{account.name}</h1>
          </div>
        </div>
      </header>

      <TabNav tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      
      <MiniBanner account={account} />

      <main className="content">
        {activeTab === 'plan' && <PlanTab account={account} onNext={() => setActiveTab('portfolio')} />}
        {activeTab === 'portfolio' && <PortfolioTab account={account} />}
        {activeTab === 'simulation' && renderSimulation()}
        {activeTab === 'scenarios' && <ScenariosTab account={account} />}
        {activeTab === 'map' && <MapTab account={account} onNavigateToReview={() => setActiveTab('review')} />}
        {activeTab === 'review' && <ReviewActTab account={account} />}
      </main>
    </>
  );
}

function AuthenticatedApp({ user, onLogout }) {
  const { state, dispatch } = useApp();
  const accounts = state.portfolioAccounts;
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [showGameModal, setShowGameModal] = useState(false);
  const selectedAccount = accounts.find((account) => account.id === selectedAccountId) || null;

  useEffect(() => {
    dispatch({ type: 'SYNC_PORTFOLIO_ACCOUNTS' });
  }, [dispatch]);

  const handleSelectAccount = (account) => {
    setSelectedAccountId(account.id);
  };

  const handleBack = () => {
    setSelectedAccountId(null);
  };

  const handleAddAccount = () => {
    alert('Add Account feature coming soon!');
  };

  const handlePlayGame = () => {
    setShowGameModal(true);
  };

  const handleCloseGame = () => {
    setShowGameModal(false);
  };

  const getUserInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="app">
      {!selectedAccount && (
        <header className="topbar">
          <div className="topbar-left">
            <div className="logo-section">
              <div className="logo-icon">💎</div>
              <div>
                <p className="eyebrow">CLARITYINVEST</p>
                <h1>Your Investment Portfolio</h1>
              </div>
            </div>
          </div>
          <div className="topbar-right">
            <div className="user-menu">
              <div className="user-avatar">
                {getUserInitials(user.name)}
              </div>
              <div className="user-info">
                <span className="user-name">{user.name}</span>
                <button className="logout-button" onClick={onLogout}>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>
      )}

      {selectedAccount ? (
        <AccountView account={selectedAccount} onBack={handleBack} />
      ) : (
        <main className="content">
          <Dashboard
            accounts={accounts}
            onSelectAccount={handleSelectAccount}
            onAddAccount={handleAddAccount}
            onPlayGame={handlePlayGame}
          />
          {showGameModal && (
            <div className="game-modal-overlay" onClick={handleCloseGame}>
              <div className="game-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="game-modal-close" onClick={handleCloseGame}>
                  ×
                </button>
                <GameTab />
              </div>
            </div>
          )}
        </main>
      )}
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('clarityinvest_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        if (userData.loggedIn) {
          setUser(userData);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('clarityinvest_user');
      }
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('clarityinvest_user');
    setUser(null);
  };

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner">💎</div>
        <p>Loading ClarityInvest...</p>
      </div>
    );
  }

  return (
    <AppProvider>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1a1a2e',
            color: '#fff',
            border: '1px solid #6c5ce7'
          }
        }}
      />
      
      {!user ? (
        <Login onLogin={handleLogin} />
      ) : (
        <AuthenticatedApp user={user} onLogout={handleLogout} />
      )}
    </AppProvider>
  );
}

export default App;
