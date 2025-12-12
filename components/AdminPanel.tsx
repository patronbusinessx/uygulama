
import React, { useState, useEffect } from 'react';
import { User, Post, ContactMessage, UserReport } from '../types';
import { authService } from '../services/authService';
import { postService } from '../services/postService';
import { dataService } from '../services/dataService';
import { generateImageFromText } from '../services/geminiService';
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
  const [targetUrl, setTargetUrl] = useState(''); 
  const [exclusiveImage, setExclusiveImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'success'>('idle');
  
  // Resolution State for Pro Model
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');

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

  const handleGenerateExclusive = async () => {
    if (!exclusivePrompt.trim()) return;
    setIsGenerating(true);
    setExclusiveImage(null);
    setShareStatus('idle');

    try {
        // Enforce a high-quality "Instagram-like" aesthetic
        // If a URL is provided, we simulate a "virtual photography" session at that location
        let modifiers = "masterpiece, best quality, cinematic lighting, hyper-realistic, trending on artstation, highly detailed, dramatic atmosphere, shot on 35mm lens, depth of field";
        
        if (targetUrl) {
            modifiers += ", digital capture, inspired by virtual environment, cyber-photography style";
        }

        const enhancedPrompt = `${exclusivePrompt}, ${modifiers}`;
        
        // Use gemini-3-pro-image-preview for high fidelity and resolution control
        const imageBase64 = await generateImageFromText(enhancedPrompt, { 
            aspectRatio: '1:1',
            model: 'gemini-3-pro-image-preview',
            imageSize: imageSize
        });
        
        setExclusiveImage(imageBase64);
    } catch (error) {
        alert("Generation failed. Please try again.");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleShareExclusive = () => {
      if (!exclusiveImage || !exclusivePrompt) return;

      postService.createPost({
          title: "Admin Exclusive: " + exclusivePrompt.substring(0, 20) + "...",
          description: targetUrl ? `📸 Virtual Capture from: ${targetUrl} [${imageSize} Resolution]` : `✨ Official Admin Creation. Generated with NeuraFlow Pro Engine (${imageSize}).`,
          prompt: exclusivePrompt,
          imageUrl: exclusiveImage,
          author: currentUser.username,
          authorId: currentUser.id
      });

      setShareStatus('success');
      setTimeout(() => {
          setExclusiveImage(null);
          setExclusivePrompt('');
          setTargetUrl('');
          setShareStatus('idle');
          setActiveTab('content'); // Switch to content tab to see it
          setRefreshTrigger(prev => prev + 1);
      }, 1500);
  };

  const renderDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-fade-in">
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
             <Icon name="Person" className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-slate-400 text-sm font-medium">Total Users</h3>
            <p className="text-3xl font-bold text-white">{users.length}</p>
          </div>
        </div>
      </div>
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400">
             <Icon name="Image" className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-slate-400 text-sm font-medium">Total Posts</h3>
            <p className="text-3xl font-bold text-white">{posts.length}</p>
          </div>
        </div>
      </div>
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-yellow-500/20 rounded-xl text-yellow-400">
             <Icon name="Sparkles" className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-slate-400 text-sm font-medium">Pro Members</h3>
            <p className="text-3xl font-bold text-white">{users.filter(u => u.membershipTier === 'pro').length}</p>
          </div>
        </div>
      </div>
       <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-500/20 rounded-xl text-red-400">
             <Icon name="Report" className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-slate-400 text-sm font-medium">Reports</h3>
            <p className="text-3xl font-bold text-white">{reports.filter(r => r.status === 'Pending').length}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsersTable = () => (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
       <div className="p-6 border-b border-slate-700">
          <h3 className="text-xl font-bold text-white">User Management</h3>
       </div>
       <div className="overflow-x-auto">
         <table className="w-full text-left text-sm text-slate-400">
           <thead className="bg-slate-900/50 text-slate-200 uppercase font-medium">
             <tr>
               <th className="px-6 py-4">User</th>
               <th className="px-6 py-4">Role</th>
               <th className="px-6 py-4">Membership</th>
               <th className="px-6 py-4">Status</th>
               <th className="px-6 py-4 text-right">Actions</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-slate-700">
             {users.map(user => (
               <tr key={user.id} className="hover:bg-slate-700/30 transition-colors">
                 <td className="px-6 py-4 flex items-center gap-3">
                   <img src={user.avatar} className="w-8 h-8 rounded-full" alt="" />
                   <div>
                      <div className="font-medium text-white flex items-center gap-2">
                          {user.username}
                          {user.membershipTier === 'pro' && (
                              <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-500/30 font-bold">PRO</span>
                          )}
                      </div>
                      <div className="text-xs">{user.email}</div>
                   </div>
                 </td>
                 <td className="px-6 py-4">
                   <span className={`px-2 py-1 rounded text-xs font-bold ${user.role === 'admin' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-slate-700 text-slate-300'}`}>
                     {user.role.toUpperCase()}
                   </span>
                 </td>
                 <td className="px-6 py-4">
                    <select 
                        value={user.membershipTier || 'free'} 
                        onChange={(e) => handleChangeTier(user.id, e.target.value)}
                        className={`bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs font-medium focus:outline-none focus:border-cyan-500 ${
                            user.membershipTier === 'pro' ? 'text-yellow-400 border-yellow-500/30' : 'text-slate-300'
                        }`}
                        disabled={user.role === 'admin' && user.id === currentUser.id} // Prevent admin from demoting themselves easily
                    >
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                    </select>
                 </td>
                 <td className="px-6 py-4">
                   {user.isBanned ? (
                     <span className="text-red-400 font-medium flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-full"></span> Banned</span>
                   ) : (
                     <span className="text-emerald-400 font-medium flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-full"></span> Active</span>
                   )}
                 </td>
                 <td className="px-6 py-4 text-right">
                    {user.id !== currentUser.id && (
                        <div className="flex justify-end gap-2">
                             <button 
                               onClick={() => handleBanUser(user.id, user.isBanned)}
                               className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${user.isBanned ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'}`}
                             >
                               {user.isBanned ? 'Unban' : 'Ban'}
                             </button>
                             <button 
                                onClick={() => handleDeleteUser(user.id)}
                                className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                                title="Delete User"
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
    <div className="space-y-4">
       <h3 className="text-xl font-bold text-white mb-6">Recent Content</h3>
       <div className="grid grid-cols-1 gap-4">
         {posts.map(post => (
           <div key={post.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex gap-4 items-start">
              <img src={post.imageUrl} className="w-24 h-24 rounded-lg object-cover bg-slate-900" alt="" />
              <div className="flex-1">
                 <div className="flex justify-between items-start">
                    <h4 className="font-bold text-white">{post.title}</h4>
                    <button 
                      onClick={() => handleDeletePost(post.id)}
                      className="text-red-400 hover:text-red-300 text-xs bg-red-500/10 px-2 py-1 rounded"
                    >
                      Delete Post
                    </button>
                 </div>
                 <p className="text-xs text-cyan-400 mt-1">By {post.author}</p>
                 <p className="text-sm text-slate-300 mt-2 line-clamp-2">{post.description || "No description provided."}</p>
                 <div className="mt-2 bg-slate-900/50 p-2 rounded text-xs text-slate-500 font-mono line-clamp-1">
                    {post.prompt}
                 </div>
              </div>
           </div>
         ))}
       </div>
    </div>
  );

  const renderExclusiveGenerator = () => (
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.1)] p-8 relative overflow-hidden">
          {/* Gold Glow Effect */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row gap-8">
              {/* Input Section */}
              <div className="flex-1 space-y-6">
                  <div>
                      <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                          <Icon name="Image" className="w-6 h-6 text-yellow-400" />
                          <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200">AI Virtual Photographer</span>
                      </h2>
                      <p className="text-slate-400 mt-2 text-sm">
                          Dispatch an AI agent to a virtual location or URL to capture high-fidelity shots.
                      </p>
                  </div>

                  {/* URL Input */}
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-yellow-500/80 uppercase tracking-widest">Target Location (URL)</label>
                     <div className="relative">
                        <input 
                            type="text"
                            value={targetUrl}
                            onChange={(e) => setTargetUrl(e.target.value)}
                            placeholder="https://instagram.com/..."
                            className="w-full bg-black/40 border border-yellow-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/50 placeholder-slate-600 font-mono text-sm"
                        />
                        <div className="absolute right-3 top-3 text-yellow-500/50">
                            <Icon name="Explore" className="w-5 h-5" />
                        </div>
                     </div>
                  </div>

                   {/* Resolution Selector (Admin Exclusive Feature) */}
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-yellow-500/80 uppercase tracking-widest">Output Resolution</label>
                      <div className="flex gap-2">
                          {['1K', '2K', '4K'].map((size) => (
                              <button
                                  key={size}
                                  onClick={() => setImageSize(size as any)}
                                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                                      imageSize === size
                                      ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.3)]'
                                      : 'bg-black/40 border-slate-700 text-slate-500 hover:text-white hover:border-slate-500'
                                  }`}
                              >
                                  {size}
                              </button>
                          ))}
                      </div>
                  </div>

                  <div className="space-y-2">
                      <label className="text-xs font-bold text-yellow-500/80 uppercase tracking-widest">Scene Directive</label>
                      <textarea 
                          value={exclusivePrompt}
                          onChange={(e) => setExclusivePrompt(e.target.value)}
                          placeholder="Describe the shot to capture (e.g., A futuristic golden city...)"
                          rows={3}
                          className="w-full bg-black/40 border border-yellow-500/30 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/50 placeholder-slate-600 resize-none font-medium"
                      />
                  </div>

                  <button 
                      onClick={handleGenerateExclusive}
                      disabled={isGenerating || !exclusivePrompt}
                      className={`w-full py-4 rounded-xl font-bold text-black uppercase tracking-widest transition-all ${
                          isGenerating 
                          ? 'bg-slate-700 cursor-wait' 
                          : 'bg-gradient-to-r from-yellow-500 to-yellow-300 hover:from-yellow-400 hover:to-yellow-200 shadow-lg shadow-yellow-500/20 hover:scale-[1.02]'
                      }`}
                  >
                      {isGenerating ? (
                        <span className="flex items-center justify-center gap-2">
                             <span className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent"></span>
                             {targetUrl ? 'Navigating & Capturing...' : 'Rendering 8K Masterpiece...'}
                        </span>
                    ) : (
                        'Dispatch & Capture'
                    )}
                  </button>
              </div>

              {/* Preview Section */}
              <div className="flex-1 bg-black/40 rounded-2xl border border-slate-700/50 flex items-center justify-center min-h-[300px] relative group overflow-hidden">
                  {exclusiveImage ? (
                      <>
                          <img src={exclusiveImage} alt="Exclusive" className="w-full h-full object-contain" />
                          <div className="absolute top-4 right-4 bg-yellow-500/90 text-black text-[10px] font-bold px-2 py-1 rounded shadow-lg backdrop-blur-sm">
                              {imageSize} • PRO
                          </div>
                          <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/90 to-transparent flex justify-center pb-6">
                              <button 
                                  onClick={handleShareExclusive}
                                  disabled={shareStatus === 'success'}
                                  className={`px-8 py-3 rounded-full font-bold flex items-center gap-2 transition-all ${
                                      shareStatus === 'success'
                                      ? 'bg-emerald-500 text-white'
                                      : 'bg-white text-black hover:bg-cyan-400 hover:text-black shadow-lg shadow-white/20'
                                  }`}
                              >
                                  {shareStatus === 'success' ? (
                                      <>
                                          <Icon name="Check" className="w-5 h-5" />
                                          Shared to Feed
                                      </>
                                  ) : (
                                      <>
                                          <Icon name="UploadCloud" className="w-5 h-5" />
                                          Share to Public Feed
                                      </>
                                  )}
                              </button>
                          </div>
                      </>
                  ) : (
                      <div className="text-center p-6 text-slate-600">
                          <Icon name="Image" className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p className="text-sm">Preview area</p>
                      </div>
                  )}
              </div>
          </div>
      </div>
  );

  const renderInbox = () => (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Reports */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden flex flex-col h-[600px]">
              <div className="p-6 border-b border-slate-700 bg-red-900/20">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Icon name="Report" className="w-5 h-5 text-red-400" />
                      User Reports ({reports.length})
                  </h3>
              </div>
              <div className="overflow-y-auto p-4 space-y-4 flex-1 custom-scrollbar">
                  {reports.length === 0 && <p className="text-slate-500 text-center py-4">No reports found.</p>}
                  {reports.map(report => (
                      <div key={report.id} className="bg-slate-900/50 border border-slate-700 p-4 rounded-xl">
                          <div className="flex justify-between mb-2">
                              <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-red-500/20 text-red-400">{report.type}</span>
                              <span className="text-[10px] text-slate-500">{new Date(report.timestamp).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm text-slate-300 mb-2">{report.description}</p>
                          {report.relatedId && <p className="text-xs text-slate-500 font-mono bg-black/20 p-1 rounded">Ref: {report.relatedId}</p>}
                      </div>
                  ))}
              </div>
          </div>

          {/* Contact Messages */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden flex flex-col h-[600px]">
              <div className="p-6 border-b border-slate-700 bg-blue-900/20">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Icon name="Contact" className="w-5 h-5 text-blue-400" />
                      Contact Messages ({messages.length})
                  </h3>
              </div>
              <div className="overflow-y-auto p-4 space-y-4 flex-1 custom-scrollbar">
                  {messages.length === 0 && <p className="text-slate-500 text-center py-4">No messages found.</p>}
                  {messages.map(msg => (
                      <div key={msg.id} className="bg-slate-900/50 border border-slate-700 p-4 rounded-xl">
                           <div className="flex justify-between mb-1">
                              <h4 className="text-white font-bold text-sm">{msg.userName}</h4>
                              <span className="text-[10px] text-slate-500">{new Date(msg.timestamp).toLocaleDateString()}</span>
                           </div>
                           <p className="text-xs text-cyan-400 mb-2">{msg.subject}</p>
                           <p className="text-sm text-slate-300 bg-slate-800 p-2 rounded-lg">{msg.message}</p>
                      </div>
                  ))}
              </div>
          </div>
      </div>
  );

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-900">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Admin Dashboard</h1>
                <p className="text-slate-400">System overview and management</p>
            </div>
            <div className="flex bg-slate-800 p-1 rounded-lg overflow-x-auto w-full md:w-auto">
                <button 
                   onClick={() => setActiveTab('dashboard')}
                   className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                    Overview
                </button>
                <button 
                   onClick={() => setActiveTab('users')}
                   className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'users' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                    Users
                </button>
                <button 
                   onClick={() => setActiveTab('content')}
                   className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'content' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                    Content
                </button>
                <button 
                   onClick={() => setActiveTab('inbox')}
                   className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'inbox' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                    Inbox
                </button>
                <button 
                   onClick={() => setActiveTab('exclusive')}
                   className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'exclusive' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 shadow' : 'text-yellow-500/70 hover:text-yellow-400 hover:bg-yellow-500/10'}`}
                >
                    <Icon name="Sparkles" className="w-4 h-4" />
                    Exclusive
                </button>
            </div>
        </div>

        <div className="min-h-[500px]">
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
