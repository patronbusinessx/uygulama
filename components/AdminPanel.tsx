
import React, { useState, useEffect, useRef } from 'react';
import { User, Post, ContactMessage, UserReport } from '../types';
import { authService } from '../services/authService';
import { postService } from '../services/postService';
import { dataService } from '../services/dataService';
import { generateImageFromText, analyzeImageForGeneration } from '../services/geminiService';
import { Icon } from './Icons';

interface AdminPanelProps {
  currentUser: User;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'content' | 'inbox' | 'exclusive'>('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [reports, setReports] = useState<UserReport[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Exclusive Generator States
  const [exclusivePrompt, setExclusivePrompt] = useState('');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [exclusiveImage, setExclusiveImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'success'>('idle');
  
  // Resolution State for Pro Model
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUsers(authService.getUsers());
    setPosts(postService.getAllPosts());
    setMessages(dataService.getAllMessages());
    setReports(dataService.getAllReports());
  }, [refreshTrigger]);

  const handleBanUser = (userId: string, currentStatus: boolean | undefined) => {
    if (confirm(`Are you sure you want to ${currentStatus ? 'unban' : 'ban'} this user?`)) {
      authService.updateUserStatus(userId, !currentStatus);
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const handleChangeTier = (userId: string, newTier: string) => {
      authService.updateUserTier(userId, newTier as 'free' | 'pro');
      setRefreshTrigger(prev => prev + 1);
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm("Are you sure? This will remove the user permanently.")) {
      authService.deleteUser(userId);
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const handleDeletePost = (postId: string) => {
    if (confirm("Delete this post? This action cannot be undone.")) {
      postService.deletePost(postId);
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const handleReferenceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { 
        alert("Image size too large. Max 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateExclusive = async () => {
    if (!exclusivePrompt.trim()) return;
    setIsGenerating(true);
    setExclusiveImage(null);
    setShareStatus('idle');

    try {
        let modifiers = "masterpiece, best quality, cinematic lighting, hyper-realistic, trending on artstation, highly detailed, dramatic atmosphere, shot on 35mm lens, depth of field";
        
        let contextDescription = "";
        
        // 1. If reference image exists, analyze it first
        if (referenceImage) {
            contextDescription = await analyzeImageForGeneration(referenceImage);
            modifiers += `, heavily inspired by the visual style and composition of a reference image described as: ${contextDescription}`;
        }

        const enhancedPrompt = `${exclusivePrompt}. ${modifiers}`;
        
        // 2. Generate new image using the combined prompt
        const imageBase64 = await generateImageFromText(enhancedPrompt, { 
            aspectRatio: '1:1',
            model: 'gemini-3-pro-image-preview',
            imageSize: imageSize
        });
        
        setExclusiveImage(imageBase64);
    } catch (error) {
        console.error(error);
        alert("Generation failed. Please try again.");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleShareExclusive = () => {
      if (!exclusiveImage || !exclusivePrompt) return;

      postService.createPost({
          title: "Admin Exclusive: " + exclusivePrompt.substring(0, 20) + "...",
          description: referenceImage 
            ? `✨ Re-imagined from reference photo. Generated with NeuraFlow Pro Engine (${imageSize}).` 
            : `✨ Official Admin Creation. Generated with NeuraFlow Pro Engine (${imageSize}).`,
          prompt: exclusivePrompt,
          imageUrl: exclusiveImage,
          author: currentUser.username,
          authorId: currentUser.id
      });

      setShareStatus('success');
      setTimeout(() => {
          setExclusiveImage(null);
          setExclusivePrompt('');
          setReferenceImage(null);
          setShareStatus('idle');
          setActiveTab('content'); // Switch to content tab to see it
          setRefreshTrigger(prev => prev + 1);
      }, 1500);
  };

  const renderDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-fade-in">
      {[
        { label: 'Total Users', value: users.length, icon: 'Person', color: 'cyan' },
        { label: 'Total Posts', value: posts.length, icon: 'Image', color: 'purple' },
        { label: 'Pro Members', value: users.filter(u => u.membershipTier === 'pro').length, icon: 'Sparkles', color: 'yellow' },
        { label: 'Pending Reports', value: reports.filter(r => r.status === 'Pending').length, icon: 'Report', color: 'red' }
      ].map((stat, i) => (
        <div key={i} className="bg-white/[0.02] border border-white/5 p-8 rounded-[2rem] hover:bg-white/[0.04] transition-all duration-500 group">
          <div className="flex items-center justify-between mb-6">
            <div className={`p-4 rounded-2xl bg-${stat.color}-500/10 text-${stat.color}-400 group-hover:scale-110 transition-transform duration-500`}>
              <Icon name={stat.icon} className="w-6 h-6" />
            </div>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em]">{stat.label}</div>
          </div>
          <div className="text-4xl font-black text-white tracking-tighter uppercase">{stat.value}</div>
        </div>
      ))}
    </div>
  );

  const renderUsersTable = () => (
    <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-3xl">
       <div className="p-10 border-b border-white/5 flex items-center justify-between">
          <div className="flex flex-col">
             <span className="text-[10px] font-mono text-cyan-500 uppercase tracking-[0.3em] mb-1">Directory</span>
             <h3 className="text-3xl font-black text-white tracking-tighter uppercase">User Management</h3>
          </div>
          <div className="flex items-center gap-4">
             <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                {users.length} Identities
             </div>
          </div>
       </div>
       <div className="overflow-x-auto">
         <table className="w-full text-left text-sm text-slate-400">
           <thead className="bg-white/[0.02] text-slate-500 uppercase font-mono text-[10px] tracking-[0.2em]">
             <tr>
               <th className="px-10 py-6">Identity</th>
               <th className="px-10 py-6">Access Level</th>
               <th className="px-10 py-6">Tier</th>
               <th className="px-10 py-6">Status</th>
               <th className="px-10 py-6 text-right">Actions</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-white/5">
             {users.map(user => (
               <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                 <td className="px-10 py-6 flex items-center gap-4">
                    <div className="relative">
                       <img src={user.avatar} className="w-10 h-10 rounded-2xl object-cover bg-black border border-white/10" alt="" />
                       {user.membershipTier === 'pro' && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border-2 border-black shadow-lg"></div>
                       )}
                    </div>
                    <div>
                       <div className="font-bold text-white group-hover:text-cyan-400 transition-colors">{user.username}</div>
                       <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{user.email}</div>
                    </div>
                 </td>
                 <td className="px-10 py-6">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-mono uppercase tracking-widest ${user.role === 'admin' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-white/5 text-slate-500 border border-white/10'}`}>
                      {user.role}
                    </span>
                 </td>
                 <td className="px-10 py-6">
                    <select 
                        value={user.membershipTier || 'free'} 
                        onChange={(e) => handleChangeTier(user.id, e.target.value)}
                        className={`bg-black border border-white/10 rounded-xl px-4 py-2 text-[10px] font-mono uppercase tracking-widest focus:outline-none focus:border-cyan-500 transition-all ${
                            user.membershipTier === 'pro' ? 'text-yellow-400 border-yellow-500/30' : 'text-slate-500'
                        }`}
                        disabled={user.role === 'admin' && user.id === currentUser.id}
                    >
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                    </select>
                 </td>
                 <td className="px-10 py-6">
                    {user.isBanned ? (
                      <span className="text-red-400 text-[10px] font-mono uppercase tracking-widest flex items-center gap-2">
                         <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                         Banned
                      </span>
                    ) : (
                      <span className="text-emerald-400 text-[10px] font-mono uppercase tracking-widest flex items-center gap-2">
                         <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                         Active
                      </span>
                    )}
                 </td>
                 <td className="px-10 py-6 text-right">
                    {user.id !== currentUser.id && (
                        <div className="flex justify-end gap-3">
                             <button 
                                onClick={() => handleBanUser(user.id, user.isBanned)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-mono uppercase tracking-widest transition-all ${user.isBanned ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'}`}
                             >
                                {user.isBanned ? 'Restore' : 'Suspend'}
                             </button>
                             <button 
                                onClick={() => handleDeleteUser(user.id)}
                                className="p-3 bg-white/5 border border-white/10 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                             >
                                <Icon name="X" className="w-4 h-4" />
                             </button>
                        </div>
                    )}
                 </td>
               </tr>
             ))}
           </tbody>
         </table>
       </div>
    </div>
  );

  const renderContentFeed = () => (
    <div className="space-y-8">
       <div className="flex flex-col">
          <span className="text-[10px] font-mono text-purple-500 uppercase tracking-[0.3em] mb-1">Neural Stream</span>
          <h3 className="text-3xl font-black text-white tracking-tighter uppercase">Recent Content</h3>
       </div>
       <div className="grid grid-cols-1 gap-6">
         {posts.map(post => (
           <div key={post.id} className="bg-white/[0.02] border border-white/5 p-6 rounded-[2rem] flex flex-col md:flex-row gap-8 items-center hover:bg-white/[0.04] transition-all duration-500 group">
              <div className="relative w-full md:w-48 h-48 shrink-0 overflow-hidden rounded-2xl">
                 <img src={post.imageUrl} className="w-full h-full object-cover bg-black transition-transform duration-700 group-hover:scale-110" alt="" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              </div>
              <div className="flex-1 w-full">
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                       <h4 className="text-2xl font-black text-white tracking-tighter uppercase group-hover:text-purple-400 transition-colors">{post.title}</h4>
                       <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest">By {post.author}</span>
                          <div className="w-1 h-1 rounded-full bg-white/20"></div>
                          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{new Date(post.createdAt || Date.now()).toLocaleDateString()}</span>
                       </div>
                    </div>
                    <button 
                      onClick={() => handleDeletePost(post.id)}
                      className="px-6 py-3 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-mono uppercase tracking-widest rounded-xl hover:bg-red-500/20 transition-all"
                    >
                      Purge Asset
                    </button>
                 </div>
                 <p className="text-slate-400 text-sm leading-relaxed line-clamp-2 mb-6">{post.description || "No neural narrative provided."}</p>
                 <div className="bg-black/40 border border-white/5 p-4 rounded-xl text-[10px] text-slate-500 font-mono line-clamp-1 uppercase tracking-widest">
                    {post.prompt}
                 </div>
              </div>
           </div>
         ))}
       </div>
    </div>
  );

  const renderExclusiveGenerator = () => (
      <div className="bg-black border border-white/10 rounded-[3rem] shadow-2xl p-10 md:p-16 relative overflow-hidden group">
          {/* Gold Glow Effect */}
          <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none"></div>

          <div className="relative z-10 flex flex-col lg:flex-row gap-16">
              {/* Input Section */}
              <div className="flex-1 space-y-10">
                  <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 mb-6">
                         <div className="w-1 h-1 rounded-full bg-yellow-400 animate-pulse"></div>
                         <span className="text-[10px] font-mono text-yellow-400 uppercase tracking-[0.2em]">Admin Exclusive Engine</span>
                      </div>
                      <h2 className="text-5xl font-black text-white tracking-tighter uppercase leading-none mb-6">
                         Neural <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200">Architect</span>
                      </h2>
                      <p className="text-slate-400 text-lg font-medium leading-relaxed">
                         Dispatch the core neural engine to synthesize high-fidelity assets. Use reference data for style transfer or direct directives for raw synthesis.
                      </p>
                  </div>

                  {/* Reference Image Upload */}
                  <div className="space-y-4">
                     <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest ml-1">Visual Reference</label>
                     <input 
                       type="file" 
                       ref={fileInputRef}
                       onChange={handleReferenceImageUpload}
                       className="hidden" 
                       accept="image/*"
                     />
                     
                     {!referenceImage ? (
                       <div 
                         onClick={() => fileInputRef.current?.click()}
                         className="w-full h-24 border border-dashed border-white/10 rounded-3xl bg-white/[0.02] flex items-center justify-center gap-4 cursor-pointer hover:bg-white/[0.04] hover:border-white/20 transition-all group/upload"
                       >
                          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-slate-400 group-hover/upload:scale-110 group-hover/upload:text-white transition-all duration-500">
                             <Icon name="UploadCloud" className="w-6 h-6" />
                          </div>
                          <div className="flex flex-col">
                             <span className="text-white font-black text-xs uppercase tracking-widest">Inject Reference</span>
                             <span className="text-slate-500 text-[10px] font-mono uppercase tracking-widest mt-1">Optional Visual Context</span>
                          </div>
                       </div>
                     ) : (
                       <div className="relative w-full h-24 bg-white/[0.02] border border-white/10 rounded-3xl overflow-hidden flex items-center justify-between px-6">
                          <div className="flex items-center gap-4">
                             <img src={referenceImage} alt="Reference" className="w-12 h-12 object-cover rounded-xl border border-white/10" />
                             <div className="flex flex-col">
                                <span className="text-yellow-400 font-black text-xs uppercase tracking-widest">Reference Synced</span>
                                <span className="text-slate-500 text-[10px] font-mono uppercase tracking-widest mt-1">Visual Data Ready</span>
                             </div>
                          </div>
                          <button 
                            onClick={() => { setReferenceImage(null); if(fileInputRef.current) fileInputRef.current.value = ''; }}
                            className="p-3 bg-white/5 border border-white/10 rounded-xl text-slate-500 hover:text-red-400 transition-all"
                          >
                             <Icon name="X" className="w-4 h-4" />
                          </button>
                       </div>
                     )}
                  </div>

                   {/* Resolution Selector */}
                   <div className="space-y-4">
                      <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest ml-1">Synthesis Resolution</label>
                      <div className="flex gap-4">
                          {['1K', '2K', '4K'].map((size) => (
                              <button
                                  key={size}
                                  onClick={() => setImageSize(size as any)}
                                  className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all duration-500 ${
                                      imageSize === size
                                      ? 'bg-yellow-500 text-black border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.3)]'
                                      : 'bg-white/5 border-white/5 text-slate-500 hover:text-white hover:border-white/20'
                                  }`}
                              >
                                  {size}
                              </button>
                          ))}
                      </div>
                  </div>

                  <div className="space-y-4">
                      <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest ml-1">Neural Directive</label>
                      <textarea 
                          value={exclusivePrompt}
                          onChange={(e) => setExclusivePrompt(e.target.value)}
                          placeholder="Enter neural parameters..."
                          rows={4}
                          className="w-full bg-white/[0.02] border border-white/10 rounded-[2rem] p-8 text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500/30 transition-all resize-none font-medium"
                      />
                  </div>

                  <button 
                      onClick={handleGenerateExclusive}
                      disabled={isGenerating || !exclusivePrompt}
                      className={`w-full py-6 rounded-2xl font-black uppercase tracking-[0.3em] text-xs transition-all duration-700 ${
                          isGenerating 
                          ? 'bg-white/5 text-slate-600 cursor-wait' 
                          : 'bg-white text-black hover:bg-yellow-400 shadow-2xl shadow-white/5 transform hover:-translate-y-1'
                      }`}
                  >
                      {isGenerating ? (
                        <span className="flex items-center justify-center gap-4">
                             <div className="w-4 h-4 border-2 border-slate-600 border-t-white rounded-full animate-spin"></div>
                             Synthesizing Asset...
                        </span>
                    ) : (
                        'Initialize Synthesis'
                    )}
                  </button>
              </div>

              {/* Preview Section */}
              <div className="flex-1 w-full bg-white/[0.02] rounded-[3rem] border border-white/5 flex items-center justify-center min-h-[500px] relative group overflow-hidden backdrop-blur-3xl">
                  {exclusiveImage ? (
                      <>
                          <img src={exclusiveImage} alt="Exclusive" className="w-full h-full object-contain p-10" />
                          <div className="absolute top-10 right-10 bg-yellow-500 text-black text-[10px] font-black px-4 py-2 rounded-full shadow-2xl tracking-tighter">
                              {imageSize} • CORE ENGINE
                          </div>
                          <div className="absolute bottom-10 left-0 w-full p-10 bg-gradient-to-t from-black via-black/80 to-transparent flex justify-center">
                              <button 
                                  onClick={handleShareExclusive}
                                  disabled={shareStatus === 'success'}
                                  className={`px-10 py-5 rounded-full font-black uppercase tracking-widest text-xs transition-all duration-700 shadow-2xl ${
                                      shareStatus === 'success'
                                      ? 'bg-emerald-500 text-white'
                                      : 'bg-white text-black hover:bg-cyan-400 shadow-white/20 transform hover:-translate-y-1'
                                  }`}
                              >
                                  {shareStatus === 'success' ? (
                                      <span className="flex items-center gap-3">
                                          <Icon name="Check" className="w-5 h-5" />
                                          Asset Synced
                                      </span>
                                  ) : (
                                      <span className="flex items-center gap-3">
                                          <Icon name="UploadCloud" className="w-5 h-5" />
                                          Sync to Public Stream
                                      </span>
                                  )}
                              </button>
                          </div>
                      </>
                  ) : (
                      <div className="text-center p-10">
                          <Icon name="Image" className="w-20 h-20 mx-auto mb-6 text-slate-800 animate-pulse" />
                          <p className="text-[10px] font-mono text-slate-700 uppercase tracking-[0.4em]">Awaiting Directives</p>
                      </div>
                  )}
              </div>
          </div>
      </div>
  );

  const renderInbox = () => (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* User Reports */}
          <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col h-[700px] backdrop-blur-3xl">
              <div className="p-10 border-b border-white/5 bg-red-500/[0.02]">
                  <div className="flex items-center justify-between">
                     <div className="flex flex-col">
                        <span className="text-[10px] font-mono text-red-500 uppercase tracking-[0.3em] mb-1">Moderation</span>
                        <h3 className="text-2xl font-black text-white tracking-tighter uppercase">User Reports</h3>
                     </div>
                     <div className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-[10px] font-mono text-red-400 uppercase tracking-widest">
                        {reports.length} Alerts
                     </div>
                  </div>
              </div>
              <div className="overflow-y-auto p-8 space-y-6 flex-1 scrollbar-hide">
                  {reports.length === 0 && <p className="text-slate-600 text-center py-20 font-mono text-[10px] uppercase tracking-widest">No pending reports.</p>}
                  {reports.map(report => (
                      <div key={report.id} className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl hover:bg-white/[0.04] transition-all duration-500">
                          <div className="flex justify-between items-start mb-6">
                              <span className="px-3 py-1 rounded-lg text-[10px] uppercase font-mono tracking-widest bg-red-500/10 text-red-400 border border-red-500/20">{report.type}</span>
                              <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">{new Date(report.timestamp).toLocaleDateString()}</span>
                          </div>
                          <p className="text-slate-300 text-sm leading-relaxed mb-6 font-medium">"{report.description}"</p>
                          {report.relatedId && (
                             <div className="flex items-center gap-3 pt-6 border-t border-white/5">
                                <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">Reference:</span>
                                <span className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest truncate max-w-[200px]">{report.relatedId}</span>
                             </div>
                          )}
                      </div>
                  ))}
              </div>
          </div>

          {/* Contact Messages */}
          <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col h-[700px] backdrop-blur-3xl">
              <div className="p-10 border-b border-white/5 bg-cyan-500/[0.02]">
                  <div className="flex items-center justify-between">
                     <div className="flex flex-col">
                        <span className="text-[10px] font-mono text-cyan-500 uppercase tracking-[0.3em] mb-1">Communications</span>
                        <h3 className="text-2xl font-black text-white tracking-tighter uppercase">Inbox</h3>
                     </div>
                     <div className="px-4 py-2 rounded-xl bg-cyan-500/10 border border-white/10 text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
                        {messages.length} Transmissions
                     </div>
                  </div>
              </div>
              <div className="overflow-y-auto p-8 space-y-6 flex-1 scrollbar-hide">
                  {messages.length === 0 && <p className="text-slate-600 text-center py-20 font-mono text-[10px] uppercase tracking-widest">No active transmissions.</p>}
                  {messages.map(msg => (
                      <div key={msg.id} className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl hover:bg-white/[0.04] transition-all duration-500">
                           <div className="flex justify-between items-start mb-4">
                              <h4 className="text-white font-black text-lg tracking-tighter uppercase">{msg.userName}</h4>
                              <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">{new Date(msg.timestamp).toLocaleDateString()}</span>
                           </div>
                           <p className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest mb-6">{msg.subject}</p>
                           <div className="bg-black/40 border border-white/5 p-6 rounded-2xl">
                              <p className="text-slate-400 text-sm leading-relaxed font-medium italic">"{msg.message}"</p>
                           </div>
                      </div>
                  ))}
              </div>
          </div>
      </div>
  );

  return (
    <div className="p-10 md:p-20 h-full overflow-y-auto bg-[#050505] scrollbar-hide relative">
      {/* Background Glows */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/5 rounded-full blur-[120px]"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row items-end justify-between mb-16 gap-8">
            <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6">
                   <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
                   <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">Admin Authorization Active</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase leading-none mb-6">
                   Command <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/40">Center</span>
                </h1>
                <p className="text-slate-400 text-lg font-medium leading-relaxed">
                   High-level system oversight and neural asset management. Monitor network health, identity directory, and exclusive synthesis engines.
                </p>
            </div>
            <div className="flex bg-white/[0.03] border border-white/5 p-2 rounded-2xl backdrop-blur-3xl overflow-x-auto w-full lg:w-auto scrollbar-hide">
                {[
                  { id: 'dashboard', label: 'Overview' },
                  { id: 'users', label: 'Identities' },
                  { id: 'content', label: 'Neural Stream' },
                  { id: 'inbox', label: 'Transmissions' },
                  { id: 'exclusive', label: 'Core Engine', icon: 'Sparkles' }
                ].map((tab) => (
                  <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 whitespace-nowrap ${
                      activeTab === tab.id 
                        ? tab.id === 'exclusive' ? 'bg-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.3)]' : 'bg-white text-black shadow-xl shadow-white/5' 
                        : tab.id === 'exclusive' ? 'text-yellow-500/50 hover:text-yellow-400' : 'text-slate-500 hover:text-white'
                    }`}
                  >
                    {tab.icon && <Icon name={tab.icon as any} className="w-3 h-3" />}
                    {tab.label}
                  </button>
                ))}
            </div>
        </div>

        <div className="min-h-[600px] pb-20">
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'users' && renderUsersTable()}
            {activeTab === 'content' && renderContentFeed()}
            {activeTab === 'inbox' && renderInbox()}
            {activeTab === 'exclusive' && renderExclusiveGenerator()}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
