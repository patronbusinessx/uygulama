
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
        <div className="absolute inset-0 w-full h-full backface-hidden rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 shadow-2xl group-hover:shadow-cyan-500/20 transition-shadow">
          
          {/* Skeleton Loader */}
          {!isImageLoaded && (
            <div className="absolute inset-0 bg-slate-800/80 animate-pulse z-20 flex flex-col items-center justify-center border border-slate-700/50">
               <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mb-4 text-slate-500">
                  <Icon name="Image" className="w-8 h-8 opacity-50" />
               </div>
               <div className="h-4 bg-slate-700/50 rounded w-32 mb-2"></div>
               <div className="h-3 bg-slate-700/50 rounded w-24"></div>
            </div>
          )}

          {/* Image */}
          <div className="absolute inset-0 bg-slate-900">
             <img 
               ref={imgRef}
               src={imageUrl} 
               alt={title} 
               onLoad={() => setIsImageLoaded(true)}
               className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`} 
             />
             <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent opacity-80"></div>
          </div>

          {/* Like Button (Top Right) */}
          <button 
            onClick={handleLikeClick}
            className={`absolute top-4 right-4 z-30 p-2.5 rounded-full backdrop-blur-md transition-all duration-300 group/like hover:scale-110 ${
              localIsLiked 
                ? 'bg-red-500/20 text-red-500 border border-red-500/50' 
                : 'bg-black/30 text-white/70 border border-white/10 hover:bg-black/50 hover:text-white'
            } ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
          >
             <Icon 
               name={localIsLiked ? "Heart" : "HeartOutline"} 
               className={`w-5 h-5 transition-transform ${localIsLiked ? 'scale-110' : ''}`} 
             />
             <span className="sr-only">Like</span>
          </button>
          
          {/* Like Count Badge */}
          {localLikeCount > 0 && (
             <div className={`absolute top-14 right-4 z-20 text-[10px] font-bold text-white bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}>
                {localLikeCount}
             </div>
          )}

          {/* Front Content */}
          <div className={`absolute bottom-0 left-0 w-full p-6 translate-y-2 group-hover:translate-y-0 transition-all duration-500 ${isImageLoaded ? 'opacity-100 delay-100' : 'opacity-0'}`}>
             <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center text-[10px] font-bold text-white shadow-lg shadow-cyan-500/50">
                   {author.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-semibold text-cyan-300 tracking-wide uppercase drop-shadow-md">{author}</span>
             </div>
             <h3 className="text-2xl font-bold text-white mb-1 drop-shadow-lg">{title}</h3>
             <p className="text-xs text-slate-300 line-clamp-1 opacity-80">Click to reveal prompt</p>
          </div>

        </div>

        {/* BACK FACE */}
        <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-2xl overflow-hidden bg-[#0f172a] border border-cyan-500/30 shadow-2xl p-6 flex flex-col relative">
          
          {/* Decorative Grid Background */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #22d3ee 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/10 to-purple-900/10 pointer-events-none"></div>

          {/* Header */}
          <div className="flex items-center justify-between mb-4 z-10 border-b border-white/10 pb-3">
             <div className="flex items-center gap-2">
                <Icon name="Image" className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Prompt Details</span>
             </div>
             <button className="text-xs text-slate-500 hover:text-white transition-colors">
                <Icon name="X" className="w-4 h-4" />
             </button>
          </div>

          {/* Prompt Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar z-10 space-y-4">
             <div>
                <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block">Full Prompt</label>
                <div className="p-3 bg-black/50 rounded-lg border border-slate-700/50 text-sm text-cyan-100 font-mono leading-relaxed relative group/code">
                   {prompt}
                </div>
             </div>
             
             {description && (
                <div>
                  <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block">Backstory</label>
                  <p className="text-xs text-slate-400 italic">"{description}"</p>
                </div>
             )}
          </div>

          {/* Actions */}
          <div className="mt-4 pt-3 border-t border-white/10 z-10 flex gap-2">
             <button 
               onClick={handleCopyPrompt}
               className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors border border-slate-700"
             >
                Copy Prompt
             </button>
             <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-cyan-500/20 transition-all">
                Try this
             </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Card3D;
