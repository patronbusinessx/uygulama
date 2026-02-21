
import React, { useEffect, useState } from 'react';
import { User, Post, GeneratedImage } from '../types';
import { Icon } from './Icons';
import { postService } from '../services/postService';
import { dataService } from '../services/dataService';
import { generateImageFromText } from '../services/geminiService';
import Card3D from './Card3D';
import CreatePostModal from './CreatePostModal';
import EditProfileModal from './EditProfileModal';
import { authService } from '../services/authService';

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [currentUser, setCurrentUser] = useState<User>(user);
  const [activeTab, setActiveTab] = useState<'creations' | 'favorites' | 'ailab'>('creations');
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  
  // AI Lab States
  const [labPrompt, setLabPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [labError, setLabError] = useState<string | null>(null);

  // Sync prop user if it changes (rare in this structure but good practice)
  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  useEffect(() => {
    // Fetch Created Posts
    const created = postService.getUserPosts(currentUser.username);
    setUserPosts(created);

    // Fetch Saved/Liked Posts
    if (currentUser.savedPostIds && currentUser.savedPostIds.length > 0) {
      const saved = postService.getPostsByIds(currentUser.savedPostIds);
      setSavedPosts(saved);
    } else {
      setSavedPosts([]);
    }

    // Fetch AI Lab Generated Images
    const labImages = dataService.getUserGeneratedImages(currentUser.id);
    setGeneratedImages(labImages);
  }, [currentUser, currentUser.username, currentUser.savedPostIds, refreshTrigger, activeTab]);

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleProfileUpdateSuccess = (updatedUser: User) => {
    // Update local state immediately
    setCurrentUser(updatedUser);
    setIsEditProfileOpen(false);
    // Force refresh posts in case author name changed (though ID based is better, mock uses name)
    setRefreshTrigger(prev => prev + 1);
  };
  
  const handleToggleLike = (postId: string) => {
    const result = postService.toggleLike(postId, currentUser.id);
    if (result.success) {
       // We need to re-fetch the user to get updated savedPostIds
       const updatedUser = authService.getCurrentUser();
       if (updatedUser) {
           setCurrentUser(updatedUser);
       }
       setRefreshTrigger(prev => prev + 1);
    }
  };

  const handleGenerateBackground = async () => {
    if (!labPrompt.trim()) return;
    
    setLabError(null);
    setIsGenerating(true);

    try {
      // Try to parse as JSON if it looks like JSON
      let finalPrompt = labPrompt;
      if (labPrompt.trim().startsWith('{') && labPrompt.trim().endsWith('}')) {
        try {
          const parsed = JSON.parse(labPrompt);
          if (parsed.prompt) finalPrompt = parsed.prompt;
          else if (parsed.description) finalPrompt = parsed.description;
          else if (parsed.text) finalPrompt = parsed.text;
        } catch (e) {
          // If parsing fails, just use the raw text
          console.warn("JSON parsing failed, using raw prompt");
        }
      }

      // Check for API Key if using Pro model
      // @ts-ignore
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
        // After opening, we proceed. The platform handles the injection.
      }

      const imageUrl = await generateImageFromText(finalPrompt, {
        model: 'gemini-3-pro-image-preview',
        imageSize: '1K',
        aspectRatio: '16:9'
      });

      // Save to data service
      dataService.saveGeneratedImage({
        userId: currentUser.id,
        prompt: labPrompt,
        imageUrl: imageUrl,
        model: 'gemini-3-pro-image-preview'
      });

      setLabPrompt('');
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      console.error(err);
      setLabError(err.message || "Failed to generate image");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[#050505] p-6 md:p-10 scrollbar-hide">
      <div className="max-w-7xl mx-auto space-y-10 pb-20">
        
        {/* Welcome Header - Next Gen Split Design */}
        <div className="relative group">
           <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-[2.5rem] blur-xl opacity-50 group-hover:opacity-75 transition duration-1000"></div>
           <div className="relative bg-black border border-white/5 rounded-[2.5rem] p-8 md:p-12 overflow-hidden">
              <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-cyan-500/10 to-transparent pointer-events-none"></div>
              <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                 <div className="relative">
                    <div className="w-32 h-32 rounded-3xl p-1 bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600 shadow-2xl shadow-cyan-500/20 rotate-3 group-hover:rotate-0 transition-transform duration-700">
                       <img src={currentUser.avatar} alt={currentUser.username} className="w-full h-full rounded-[1.4rem] bg-black object-cover" />
                    </div>
                    {currentUser.membershipTier === 'pro' && (
                        <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-black text-[10px] font-black px-3 py-1 rounded-full border-2 border-black shadow-xl tracking-tighter">PRO</div>
                    )}
                 </div>

                 <div className="flex-1 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-4">
                       <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
                       <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">System Online</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4 leading-none">
                       Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/40">{currentUser.username}</span>
                    </h1>
                    <p className="text-slate-400 text-lg max-w-xl font-medium leading-relaxed">
                       Welcome to your neural workspace. Your creative potential is now <span className="text-white">unlimited</span>.
                    </p>
                    
                    <div className="mt-8 flex flex-wrap gap-4 justify-center md:justify-start">
                       <button 
                          onClick={() => setIsCreateModalOpen(true)}
                          className="px-8 py-4 bg-white text-black rounded-2xl font-bold text-sm hover:bg-cyan-400 transition-all duration-500 shadow-xl shadow-white/5 flex items-center gap-3 group/btn"
                       >
                          <Icon name="Plus" className="w-4 h-4" />
                          Initialize Project
                       </button>
                       <button 
                          onClick={() => setIsEditProfileOpen(true)}
                          className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-bold text-sm hover:bg-white/10 transition-all duration-500 backdrop-blur-xl"
                       >
                          Identity Settings
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Stats Grid - Minimalist High Density */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Neural Assets', value: userPosts.length, icon: 'Image', color: 'cyan' },
            { label: 'Saved Nodes', value: savedPosts.length, icon: 'Heart', color: 'purple' },
            { label: 'Current Tier', value: currentUser.membershipTier, icon: 'Analytics', color: 'yellow' }
          ].map((stat, i) => (
            <div key={i} className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 hover:bg-white/[0.04] transition-all duration-500 group">
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
        
        {/* Tabs & Content Section */}
        <div className="pt-10">
          <div className="flex items-center gap-10 mb-12 border-b border-white/5">
             {[
               { id: 'creations', label: 'Assets', color: 'cyan' },
               { id: 'favorites', label: 'Vault', color: 'purple' },
               { id: 'ailab', label: 'Neural Lab', color: 'yellow' }
             ].map((tab) => (
               <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`text-sm font-bold pb-6 transition-all relative tracking-widest uppercase ${
                    activeTab === tab.id 
                      ? 'text-white' 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
               >
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className={`absolute bottom-[-1px] left-0 w-full h-0.5 shadow-[0_0_15px_rgba(255,255,255,0.5)] ${
                      tab.color === 'cyan' ? 'bg-cyan-500' : tab.color === 'purple' ? 'bg-purple-500' : 'bg-yellow-500'
                    }`}></div>
                  )}
               </button>
             ))}
          </div>

          {/* AI LAB CONTENT */}
          {activeTab === 'ailab' && (
            <div className="space-y-8 animate-fade-in-up">
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-8">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="flex-1 w-full">
                    <h3 className="text-xl font-bold text-white mb-2">Background Image Generator</h3>
                    <p className="text-slate-400 mb-6 text-sm">
                      Use Nano Banana Pro to generate high-quality background images. Enter a prompt or a JSON-formatted prompt.
                    </p>
                    <div className="relative">
                      <textarea 
                        value={labPrompt}
                        onChange={(e) => setLabPrompt(e.target.value)}
                        placeholder="Describe the background you want to generate... (e.g., 'A futuristic cyberpunk city at night with neon lights and rain')"
                        className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 min-h-[120px] transition-all"
                      />
                      <div className="absolute bottom-4 right-4 flex gap-2">
                        <button 
                          onClick={handleGenerateBackground}
                          disabled={isGenerating || !labPrompt.trim()}
                          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg ${
                            isGenerating || !labPrompt.trim()
                              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                              : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black hover:from-yellow-400 hover:to-orange-400 shadow-yellow-500/20'
                          }`}
                        >
                          {isGenerating ? (
                            <>
                              <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                              Generating...
                            </>
                          ) : (
                            <>
                              <Icon name="Sparkles" className="w-4 h-4" />
                              Generate Background
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    {labError && (
                      <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
                        <Icon name="Alert" className="w-4 h-4" />
                        {labError}
                      </div>
                    )}
                  </div>
                  <div className="w-full md:w-64 bg-slate-900/50 border border-slate-700/50 rounded-2xl p-4">
                    <h4 className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-3">Model Info</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Model:</span>
                        <span className="text-yellow-400 font-semibold">Nano Pro</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Resolution:</span>
                        <span className="text-slate-200">1K</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Aspect:</span>
                        <span className="text-slate-200">16:9</span>
                      </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-slate-800">
                      <p className="text-[10px] text-slate-500 leading-relaxed italic">
                        * Nano Banana Pro requires a personal API key for high-fidelity generations.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Generation History</h3>
                  <span className="text-xs font-mono text-slate-500">{generatedImages.length} IMAGES</span>
                </div>

                {generatedImages.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {generatedImages.map((img) => (
                      <div key={img.id} className="group relative bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden hover:border-yellow-500/50 transition-all shadow-xl">
                        <div className="aspect-video w-full overflow-hidden">
                          <img 
                            src={img.imageUrl} 
                            alt={img.prompt} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="p-4 bg-gradient-to-t from-slate-900 to-slate-900/80">
                          <p className="text-sm text-slate-200 line-clamp-2 mb-2 font-medium">
                            {img.prompt}
                          </p>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-mono text-slate-500">
                              {new Date(img.timestamp).toLocaleDateString()}
                            </span>
                            <button 
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = img.imageUrl;
                                link.download = `generated-${img.id}.png`;
                                link.click();
                              }}
                              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                              title="Download Image"
                            >
                              <Icon name="Download" className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-800/20 border border-dashed border-slate-700 rounded-3xl p-12 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-600">
                      <Icon name="Image" className="w-8 h-8 opacity-30" />
                    </div>
                    <p className="text-slate-500">No background images generated yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CREATIONS GRID */}
          {activeTab === 'creations' && (
             userPosts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 justify-items-center animate-fade-in-up">
                  {userPosts.map((post) => (
                    <Card3D 
                      key={post.id}
                      id={post.id}
                      imageUrl={post.imageUrl}
                      title={post.title}
                      author={post.author}
                      prompt={post.prompt}
                      likeCount={post.likeCount}
                      isLiked={currentUser.savedPostIds?.includes(post.id)}
                      onToggleLike={handleToggleLike}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-slate-800/30 border border-slate-700/30 rounded-3xl p-12 flex flex-col items-center justify-center text-center min-h-[300px]">
                   <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center mb-6 text-slate-500">
                      <Icon name="Image" className="w-10 h-10 opacity-50" />
                   </div>
                   <h3 className="text-xl font-semibold text-slate-300 mb-2">No creations yet</h3>
                   <p className="text-slate-500 max-w-md mb-6">
                     Your generated artworks will appear here. Start creating in the Home tab.
                   </p>
                   <button 
                     onClick={() => setIsCreateModalOpen(true)}
                     className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-xl transition-colors border border-dashed border-slate-600 hover:border-cyan-500"
                   >
                     <Icon name="Plus" className="w-5 h-5" />
                     Create First Post
                   </button>
                </div>
              )
          )}

          {/* FAVORITES GRID */}
          {activeTab === 'favorites' && (
             savedPosts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 justify-items-center animate-fade-in-up">
                  {savedPosts.map((post) => (
                    <Card3D 
                      key={post.id}
                      id={post.id}
                      imageUrl={post.imageUrl}
                      title={post.title}
                      author={post.author}
                      prompt={post.prompt}
                      likeCount={post.likeCount}
                      isLiked={true} // In favorites tab, they are all liked
                      onToggleLike={handleToggleLike}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-slate-800/30 border border-slate-700/30 rounded-3xl p-12 flex flex-col items-center justify-center text-center min-h-[300px]">
                   <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center mb-6 text-slate-500">
                      <Icon name="Heart" className="w-10 h-10 opacity-50" />
                   </div>
                   <h3 className="text-xl font-semibold text-slate-300 mb-2">No favorites yet</h3>
                   <p className="text-slate-500 max-w-md">
                     Posts you like will be saved here for easy access. Explore the community feed to find inspiration!
                   </p>
                </div>
              )
          )}
        </div>

      </div>

      {/* Modals */}
      <CreatePostModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
        user={currentUser}
      />
      
      <EditProfileModal 
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        onSuccess={handleProfileUpdateSuccess}
        user={currentUser}
      />
    </div>
  );
};

export default Dashboard;
