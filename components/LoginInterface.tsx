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
    // Don't clear inputs immediately to allow switching back/forth if needed, 
    // or clear them if desired. Let's clear for cleaner UX.
    if (authMode !== 'forgot') {
        // Keep email if switching from forgot to login?
        // Let's just clear password/username
        // setUsername('');
        // setPassword('');
    }
  }, [authMode]);

  useEffect(() => {
    // Validation Logic
    if (isLogin) {
        // Login Mode Validation
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
        // Sign Up Mode Validation
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
        // Forgot Password Validation
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
        // Handle Login
        const result = authService.login(username, password);
        if (result.success && result.user) {
            onLoginSuccess(result.user);
        } else {
            setStatusMessage(result.message);
            setStatusType('error');
        }
    } else if (isSignup) {
        // Handle Sign Up
        const result = authService.register({ username, email, password });
        if (result.success && result.user) {
            // Auto login after signup
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
        // Handle Forgot Password
        const users = authService.getUsers();
        // Allow reset if username OR email matches
        const userExists = users.some(u => u.email === email || u.username === email);
        
        if (userExists) {
            setStatusMessage(`Password reset link sent to ${email}`);
            setStatusType('success');
            // Optional: Redirect to login after a few seconds
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
    <div className="flex items-center justify-center h-full w-full relative z-20 overflow-y-auto py-10">
      {/* Background Ambience tailored for Login */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none fixed">
          <div className="absolute top-[20%] right-[30%] w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[10%] left-[20%] w-[400px] h-[400px] bg-cyan-600/5 rounded-full blur-[100px]"></div>
      </div>

      {/* Login/Signup Card */}
      <div className="w-[380px] p-8 rounded-3xl bg-[#0f172a] border border-slate-800 shadow-2xl relative z-10 backdrop-blur-sm transition-all duration-500">
        
        {/* Back Button for Forgot Password */}
        {isForgot && (
            <button 
                onClick={() => setAuthMode('login')}
                className="absolute top-6 left-6 text-slate-500 hover:text-white transition-colors"
            >
                <Icon name="ArrowLeft" className="w-5 h-5" />
            </button>
        )}

        {/* Avatar Header */}
        <div className="flex justify-center mb-6 relative">
          <div className={`w-24 h-24 rounded-full bg-[#1e293b] flex items-center justify-center border-4 border-[#0f172a] shadow-lg shadow-black/40 z-10 transition-transform hover:scale-105 ${isForgot ? 'ring-2 ring-red-500/20' : ''}`}>
             <Icon 
                name={isLogin ? "Account" : isSignup ? "Person" : "Lock"} 
                className={`w-12 h-12 ${isLogin ? 'text-slate-400' : isSignup ? 'text-cyan-400' : 'text-red-400'}`} 
             />
          </div>
          {/* Decorative glow behind avatar */}
          <div className={`absolute top-4 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full blur-xl transition-colors duration-500 ${isLogin ? 'bg-cyan-500/20' : isSignup ? 'bg-purple-500/20' : 'bg-red-500/20'}`}></div>
        </div>

        {/* Title */}
        <h2 className="text-3xl font-bold text-center text-white tracking-widest mb-3 transition-all">
            {getTitle()}
        </h2>
        
        {/* Status Message (Dynamic) */}
        <div className="h-6 mb-8 text-center">
            <p className={`text-xs font-semibold transition-all duration-300 ${
                statusType === 'success' ? 'text-emerald-400' : 
                statusType === 'error' ? 'text-rose-500' : 
                'text-slate-500' // Default neutral
            }`}>
            {statusMessage || (isLogin ? 'Please enter your credentials' : isSignup ? 'Create your account' : 'Enter email to reset password')}
            </p>
        </div>

        {/* Form Inputs */}
        <div className="space-y-6">
          
          {/* Username Field (Login/Signup only) */}
          <div className={`relative group transition-all duration-300 ${isForgot ? 'hidden' : 'block'}`}>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#1e293b] rounded-lg text-slate-200 px-4 py-3 pr-10 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder-transparent peer border border-transparent focus:border-cyan-500/30"
              placeholder="Username"
              id="username"
            />
            <label 
                htmlFor="username" 
                className={`absolute left-4 transition-all duration-300 pointer-events-none ${
                    username 
                    ? '-top-2.5 bg-[#0f172a] px-1 text-xs text-cyan-500' 
                    : 'top-3.5 text-slate-500 peer-focus:-top-2.5 peer-focus:bg-[#0f172a] peer-focus:px-1 peer-focus:text-xs peer-focus:text-cyan-500'
                }`}
            >
              Username
            </label>
            <Icon name="Person" className={`absolute right-3 top-3.5 w-5 h-5 transition-colors duration-300 ${username ? 'text-cyan-500' : 'text-slate-600'}`} />
          </div>

          {/* Email Field (Sign Up and Forgot Password) */}
          <div className={`relative group transition-all duration-500 overflow-hidden ${isLogin ? 'max-h-0 opacity-0 mb-0' : 'max-h-24 opacity-100'}`}>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#1e293b] rounded-lg text-slate-200 px-4 py-3 pr-10 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder-transparent peer border border-transparent focus:border-cyan-500/30"
              placeholder="Email"
              id="email"
            />
            <label 
                htmlFor="email" 
                className={`absolute left-4 transition-all duration-300 pointer-events-none ${
                    email 
                    ? '-top-2.5 bg-[#0f172a] px-1 text-xs text-cyan-500' 
                    : 'top-3.5 text-slate-500 peer-focus:-top-2.5 peer-focus:bg-[#0f172a] peer-focus:px-1 peer-focus:text-xs peer-focus:text-cyan-500'
                }`}
            >
              Email
            </label>
            <Icon name="Contact" className={`absolute right-3 top-3.5 w-5 h-5 transition-colors duration-300 ${email ? 'text-cyan-500' : 'text-slate-600'}`} />
          </div>

          {/* Password Field (Login/Signup only) */}
          <div className={`relative group transition-all duration-300 ${isForgot ? 'hidden' : 'block'}`}>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1e293b] rounded-lg text-slate-200 px-4 py-3 pr-10 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder-transparent peer border border-transparent focus:border-cyan-500/30"
              placeholder="Password"
              id="password"
            />
            <label 
                htmlFor="password" 
                className={`absolute left-4 transition-all duration-300 pointer-events-none ${
                    password 
                    ? '-top-2.5 bg-[#0f172a] px-1 text-xs text-cyan-500' 
                    : 'top-3.5 text-slate-500 peer-focus:-top-2.5 peer-focus:bg-[#0f172a] peer-focus:px-1 peer-focus:text-xs peer-focus:text-cyan-500'
                }`}
            >
              Password
            </label>
            <Icon name="Lock" className={`absolute right-3 top-3.5 w-5 h-5 transition-colors duration-300 ${password ? 'text-cyan-500' : 'text-slate-600'}`} />
          </div>

          {/* Options Row (Login Only) */}
          <div className={`flex items-center justify-between text-xs text-slate-400 mt-2 px-1 transition-all duration-300 ${!isLogin ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100 h-auto'}`}>
            <label className="flex items-center cursor-pointer hover:text-slate-300 transition-colors">
              <input type="checkbox" className="mr-2 w-3 h-3 rounded bg-[#1e293b] border-slate-600 text-cyan-500 focus:ring-0 focus:ring-offset-0" />
              Remember me
            </label>
            <button 
                onClick={() => setAuthMode('forgot')}
                className="hover:text-cyan-400 transition-colors"
            >
                Forget Password?
            </button>
          </div>

          {/* Action Button */}
          <button 
            onClick={handleSubmit}
            className={`w-full py-3.5 rounded-xl font-bold tracking-wide shadow-lg transition-all duration-300 mt-8 ${
              isFormValid 
                ? 'bg-gradient-to-r from-[#00b4d8] to-[#0077b6] text-white shadow-cyan-500/30 hover:shadow-cyan-500/50 transform hover:-translate-y-0.5' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
            }`}
            disabled={!isFormValid}
          >
            {isLogin ? 'Login' : isSignup ? 'Sign Up' : 'Send Reset Link'}
          </button>

          {/* Toggle Mode */}
          {!isForgot && (
              <div className="text-center mt-8 text-xs text-slate-500">
                {isLogin ? "Don't have an Account?" : "Already have an Account?"} 
                <button 
                    onClick={() => setAuthMode(isLogin ? 'signup' : 'login')}
                    className="text-slate-300 hover:text-cyan-400 font-medium ml-1 transition-colors outline-none"
                >
                    {isLogin ? 'Sign up' : 'Login'}
                </button>
              </div>
          )}
          
          {isForgot && (
               <div className="text-center mt-8 text-xs text-slate-500">
                   Remembered your password?
                   <button 
                        onClick={() => setAuthMode('login')}
                        className="text-slate-300 hover:text-cyan-400 font-medium ml-1 transition-colors outline-none"
                    >
                        Log In
                    </button>
               </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default LoginInterface;