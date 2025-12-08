import React, { useEffect, useState } from 'react';
import Card3D from './Card3D';
import { postService } from '../services/postService';
import { Post, User } from '../types';
import { Icon } from './Icons';

interface HomeFeedProps {
  user: User | null;
}

const HomeFeed: React.FC<HomeFeedProps> = ({ user }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [userSavedIds, setUserSavedIds] = useState<string[]>([]);

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
      alert("Please login to like posts");
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

  return (
    <div className="h-full overflow-y-auto bg-slate-900 scroll-smooth">
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
    </div>
  );
};

export default HomeFeed;