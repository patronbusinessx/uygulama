
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
        return (
          <div className="flex flex-col items-center justify-center h-full bg-[#050505] p-10">
            <div className="bg-black border border-red-500/20 p-12 rounded-[3rem] backdrop-blur-3xl text-center max-w-md shadow-2xl shadow-red-500/5">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-red-500/10 mb-8 text-red-500 border border-red-500/20">
                     <Icon name="Lock" className="w-12 h-12" />
                </div>
                <h2 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase">Access Denied</h2>
                <p className="text-slate-500 font-medium mb-10 leading-relaxed">Your current authorization level is insufficient to access the Command Center.</p>
                <button 
                    onClick={() => setActiveTab('explore')}
                    className="px-10 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-500 transition-all duration-500"
                >
                    Return to Stream
                </button>
            </div>
          </div>
        );
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
          <div className="flex flex-col items-center justify-center h-full bg-[#050505] p-10">
            <div className="bg-black border border-white/10 p-12 rounded-[3rem] backdrop-blur-3xl text-center max-w-md shadow-2xl">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white/5 mb-8 text-slate-400 border border-white/10">
                     <Icon name={getNavItems().find(n => n.id === activeTab)?.icon || 'Home'} className="w-12 h-12" />
                </div>
                <h2 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase">{activeTab}</h2>
                <p className="text-slate-500 font-medium mb-10 leading-relaxed">This neural module is currently undergoing synthesis and optimization.</p>
                <button 
                    onClick={() => setActiveTab('explore')}
                    className="px-10 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-cyan-400 transition-all duration-500"
                >
                    Return to Stream
                </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#050505] overflow-hidden font-sans selection:bg-cyan-500/30">
      <Sidebar 
        items={getNavItems()} 
        activeId={activeTab} 
        onSelect={handleNavSelect}
        user={currentUser}
      />
      
      <main className="flex-1 ml-20 md:ml-72 relative bg-[#050505] h-full transition-all duration-500 ease-in-out">
         {/* Content Container */}
         <div className="h-full relative z-10">
            {renderContent()}
         </div>
      </main>
    </div>
  );
};

export default App;
