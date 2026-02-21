
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Icon } from './Icons';
import { dataService } from '../services/dataService';

interface ContactFormProps {
  currentUser: User | null;
}

const ContactForm: React.FC<ContactFormProps> = ({ currentUser }) => {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('General Inquiry');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.username);
    }
  }, [currentUser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !name.trim()) return;

    setIsSubmitting(true);

    // Simulate network delay for effect
    setTimeout(() => {
      dataService.saveContactMessage({
        userId: currentUser?.id,
        userName: name,
        subject,
        message
      });
      
      setIsSubmitting(false);
      setIsSuccess(true);
      setMessage('');
      if (!currentUser) setName('');
      
      // Reset success message after a few seconds
      setTimeout(() => setIsSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div className="h-full w-full flex items-center justify-center p-10 bg-[#050505] relative overflow-hidden scrollbar-hide">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-cyan-500/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-500/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-2xl relative z-10 animate-fade-in">
        
        {/* Header Text */}
        <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6">
               <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
               <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">Neural Support Active</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase leading-none mb-6">
               Get in <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/40">Touch</span>
            </h1>
            <p className="text-slate-400 text-lg font-medium max-w-md mx-auto leading-relaxed">
               Have a question or feedback? Our neural network is ready to process your transmission.
            </p>
        </div>

        {/* Card - Next Gen Minimalist */}
        <div className="bg-black border border-white/10 rounded-[2.5rem] p-10 md:p-14 shadow-2xl backdrop-blur-3xl relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-[2.5rem] blur-xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          
          {isSuccess ? (
            <div className="py-12 flex flex-col items-center justify-center text-center animate-fade-in">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-8 text-emerald-400 border border-emerald-500/20">
                 <Icon name="Check" className="w-10 h-10" />
              </div>
              <h3 className="text-3xl font-black text-white tracking-tighter uppercase mb-4">Transmission Received</h3>
              <p className="text-slate-400 max-w-xs mx-auto text-sm leading-relaxed">
                 Your message has been successfully synced with our core. We will respond shortly.
              </p>
              <button 
                onClick={() => setIsSuccess(false)}
                className="mt-10 px-8 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-cyan-400 transition-all duration-500"
              >
                New Transmission
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Name Field */}
                <div className="space-y-4">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest ml-1">Identity</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={!!currentUser}
                      placeholder="John Doe"
                      className={`w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/30 transition-all ${currentUser ? 'opacity-50 cursor-not-allowed' : ''}`}
                      required
                    />
                  </div>
                </div>

                {/* Subject Field */}
                <div className="space-y-4">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest ml-1">Directive</label>
                  <div className="relative">
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/30 transition-all appearance-none cursor-pointer"
                    >
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Collaboration">Collaboration</option>
                      <option value="Technical Support">Technical Support</option>
                      <option value="Feedback">Feedback</option>
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                      <Icon name="ChevronDown" className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Message Field */}
              <div className="space-y-4">
                <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest ml-1">Neural Data</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we help you today?"
                  rows={5}
                  className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/30 transition-all resize-none font-medium"
                  required
                ></textarea>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] transition-all duration-700 shadow-2xl bg-white text-black hover:bg-cyan-400 shadow-white/5 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-600 border-t-black rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Icon name="Send" className="w-4 h-4" />
                    Sync Transmission
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactForm;
