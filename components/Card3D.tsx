
import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './Icons';

interface Card3DProps {
  id: string;
  imageUrl: string;
  title: string;
  author: string;
  prompt: string;
  description?: string;
  likeCount: number;
  isLiked?: boolean;
  onToggleLike?: (id: string) => void;
  onFlipAttempt?: () => boolean | Promise<boolean>; // New prop to check permission
}

const Card3D: React.FC<Card3DProps> = ({ 
  id,
  imageUrl, 
  title, 
  author, 
  prompt, 
  description,
  likeCount = 0,
  isLiked = false,
  onToggleLike,
  onFlipAttempt
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  
  // Optimistic UI state
  const [localIsLiked, setLocalIsLiked] = useState(isLiked);
  const [localLikeCount, setLocalLikeCount] = useState(likeCount);

  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setIsImageLoaded(false);
  }, [imageUrl]);

  // Sync with props
  useEffect(() => {
    setLocalIsLiked(isLiked);
    setLocalLikeCount(likeCount);
  }, [isLiked, likeCount]);

  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      setIsImageLoaded(true);
    }
  }, []);

  const handleFlip = async () => {
    if (isFlipped) {
      // Always allow flipping back to image
      setIsFlipped(false);
      return;
    }

    // If there is a permission check provided, run it
    if (onFlipAttempt) {
      const allowed = await onFlipAttempt();
      if (!allowed) {
        return; // Block flip if not allowed
      }
    }

    setIsFlipped(true);
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card flip
    
    // Optimistic Update
    const newIsLiked = !localIsLiked;
    setLocalIsLiked(newIsLiked);
    setLocalLikeCount(prev => newIsLiked ? prev + 1 : prev - 1);

    if (onToggleLike) {
      onToggleLike(id);
    }
  };

  const handleCopyPrompt = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(prompt);
  };

  return (
    <div 
      className="group relative w-full h-[400px] cursor-pointer perspective-1000"
      onClick={handleFlip}
    >
      <style>
        {`
          .perspective-1000 {
            perspective: 1000px;
          }
          .transform-style-3d {
            transform-style: preserve-3d;
          }
          .backface-hidden {
            backface-visibility: hidden;
          }
          .rotate-y-180 {
            transform: rotateY(180deg);
          }
        `}
      </style>

      {/* Inner Container that rotates */}
      <div className={`relative w-full h-full duration-700 transition-all transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
        
        {/* FRONT FACE */}
        <div className="absolute inset-0 w-full h-full backface-hidden rounded-[2rem] overflow-hidden bg-black border border-white/5 shadow-2xl transition-all duration-700 group-hover:border-white/20">
          
          {/* Skeleton Loader */}
          {!isImageLoaded && (
            <div className="absolute inset-0 bg-black/80 animate-pulse z-20 flex flex-col items-center justify-center">
               <div className="w-12 h-12 border-2 border-white/10 border-t-cyan-500 rounded-full animate-spin mb-4"></div>
               <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Loading Node...</div>
            </div>
          )}

          {/* Image */}
          <div className="absolute inset-0 bg-black">
             <img 
               ref={imgRef}
               src={imageUrl} 
               alt={title} 
               onLoad={() => setIsImageLoaded(true)}
               className={`w-full h-full object-cover transition-all duration-1000 group-hover:scale-110 group-hover:rotate-1 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`} 
               referrerPolicy="no-referrer"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90 transition-opacity duration-700 group-hover:opacity-70"></div>
          </div>

          {/* Top Bar Info */}
          <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-30">
             <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/10">
                <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
                <span className="text-[10px] font-mono text-white/80 uppercase tracking-widest">{author}</span>
             </div>
             
             <button 
               onClick={handleLikeClick}
               className={`p-3 rounded-2xl backdrop-blur-xl transition-all duration-500 hover:scale-110 ${
                 localIsLiked 
                   ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]' 
                   : 'bg-black/40 text-white/70 border border-white/10 hover:bg-white hover:text-black'
               }`}
             >
                <Icon 
                  name={localIsLiked ? "Heart" : "HeartOutline"} 
                  className="w-4 h-4" 
                />
             </button>
          </div>
          
          {/* Front Content */}
          <div className={`absolute bottom-8 left-8 right-8 transition-all duration-700 ${isImageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
             <h3 className="text-3xl font-black text-white mb-2 tracking-tighter leading-none group-hover:text-cyan-400 transition-colors">{title}</h3>
             <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                   <Icon name="Sparkles" className="w-3 h-3 text-cyan-500" />
                   <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Neural Asset</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-white/20"></div>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{localLikeCount} Syncs</span>
             </div>
          </div>

          {/* Hover Interaction Hint */}
          <div className="absolute inset-0 bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
        </div>

        {/* BACK FACE */}
        <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-[2rem] overflow-hidden bg-[#0a0a0a] border border-white/10 shadow-2xl p-10 flex flex-col relative group/back">
          
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl"></div>

          {/* Header */}
          <div className="flex items-center justify-between mb-10 z-10">
             <div className="flex flex-col">
                <span className="text-[10px] font-mono text-cyan-500 uppercase tracking-[0.3em] mb-1">Neural Parameters</span>
                <h4 className="text-xl font-black text-white tracking-tighter uppercase">Source Code</h4>
             </div>
             <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <Icon name="Sliders" className="w-5 h-5 text-slate-400" />
             </div>
          </div>

          {/* Prompt Content */}
          <div className="flex-1 overflow-y-auto scrollbar-hide z-10 space-y-8">
             <div className="relative">
                <div className="absolute -left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500 to-transparent opacity-50"></div>
                <p className="text-lg text-slate-300 font-medium leading-relaxed italic">
                   "{prompt}"
                </p>
             </div>
             
             {description && (
                <div className="pt-6 border-t border-white/5">
                  <p className="text-xs text-slate-500 leading-relaxed font-mono uppercase tracking-wider">
                     {description}
                  </p>
                </div>
             )}
          </div>

          {/* Actions */}
          <div className="mt-10 flex gap-4 z-10">
             <button 
               onClick={handleCopyPrompt}
               className="flex-1 py-4 bg-white/5 border border-white/10 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-all duration-500"
             >
                Clone Prompt
             </button>
             <button className="flex-1 py-4 bg-white text-black text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-cyan-400 transition-all duration-500 shadow-xl shadow-white/5">
                Initialize
             </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Card3D;
