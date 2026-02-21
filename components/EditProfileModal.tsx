
import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { Icon } from './Icons';
import { authService } from '../services/authService';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedUser: User) => void;
  user: User;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, onSuccess, user }) => {
  // General Info
  const [username, setUsername] = useState(user.username);
  const [avatar, setAvatar] = useState(user.avatar || '');
  
  // Security Info
  const [email, setEmail] = useState(user.email);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Re-auth
  const [currentPassword, setCurrentPassword] = useState('');
  
  // UI States
  const [activeTab, setActiveTab] = useState<'general' | 'security'>('general');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Reset fields on open
      setUsername(user.username);
      setAvatar(user.avatar || '');
      setEmail(user.email);
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
      setStatus({ type: null, message: '' });
      setActiveTab('general');
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            setStatus({ type: 'error', message: 'Image size too large. Max 2MB.' });
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setAvatar(reader.result as string);
            setStatus({ type: null, message: '' }); // Clear any previous errors
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: null, message: '' });

    // Validation
    const isSecurityChanged = email !== user.email || newPassword.length > 0;

    if (isSecurityChanged) {
       if (!currentPassword) {
         setStatus({ type: 'error', message: 'Current password is required to change email or password.' });
         setActiveTab('security');
         return;
       }
       if (newPassword && newPassword !== confirmPassword) {
         setStatus({ type: 'error', message: 'New passwords do not match.' });
         return;
       }
       if (newPassword && newPassword.length < 4) {
          setStatus({ type: 'error', message: 'Password must be at least 4 characters.' });
          return;
       }
    }

    setIsSubmitting(true);

    // Simulate network delay
    setTimeout(() => {
      const result = authService.updateUser(
        user.id,
        { username, avatar },
        isSecurityChanged ? { currentPassword, newEmail: email, newPassword } : undefined
      );

      if (result.success && result.user) {
        setStatus({ type: 'success', message: result.message });
        setTimeout(() => {
          onSuccess(result.user!);
          onClose();
        }, 1000);
      } else {
        setStatus({ type: 'error', message: result.message });
      }
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-xl transition-opacity"
        onClick={onClose}
      ></div>

      <div className="relative w-full max-w-lg bg-black border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in">
        
        {/* Header */}
        <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex flex-col">
              <span className="text-[10px] font-mono text-cyan-500 uppercase tracking-[0.3em] mb-1">Identity Management</span>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Edit Profile</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-all"
          >
            <Icon name="X" className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5 p-2 bg-white/[0.02]">
          <button 
            onClick={() => setActiveTab('general')}
            className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all rounded-2xl ${
              activeTab === 'general' 
                ? 'bg-white text-black shadow-xl' 
                : 'text-slate-500 hover:text-white hover:bg-white/5'
            }`}
          >
            General
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all rounded-2xl ${
              activeTab === 'security' 
                ? 'bg-white text-black shadow-xl' 
                : 'text-slate-500 hover:text-white hover:bg-white/5'
            }`}
          >
            Security
          </button>
        </div>

        {/* Body */}
        <div className="p-10 overflow-y-auto scrollbar-hide">
          
          {status.message && (
            <div className={`p-4 mb-8 rounded-2xl text-[10px] font-mono uppercase tracking-widest border ${
              status.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              {status.message}
            </div>
          )}

          <form id="edit-profile-form" onSubmit={handleSubmit} className="space-y-10">
            
            {activeTab === 'general' && (
              <>
                <div className="space-y-6">
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block text-center">Neural Avatar</label>
                    <div className="flex flex-col items-center justify-center gap-6">
                        <div 
                            className="relative w-32 h-32 rounded-full p-1 bg-gradient-to-br from-cyan-400 to-purple-500 cursor-pointer group"
                            onClick={() => fileInputRef.current?.click()}
                        >
                             <img src={avatar || user.avatar} alt="Avatar" className="w-full h-full rounded-full bg-black object-cover" />
                             <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                <Icon name="UploadCloud" className="w-8 h-8 text-white" />
                             </div>
                        </div>
                        
                        <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-cyan-400 hover:bg-white/10 transition-all"
                        >
                            Update Visual Data
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handleAvatarUpload} 
                        />
                    </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest ml-1">Identity Handle</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/30 transition-all pl-14"
                    />
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500">
                      <Icon name="Person" className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'security' && (
              <>
                <div className="p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl text-[10px] font-mono text-yellow-500/70 uppercase tracking-widest leading-relaxed">
                   Authorization required for security protocol changes.
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest ml-1">Transmission Address</label>
                  <div className="relative">
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/30 transition-all pl-14"
                    />
                     <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500">
                      <Icon name="Contact" className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest ml-1">New Access Key</label>
                  <div className="relative">
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Leave blank to retain"
                      className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/30 transition-all pl-14"
                    />
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500">
                      <Icon name="Lock" className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest ml-1">Confirm Access Key</label>
                  <div className="relative">
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                       placeholder="Leave blank to retain"
                      className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/30 transition-all pl-14"
                    />
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500">
                      <Icon name="Lock" className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-white/5">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-white uppercase tracking-widest ml-1">Current Authorization Key (Required)</label>
                      <input 
                        type="password" 
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current key to authorize"
                        className="w-full bg-black border border-white/20 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/30 transition-all"
                      />
                   </div>
                </div>
              </>
            )}

          </form>
        </div>

        {/* Footer */}
        <div className="px-10 py-8 border-t border-white/5 flex justify-end gap-4">
          <button 
            onClick={onClose}
            type="button"
            className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-white transition-colors"
          >
            Abort
          </button>
          <button 
            type="submit"
            form="edit-profile-form"
            disabled={isSubmitting}
            className="px-10 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-white/5 hover:bg-cyan-400 transition-all duration-500 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
             {isSubmitting ? 'Syncing...' : 'Commit Changes'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default EditProfileModal;
