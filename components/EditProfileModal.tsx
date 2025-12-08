import React, { useState, useEffect } from 'react';
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      <div className="relative w-full max-w-md bg-[#0f172a] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Edit Profile
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <Icon name="X" className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800">
          <button 
            onClick={() => setActiveTab('general')}
            className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'general' 
                ? 'border-cyan-500 text-cyan-400 bg-slate-800/30' 
                : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            General Info
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'security' 
                ? 'border-cyan-500 text-cyan-400 bg-slate-800/30' 
                : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Security (Email & Password)
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          
          {status.message && (
            <div className={`p-3 mb-4 rounded-lg text-sm border ${
              status.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              {status.message}
            </div>
          )}

          <form id="edit-profile-form" onSubmit={handleSubmit} className="space-y-5">
            
            {activeTab === 'general' && (
              <>
                <div className="flex justify-center mb-4">
                  <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-br from-cyan-400 to-purple-500">
                     <img src={avatar || user.avatar} alt="Avatar" className="w-full h-full rounded-full bg-slate-900 object-cover" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">Username</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 pl-10"
                    />
                    <div className="absolute left-3 top-3.5 text-slate-500">
                      <Icon name="Person" className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">Avatar URL</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 pl-10"
                    />
                    <div className="absolute left-3 top-3.5 text-slate-500">
                      <Icon name="Image" className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'security' && (
              <>
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs text-yellow-200 mb-2">
                   Changing email or password requires current password verification.
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">Email Address</label>
                  <div className="relative">
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 pl-10"
                    />
                     <div className="absolute left-3 top-3.5 text-slate-500">
                      <Icon name="Contact" className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">New Password</label>
                  <div className="relative">
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Leave blank to keep current"
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 pl-10"
                    />
                    <div className="absolute left-3 top-3.5 text-slate-500">
                      <Icon name="Lock" className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">Confirm New Password</label>
                  <div className="relative">
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                       placeholder="Leave blank to keep current"
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 pl-10"
                    />
                    <div className="absolute left-3 top-3.5 text-slate-500">
                      <Icon name="Lock" className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800">
                   <div className="space-y-2">
                      <label className="block text-sm font-bold text-white">Current Password (Required)</label>
                      <input 
                        type="password" 
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password to save changes"
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-red-500/50"
                      />
                   </div>
                </div>
              </>
            )}

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex justify-end gap-3 bg-slate-900/50">
          <button 
            onClick={onClose}
            type="button"
            className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="edit-profile-form"
            disabled={isSubmitting}
            className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg font-bold shadow-lg shadow-cyan-500/20 transform active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
             {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default EditProfileModal;