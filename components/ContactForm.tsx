
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
    <div className="h-full w-full flex items-center justify-center p-6 bg-slate-900 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-cyan-600/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-lg relative z-10">
        
        {/* Header Text */}
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Get in Touch</h1>
            <p className="text-slate-400">We'd love to hear from you. Send us a message.</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-3xl p-8 shadow-2xl">
          
          {isSuccess ? (
            <div className="py-12 flex flex-col items-center justify-center text-center animate-fade-in-up">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 text-emerald-400 border border-emerald-500/20">
                 <Icon name="Check" className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Message Sent!</h3>
              <p className="text-slate-400 max-w-xs">Thank you for reaching out. We will get back to you shortly.</p>
              <button 
                onClick={() => setIsSuccess(false)}
                className="mt-6 text-sm text-cyan-400 hover:text-cyan-300 font-medium"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Name Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">Your Name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!!currentUser} // Read only if logged in
                    placeholder="John Doe"
                    className={`w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder-slate-600 ${currentUser ? 'opacity-70 cursor-not-allowed' : ''}`}
                    required
                  />
                  <div className="absolute right-3 top-3.5 text-slate-500">
                    <Icon name="Person" className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Subject Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">Subject</label>
                <div className="relative">
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all appearance-none cursor-pointer"
                  >
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Collaboration">Collaboration</option>
                    <option value="Technical Support">Technical Support</option>
                    <option value="Feedback">Feedback</option>
                  </select>
                  <div className="absolute right-4 top-4 text-slate-500 pointer-events-none">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                  </div>
                </div>
              </div>

              {/* Message Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we help you today?"
                  rows={4}
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder-slate-600 resize-none"
                  required
                ></textarea>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl font-bold tracking-wide shadow-lg shadow-cyan-500/20 bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Sending...
                  </>
                ) : (
                  <>
                    <Icon name="Send" className="w-4 h-4" />
                    Send Message
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
