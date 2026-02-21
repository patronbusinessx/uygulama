
import React from 'react';
import { NavItem, User } from '../types';
import { Icon } from './Icons';

interface SidebarProps {
  items: NavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  user: User | null;
}

const Sidebar: React.FC<SidebarProps> = ({ items, activeId, onSelect, user }) => {
  return (
    <aside className="fixed left-0 top-0 h-full w-20 md:w-72 bg-black/40 backdrop-blur-2xl border-r border-white/5 z-50 flex flex-col justify-between transition-all duration-500 ease-in-out">
      <div className="flex flex-col h-full">
        {/* Header / Logo */}
        <div className="h-24 flex items-center px-6 md:px-8">
           <div className="relative group cursor-pointer">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative flex items-center justify-center w-12 h-12 bg-black rounded-xl border border-white/10 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-500/20"></div>
                <Icon name="Sparkles" className="w-6 h-6 text-cyan-400" />
              </div>
           </div>
           <div className="ml-4 hidden md:block">
              <h1 className="text-lg font-bold text-white tracking-tight leading-none">NeuraFlow</h1>
              <p className="text-[10px] text-cyan-500/70 font-mono uppercase tracking-[0.2em] mt-1">AI Workspace</p>
           </div>
        </div>
        
        {/* User Profile Card */}
        {user && (
           <div className="px-4 mb-6 hidden md:block">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                 <div className="flex items-center gap-3 relative z-10">
                    <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-cyan-500 to-blue-500">
                       <img src={user.avatar} alt={user.username} className="w-full h-full rounded-full bg-black object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                       <p className="text-sm font-semibold text-white truncate">{user.username}</p>
                       <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${user.membershipTier === 'pro' ? 'bg-yellow-400' : 'bg-emerald-400'}`}></div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider">{user.membershipTier} Plan</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto py-4 scrollbar-hide">
          {items.map((item) => {
            const isActive = activeId === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={`group relative w-full flex items-center px-4 py-3.5 rounded-2xl transition-all duration-500 ${
                  isActive 
                    ? 'text-white bg-white/[0.05] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]' 
                    : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.02]'
                }`}
              >
                {/* Active Indicator */}
                {isActive && (
                    <div className="absolute left-0 w-1 h-6 bg-cyan-500 rounded-r-full shadow-[0_0_15px_rgba(6,182,212,0.8)]"></div>
                )}
                
                {/* Icon Wrapper */}
                <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-500 ${
                  isActive ? 'text-cyan-400' : 'group-hover:text-slate-300'
                }`}>
                  <Icon name={item.icon} className="w-5 h-5" />
                </div>
                
                {/* Text Label */}
                <span className={`ml-3 hidden md:block text-sm font-medium tracking-wide transition-all duration-500 ${
                  isActive ? 'translate-x-0.5' : 'group-hover:translate-x-0.5'
                }`}>
                  {item.label}
                </span>

                {/* Hover Tooltip for Mobile */}
                <div className="md:hidden absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap border border-white/10 z-[60]">
                   {item.label}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-white/5">
          <button 
            onClick={() => onSelect('logout')}
            className="group flex items-center justify-center md:justify-start w-full p-3.5 rounded-2xl text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all duration-300"
          >
              <div className="flex items-center justify-center w-8 h-8">
                <Icon name="Logout" className="w-5 h-5" />
              </div>
              <span className="ml-3 hidden md:block text-sm font-medium">Sign Out</span>
          </button>
      </div>
    </aside>
  );
};

export default Sidebar;
