
import React, { useState } from 'react';
import { User, UserReport } from '../types';
import { Icon } from './Icons';
import { dataService } from '../services/dataService';

interface ReportFormProps {
  currentUser: User | null;
}

const ReportForm: React.FC<ReportFormProps> = ({ currentUser }) => {
  const [reportType, setReportType] = useState<UserReport['type']>('Bug');
  const [relatedId, setRelatedId] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);

    setTimeout(() => {
      dataService.saveReport({
        userId: currentUser?.id,
        type: reportType,
        relatedId: relatedId || undefined,
        description
      });
      
      setIsSubmitting(false);
      setIsSuccess(true);
      setDescription('');
      setRelatedId('');
      setReportType('Bug');

      setTimeout(() => setIsSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div className="h-full w-full flex items-center justify-center p-10 bg-[#050505] relative overflow-hidden scrollbar-hide">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-red-500/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-purple-500/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-2xl relative z-10 animate-fade-in">
        
        {/* Header */}
        <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6">
               <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></div>
               <span className="text-[10px] font-mono text-red-400 uppercase tracking-widest">Neural Moderation Active</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase leading-none mb-6">
               Report <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/40">Issue</span>
            </h1>
            <p className="text-slate-400 text-lg font-medium max-w-md mx-auto leading-relaxed">
               Encountered a bug or inappropriate content? Help us maintain the integrity of our neural network.
            </p>
        </div>

        {/* Card */}
        <div className="bg-black border border-white/10 rounded-[2.5rem] p-10 md:p-14 shadow-2xl backdrop-blur-3xl relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500/20 to-purple-500/20 rounded-[2.5rem] blur-xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          
          {isSuccess ? (
            <div className="py-12 flex flex-col items-center justify-center text-center animate-fade-in">
              <div className="w-20 h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-8 text-blue-400 border border-blue-500/20">
                 <Icon name="Check" className="w-10 h-10" />
              </div>
              <h3 className="text-3xl font-black text-white tracking-tighter uppercase mb-4">Report Synced</h3>
              <p className="text-slate-400 max-w-xs mx-auto text-sm leading-relaxed">
                 Your report has been successfully transmitted to our moderation core. We will review it shortly.
              </p>
              <button 
                onClick={() => setIsSuccess(false)}
                className="mt-10 px-8 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-400 transition-all duration-500"
              >
                New Report
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
              
              {/* Report Type */}
              <div className="space-y-4">
                <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest ml-1">Classification</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {['Bug', 'Content', 'Copyright', 'Other'].map((type) => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => setReportType(type as any)}
                            className={`py-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all duration-500 ${
                                reportType === type 
                                ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20' 
                                : 'bg-white/[0.03] border-white/5 text-slate-500 hover:text-white hover:border-white/20'
                            }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
              </div>

              {/* Related ID/URL (Optional) */}
              <div className="space-y-4">
                <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest ml-1">Asset Reference (Optional)</label>
                <input
                    type="text"
                    value={relatedId}
                    onChange={(e) => setRelatedId(e.target.value)}
                    placeholder="e.g. Post ID #123 or URL"
                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/30 transition-all"
                  />
              </div>

              {/* Description */}
              <div className="space-y-4">
                <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest ml-1">Neural Narrative</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please describe the issue in detail..."
                  rows={4}
                  className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/30 transition-all resize-none font-medium"
                  required
                ></textarea>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] transition-all duration-700 shadow-2xl bg-white text-black hover:bg-red-400 shadow-white/5 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-600 border-t-black rounded-full animate-spin"></div>
                    Syncing...
                  </>
                ) : (
                  <>
                    <Icon name="Report" className="w-4 h-4" />
                    Initialize Report
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

export default ReportForm;
