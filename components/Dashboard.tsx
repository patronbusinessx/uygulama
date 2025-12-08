
import React, { useEffect, useState } from 'react';
import { User, Post } from '../types';
import { Icon } from './Icons';
import { postService } from '../services/postService';
import Card3D from './Card3D';
import CreatePostModal from './CreatePostModal';
import EditProfileModal from './EditProfileModal';
import { authService } from '../services/authService';

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [currentUser, setCurrentUser] = useState<User>(user);
  const [activeTab, setActiveTab] = useState<'creations' | 'favorites'>('creations');
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

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

  return (
    <div className="h-full overflow-y-auto bg-slate-900 p-8">
      <div className="max-w-7xl mx-auto space-y-12 pb-20">
        
        {/* Welcome Header */}
        <div className="relative bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 rounded-3xl p-8 overflow-hidden shadow-2xl">
           <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
           
           <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-br from-cyan-400 to-purple-500 shadow-lg shadow-cyan-500/20 relative">
                <img src={currentUser.avatar} alt={currentUser.username} className="w-full h-full rounded-full bg-slate-900 object-cover" />
                {currentUser.membershipTier === 'pro' && (
                    <div className="absolute bottom-0 right-0 bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded-full border border-white shadow-lg">PRO</div>
                )}
              </div>
              <div className="text-center md:text-left flex-1">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-white">Welcome back, {currentUser.username}!</h1>
                    {currentUser.membershipTier === 'pro' && (
                        <span className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 text-xs font-bold px-2 py-1 rounded tracking-wider uppercase">Pro Member</span>
                    )}
                </div>
                <p className="text-slate-400 max-w-lg">
                  Your creative hub. Manage your generated artworks and explore your analytics here.
                </p>
                <div className="mt-4 flex gap-3 justify-center md:justify-start">
                   <button 
                      onClick={() => setIsEditProfileOpen(true)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-300 transition-colors"
                   >
                      Edit Profile
                   </button>
                   <button 
                      onClick={() => setIsCreateModalOpen(true)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition-all transform hover:-translate-y-0.5"
                   >
                      <Icon name="Plus" className="w-4 h-4" />
                      Create New Post
                   </button>
                </div>
              </div>
           </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800 transition-colors group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                 <Icon name="Image" className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono text-slate-500">TOTAL POSTS</span>
            </div>
            <div className="text-3xl font-bold text-white">{userPosts.length}</div>
            <p className="text-sm text-slate-500 mt-2">Shared with community</p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800 transition-colors group">
            <div className="flex justify-between items-start mb-4">
               <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                 <Icon name="Heart" className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono text-slate-500">SAVED FAVORITES</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {savedPosts.length}
            </div>
            <p className="text-sm text-slate-500 mt-2">Personal collection</p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800 transition-colors group">
             <div className="flex justify-between items-start mb-4">
               <div className={`p-3 rounded-xl transition-colors ${currentUser.membershipTier === 'pro' ? 'bg-yellow-500/10 text-yellow-400 group-hover:bg-yellow-500 group-hover:text-black' : 'bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white'}`}>
                 <Icon name="Analytics" className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono text-slate-500">PLAN</span>
            </div>
            <div className="text-3xl font-bold text-white capitalize">{currentUser.membershipTier}</div>
            <p className="text-sm text-slate-500 mt-2">
                {currentUser.membershipTier === 'pro' ? 'Premium Features Unlocked' : 'Upgrade for more features'}
            </p>
          </div>
        </div>
        
        {/* Tabs & Content Section */}
        <div>
          <div className="flex items-center gap-6 mb-8 border-b border-slate-700 pb-1">
             <button 
                onClick={() => setActiveTab('creations')}
                className={`text-xl font-bold pb-4 transition-all relative ${
                  activeTab === 'creations' 
                    ? 'text-white' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
             >
                My Creations
                {activeTab === 'creations' && (
                  <span className="absolute bottom-[-5px] left-0 w-full h-1 bg-cyan-500 rounded-full shadow-lg shadow-cyan-500/50"></span>
                )}
             </button>

             <button 
                onClick={() => setActiveTab('favorites')}
                className={`text-xl font-bold pb-4 transition-all relative ${
                  activeTab === 'favorites' 
                    ? 'text-white' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
             >
                Favorites
                {activeTab === 'favorites' && (
                  <span className="absolute bottom-[-5px] left-0 w-full h-1 bg-red-500 rounded-full shadow-lg shadow-red-500/50"></span>
                )}
             </button>
          </div>

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
