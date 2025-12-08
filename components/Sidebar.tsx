
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
    <aside className="fixed left-0 top-0 h-full w-20 md:w-64 bg-slate-900 border-r border-slate-800 z-50 flex flex-col justify-between transition-all duration-300 shadow-2xl">
      <div>
        {/* Header / Logo */}
        <div className="h-20 flex items-center justify-center md:justify-start md:px-8 border-b border-slate-800">
           {/* Logo Image */}
           <img 
              src="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=200&auto=format&fit=crop" 
              alt="NeuraFlow Logo" 
              className="w-10 h-10 rounded-xl object-cover mr-0 md:mr-3 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.3)]" 
           />
           <span className="hidden md:block font-bold text-xl text-white tracking-wide">NeuraFlow</span>
        </div>
        
        {/* User Info with PRO Badge (If Logged In) */}
        {user && (
           <div className="hidden md:flex flex-col items-center justify-center py-4 border-b border-slate-800/50 bg-slate-800/20">
              <div className="flex items-center gap-2 mb-1">
                 <span className="text-sm font-bold text-white">{user.username}</span>
                 {user.membershipTier === 'pro' && (
                    <span className="text-[10px] font-bold bg-yellow-500 text-black px-1.5 py-0.5 rounded shadow-[0_0_10px_rgba(234,179,8,0.5)] animate-pulse-slow">PRO</span>
                 )}
              </div>
              <span className="text-xs text-slate-500 capitalize">{user.membershipTier} Plan</span>
           </div>
        )}

        {/* Navigation Items */}
        <nav className="flex flex-col py-6 space-y-2 relative">
          
          {items.map((item) => {
            const isActive = activeId === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={`group relative flex items-center px-4 py-3 mx-3 rounded-xl transition-all duration-300 overflow-hidden ${
                  isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {/* Active Background Pill Effect */}
                {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-800 to-slate-800/50 border border-slate-700/50 rounded-xl shadow-inner shadow-white/5 transition-all duration-300"></div>
                )}
                
                {/* Glow bar on the left for active state */}
                 <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-cyan-400 blur-[2px] transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}></div>

                {/* Icon */}
                <div className={`relative z-10 p-2 mr-3 rounded-lg transition-colors duration-300 ${isActive ? 'text-cyan-400' : 'group-hover:bg-slate-800/50'}`}>
                  <Icon name={item.icon} className="w-5 h-5" />
                </div>
                
                {/* Text Label */}
                <span className={`relative z-10 hidden md:block font-medium text-sm tracking-wide transition-all duration-300 ${isActive ? 'translate-x-1' : 'group-hover:translate-x-1'}`}>
                  {item.label}
                </span>

                 {/* Hover Glow Effect (Right side) */}
                 <div className="absolute right-0 top-0 w-12 h-full bg-gradient-to-l from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section (Logout etc) */}
      <div className="p-4 border-t border-slate-800">
          <button 
            onClick={() => onSelect('logout')}
            className="flex items-center justify-center md:justify-start w-full p-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
          >
              <Icon name="Logout" className="w-5 h-5 md:mr-3" />
              <span className="hidden md:block text-sm font-medium">Logout</span>
          </button>
      </div>
    </aside>
  );
};

export default Sidebar;
