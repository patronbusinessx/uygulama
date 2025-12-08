
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import LoginInterface from './components/LoginInterface';
import HomeFeed from './components/HomeFeed';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import ContactForm from './components/ContactForm';
import ReportForm from './components/ReportForm';
import { NavItem, User } from './types';
import { Icon } from './components/Icons';
import { authService } from './services/authService';

const NAV_ITEMS: NavItem[] = [
  { id: 'explore', label: 'Explore', icon: 'Explore' },
  { id: 'dashboard', label: 'Dashboard', icon: 'Dashboard' },
  { id: 'account', label: 'Account', icon: 'Account' },
  { id: 'report', label: 'Report', icon: 'Report' },
  { id: 'contact', label: 'Contact', icon: 'Contact' },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('explore');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Initialize admin and check session
    authService.init();
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setActiveTab('dashboard'); 
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setActiveTab('account'); 
  };

  const handleNavSelect = (id: string) => {
    if (id === 'logout') {
        handleLogout();
    } else {
        setActiveTab(id);
    }
  };

  // Dynamic Nav Items based on Role
  const getNavItems = () => {
    const items = [...NAV_ITEMS];
    if (currentUser?.role === 'admin') {
        // Add Admin panel if it doesn't exist
        if (!items.find(i => i.id === 'admin')) {
             items.splice(2, 0, { id: 'admin', label: 'Admin Panel', icon: 'Settings' });
        }
    }
    return items;
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'explore':
        return <HomeFeed user={currentUser} />;
      case 'dashboard':
        if (currentUser) {
            return <Dashboard user={currentUser} />;
        } else {
             return <LoginInterface onLoginSuccess={handleLoginSuccess} />;
        }
      case 'admin':
        if (currentUser?.role === 'admin') {
            return <AdminPanel currentUser={currentUser} />;
        }
        return <div className="p-8 text-center text-red-400">Access Denied</div>;
      case 'account':
        if (currentUser) {
             return <Dashboard user={currentUser} />;
        }
        return <LoginInterface onLoginSuccess={handleLoginSuccess} />;
      case 'report':
        return <ReportForm currentUser={currentUser} />;
      case 'contact':
        return <ContactForm currentUser={currentUser} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700/50 backdrop-blur-sm text-center max-w-md mx-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-700/50 mb-6 text-slate-400">
                     <Icon name={getNavItems().find(n => n.id === activeTab)?.icon || 'Home'} className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-bold text-slate-200 mb-2 capitalize">{activeTab}</h2>
                <p className="mb-6">This module is currently under development.</p>
                <button 
                    onClick={() => setActiveTab('explore')}
                    className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                    Return to Explore
                </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 overflow-hidden font-sans">
      <Sidebar 
        items={getNavItems()} 
        activeId={activeTab} 
        onSelect={handleNavSelect}
        user={currentUser}
      />
      
      <main className="flex-1 ml-20 md:ml-64 relative bg-slate-900 h-full transition-all duration-300">
         <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-slate-900 via-slate-900/80 to-transparent z-10 pointer-events-none"></div>
         {renderContent()}
      </main>
    </div>
  );
};

export default App;
