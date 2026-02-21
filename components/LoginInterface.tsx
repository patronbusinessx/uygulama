
import React, { useState, useEffect } from 'react';
import { Icon } from './Icons';
import { authService } from '../services/authService';
import { User } from '../types';

interface LoginInterfaceProps {
  onLoginSuccess: (user: User) => void;
}

type AuthMode = 'login' | 'signup' | 'forgot';

const LoginInterface: React.FC<LoginInterfaceProps> = ({ onLoginSuccess }) => {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  
  // Form States
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // UI States
  const [isFormValid, setIsFormValid] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<'neutral' | 'success' | 'error'>('neutral');

  const isLogin = authMode === 'login';
  const isSignup = authMode === 'signup';
  const isForgot = authMode === 'forgot';

  useEffect(() => {
    // Reset status when mode changes
    setStatusMessage('');
    setStatusType('neutral');
    setIsFormValid(false);
  }, [authMode]);

  useEffect(() => {
    // Validation Logic
    if (isLogin) {
        if (username.length > 0 && password.length > 0) {
            setIsFormValid(true);
            setStatusMessage('Great! Now you can proceed');
            setStatusType('success');
        } else {
            setIsFormValid(false);
            setStatusMessage('Please fill the input fields before proceeding');
            setStatusType('neutral');
        }
    } else if (isSignup) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (username.length > 0 && password.length >= 4 && emailRegex.test(email)) {
             setIsFormValid(true);
             setStatusMessage('All fields look good!');
             setStatusType('success');
        } else if (!emailRegex.test(email) && email.length > 0) {
             setIsFormValid(false);
             setStatusMessage('Please enter a valid email');
             setStatusType('error');
        } else {
             setIsFormValid(false);
             setStatusMessage('Please fill all fields (Password min 4 chars)');
             setStatusType('neutral');
        }
    } else if (isForgot) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(email)) {
            setIsFormValid(true);
            setStatusMessage('Ready to send reset link');
            setStatusType('neutral');
        } else {
            setIsFormValid(false);
            setStatusMessage('Please enter your registered email');
            setStatusType('neutral');
        }
    }
  }, [username, password, email, authMode, isLogin, isSignup, isForgot]);

  const handleSubmit = async () => {
    if (!isFormValid) return;

    if (isLogin) {
        const result = authService.login(username, password);
        if (result.success && result.user) {
            onLoginSuccess(result.user);
        } else {
            setStatusMessage(result.message);
            setStatusType('error');
        }
    } else if (isSignup) {
        const result = authService.register({ username, email, password });
        if (result.success && result.user) {
            setStatusMessage('Account created! Logging in...');
            setStatusType('success');
            setTimeout(() => {
                onLoginSuccess(result.user!);
            }, 1000);
        } else {
            setStatusMessage(result.message);
            setStatusType('error');
        }
    } else if (isForgot) {
        const users = authService.getUsers();
        const userExists = users.some(u => u.email === email || u.username === email);
        
        if (userExists) {
            setStatusMessage(`Password reset link sent to ${email}`);
            setStatusType('success');
            setTimeout(() => {
                setAuthMode('login');
            }, 3000);
        } else {
            setStatusMessage('No account found with this email');
            setStatusType('error');
        }
    }
  };

  const getTitle = () => {
      if (isLogin) return 'LOGIN';
      if (isSignup) return 'SIGN UP';
      return 'RECOVERY';
  };

  return (
    <div className="h-full w-full overflow-y-auto relative z-20 scrollbar-hide">
      {/* Background Ambience tailored for Login */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-cyan-500/5 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-purple-500/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="flex items-center justify-center min-h-full py-20 px-6">
        {/* Login/Signup Card - Next Gen Minimalist */}
        <div className="w-full max-w-[440px] mx-auto relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-[2.5rem] blur-xl opacity-50 group-hover:opacity-75 transition duration-1000"></div>
          <div className="relative bg-black border border-white/5 rounded-[2.5rem] p-10 md:p-14 overflow-hidden backdrop-blur-3xl">
            
            {/* Back Button for Forgot Password */}
            {isForgot && (
                <button 
                    onClick={() => setAuthMode('login')}
                    className="absolute top-8 left-8 p-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all"
                >
                    <Icon name="ArrowLeft" className="w-4 h-4" />
                </button>
            )}

            {/* Header Section */}
            <div className="text-center mb-12">
               <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mb-8 group-hover:scale-110 transition-transform duration-700">
                  <Icon 
                    name={isLogin ? "Account" : isSignup ? "Person" : "Lock"} 
                    className={`w-8 h-8 ${isLogin ? 'text-white' : isSignup ? 'text-cyan-400' : 'text-red-400'}`} 
                  />
               </div>
               <h2 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">
                  {getTitle()}
               </h2>
               <p className={`text-xs font-mono uppercase tracking-[0.3em] transition-all duration-500 ${
                  statusType === 'success' ? 'text-emerald-400' : 
                  statusType === 'error' ? 'text-rose-500' : 
                  'text-slate-500'
               }`}>
                  {statusMessage || (isLogin ? 'Neural Access' : isSignup ? 'Identity Creation' : 'Recovery Protocol')}
               </p>
            </div>

            {/* Form Inputs */}
            <div className="space-y-6">
              
              {/* Username Field */}
              <div className={`space-y-2 transition-all duration-500 ${isForgot ? 'hidden' : 'block'}`}>
                <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest ml-1">Identity</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/30 transition-all"
                    placeholder="Username"
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className={`space-y-2 transition-all duration-500 ${isLogin ? 'hidden' : 'block'}`}>
                <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest ml-1">Communication</label>
                <div className="relative">
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/30 transition-all"
                    placeholder="Email Address"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className={`space-y-2 transition-all duration-500 ${isForgot ? 'hidden' : 'block'}`}>
                <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest ml-1">Security Key</label>
                <div className="relative">
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/30 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Options Row (Login Only) */}
              {isLogin && (
                <div className="flex items-center justify-between px-1">
                  <label className="flex items-center gap-2 cursor-pointer group/check">
                    <div className="w-4 h-4 rounded border border-white/10 bg-white/5 flex items-center justify-center group-hover:border-cyan-500 transition-colors">
                       <div className="w-2 h-2 rounded-sm bg-cyan-500 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Persistent Session</span>
                  </label>
                  <button 
                      onClick={() => setAuthMode('forgot')}
                      className="text-[10px] font-mono text-slate-500 hover:text-cyan-400 uppercase tracking-wider transition-colors"
                  >
                      Lost Key?
                  </button>
                </div>
              )}

              {/* Action Button */}
              <button 
                onClick={handleSubmit}
                disabled={!isFormValid}
                className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all duration-500 shadow-2xl ${
                  isFormValid 
                    ? 'bg-white text-black hover:bg-cyan-400 shadow-white/5 transform hover:-translate-y-1' 
                    : 'bg-white/5 text-slate-600 cursor-not-allowed border border-white/5'
                }`}
              >
                {isLogin ? 'Authorize' : isSignup ? 'Initialize' : 'Recover'}
              </button>

              {/* Toggle Mode */}
              <div className="text-center pt-6">
                <button 
                    onClick={() => setAuthMode(isForgot ? 'login' : isLogin ? 'signup' : 'login')}
                    className="text-[10px] font-mono text-slate-500 hover:text-white uppercase tracking-[0.3em] transition-all"
                >
                    {isForgot ? 'Return to Access' : isLogin ? 'Create New Identity' : 'Existing Identity'}
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginInterface;
