
import React, { useEffect, useState } from 'react';
import Card3D from './Card3D';
import { postService } from '../services/postService';
import { authService } from '../services/authService';
import { Post, User } from '../types';
import { Icon } from './Icons';
import LoginInterface from './LoginInterface';

interface HomeFeedProps {
  user: User | null;
}

const GUEST_USAGE_KEY = 'neura_guest_flips';
const GUEST_LIMIT = 3;
const FREE_LIMIT = 10;

const HomeFeed: React.FC<HomeFeedProps> = ({ user }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [userSavedIds, setUserSavedIds] = useState<string[]>([]);
  
  // Restriction Modals
  const [showSignupRestriction, setShowSignupRestriction] = useState(false);
  const [showLimitReached, setShowLimitReached] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    // Load posts
    const loadedPosts = postService.getAllPosts();
    setPosts(loadedPosts);
    
    // Sync local state for favorites
    if (user && user.savedPostIds) {
      setUserSavedIds(user.savedPostIds);
    } else {
      setUserSavedIds([]);
    }
  }, [user]);

  const handleToggleLike = (postId: string) => {
    if (!user) {
      // Prompt login if needed, or just return
      setShowLoginModal(true);
      return;
    }

    const result = postService.toggleLike(postId, user.id);
    
    if (result.success) {
       // Update the local saved list immediately for UI consistency
       if (result.isLiked) {
         setUserSavedIds(prev => [...prev, postId]);
       } else {
         setUserSavedIds(prev => prev.filter(id => id !== postId));
       }
    }
  };

  const checkPermission = (): boolean => {
      // 1. Guest Check (Not logged in)
      if (!user) {
          const currentUsage = parseInt(localStorage.getItem(GUEST_USAGE_KEY) || '0');
          if (currentUsage >= GUEST_LIMIT) {
              setShowSignupRestriction(true);
              return false;
          }
          // Increment guest usage
          localStorage.setItem(GUEST_USAGE_KEY, (currentUsage + 1).toString());
          return true;
      }

      // 2. User Check (Logged in)
      const usageCheck = authService.checkAndIncrementUsage(user.id);
      if (!usageCheck.allowed) {
          setShowLimitReached(true);
          return false;
      }
      return true;
  };

  const handleLoginSuccess = (user: User) => {
      // Reload page to sync state completely or just close modal
      window.location.reload(); 
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-900 scroll-smooth relative">
      {/* Grid Feed */}
      <div className="max-w-[1600px] mx-auto px-6 pt-28 pb-12">
        
        {/* Visual Header / Interaction Hint */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 px-2 animate-fade-in-up">
            <div>
               <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  Explore Community
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-xs border border-cyan-500/20">Live</span>
               </h2>
               <p className="text-slate-400 text-sm mt-1">Discover what others are creating with NeuraFlow AI.</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/50 mt-4 md:mt-0">
               <Icon name="Sparkles" className="w-3 h-3 text-cyan-400" />
               <span>Click to flip • Like to save</span>
            </div>
        </div>

        <style>{`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-card-entry {
            animation: fadeInUp 0.6s ease-out forwards;
            opacity: 0;
          }
           .animate-fade-in-up {
            animation: fadeInUp 0.8s ease-out forwards;
          }
        `}</style>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 gap-y-12">
          {posts.map((post, index) => (
            <div 
              key={post.id}
              className="animate-card-entry"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Card3D 
                id={post.id}
                imageUrl={post.imageUrl}
                title={post.title}
                author={post.author}
                prompt={post.prompt}
                description={post.description}
                likeCount={post.likeCount}
                isLiked={userSavedIds.includes(post.id)}
                onToggleLike={handleToggleLike}
                onFlipAttempt={checkPermission}
              />
            </div>
          ))}
        </div>

        {posts.length === 0 && (
           <div className="text-center py-20 text-slate-500">
              <p>No posts available yet.</p>
           </div>
        )}
      </div>
      
      {/* Bottom Spacer */}
      <div className="h-20"></div>

      {/* --- MODALS --- */}

      {/* 1. Guest Restriction Modal (SignUp Prompt) */}
      {showSignupRestriction && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
             <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center relative overflow-hidden">
                {/* Decorative Glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl"></div>
                
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/20">
                    <Icon name="Lock" className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-2">Want to see more?</h3>
                <p className="text-slate-400 mb-8">
                    You've reached the preview limit. Join our community to view more prompts, create your own art, and save your favorites!
                </p>

                <div className="space-y-3">
                    <button 
                        onClick={() => { setShowSignupRestriction(false); setShowLoginModal(true); }}
                        className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20"
                    >
                        Create Free Account
                    </button>
                    <button 
                        onClick={() => setShowSignupRestriction(false)}
                        className="w-full py-3 text-slate-500 hover:text-white transition-colors text-sm"
                    >
                        Maybe Later
                    </button>
                </div>
             </div>
          </div>
      )}

      {/* 2. Free Tier Limit Modal */}
      {showLimitReached && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
             <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center relative">
                 <div className="w-16 h-16 bg-yellow-500/10 border border-yellow-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Icon name="Sparkles" className="w-8 h-8 text-yellow-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Daily Limit Reached</h3>
                <p className="text-slate-400 mb-6">
                    You've viewed {FREE_LIMIT} prompts today. Upgrade to NeuraFlow PRO for unlimited access and exclusive features.
                </p>
                <div className="flex gap-3">
                     <button 
                        onClick={() => setShowLimitReached(false)}
                        className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
                    >
                        Close
                    </button>
                    <button 
                        className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl transition-colors shadow-lg shadow-yellow-500/20"
                    >
                        Upgrade to PRO
                    </button>
                </div>
             </div>
          </div>
      )}

      {/* 3. Inline Login Modal */}
      {showLoginModal && (
          <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center">
              <div className="relative w-full max-w-md">
                 <button 
                    onClick={() => setShowLoginModal(false)}
                    className="absolute top-4 right-4 z-50 p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700"
                 >
                     <Icon name="X" className="w-5 h-5" />
                 </button>
                 <LoginInterface onLoginSuccess={handleLoginSuccess} />
              </div>
          </div>
      )}

    </div>
  );
};

export default HomeFeed;
