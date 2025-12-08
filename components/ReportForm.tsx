
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
    <div className="h-full w-full flex items-center justify-center p-6 bg-slate-900 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[20%] left-[10%] w-[400px] h-[400px] bg-purple-600/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-lg relative z-10">
        
        {/* Header */}
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Report an Issue</h1>
            <p className="text-slate-400">Help us improve Nebula by reporting bugs or inappropriate content.</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-3xl p-8 shadow-2xl">
          
          {isSuccess ? (
            <div className="py-12 flex flex-col items-center justify-center text-center animate-fade-in-up">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 text-blue-400 border border-blue-500/20">
                 <Icon name="Check" className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Report Submitted</h3>
              <p className="text-slate-400 max-w-xs">Our team will review your report shortly. Thank you for your feedback.</p>
              <button 
                onClick={() => setIsSuccess(false)}
                className="mt-6 text-sm text-cyan-400 hover:text-cyan-300 font-medium"
              >
                Submit another report
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Report Type */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-300">Report Type</label>
                <div className="grid grid-cols-2 gap-3">
                    {['Bug', 'Inappropriate Content', 'Copyright', 'Other'].map((type) => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => setReportType(type as any)}
                            className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                                reportType === type 
                                ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400' 
                                : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:bg-slate-800'
                            }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
              </div>

              {/* Related ID/URL (Optional) */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">Related URL or ID (Optional)</label>
                <input
                    type="text"
                    value={relatedId}
                    onChange={(e) => setRelatedId(e.target.value)}
                    placeholder="e.g. Post ID #123 or URL"
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder-slate-600"
                  />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please describe the issue in detail..."
                  rows={4}
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder-slate-600 resize-none"
                  required
                ></textarea>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl font-bold tracking-wide shadow-lg shadow-red-500/10 bg-gradient-to-r from-red-600/80 to-purple-600/80 text-white hover:from-red-500 hover:to-purple-500 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Icon name="Report" className="w-4 h-4" />
                    Submit Report
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
