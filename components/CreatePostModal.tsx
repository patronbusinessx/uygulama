
import React, { useState, useRef } from 'react';
import { Icon } from './Icons';
import { postService } from '../services/postService';
import { User } from '../types';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: User;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, onSuccess, user }) => {
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const isPro = user.membershipTier === 'pro';
  const MAX_DESC_LENGTH = isPro ? 1000 : 100;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError("Image size too large. Max 5MB.");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      if (val.length <= MAX_DESC_LENGTH) {
          setDescription(val);
      }
  };

  const handleSubmit = () => {
    if (!prompt.trim() || !selectedImage) {
      setError("Please upload an image and enter a prompt.");
      return;
    }

    // Auto-generate title from prompt (first 5 words)
    const words = prompt.trim().split(/\s+/);
    const generatedTitle = words.slice(0, 5).join(' ') + (words.length > 5 ? '...' : '');

    postService.createPost({
      title: generatedTitle || "Untitled Creation",
      description,
      prompt,
      imageUrl: selectedImage,
      author: user.username,
      authorId: user.id
    });

    onSuccess();
    // Reset form
    setDescription('');
    setPrompt('');
    setSelectedImage(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-xl transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-3xl bg-black border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in">
        
        {/* Header */}
        <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex flex-col">
              <span className="text-[10px] font-mono text-cyan-500 uppercase tracking-[0.3em] mb-1">Neural Network</span>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
                Initialize Asset
                {isPro && <span className="text-[10px] font-black bg-yellow-500 text-black px-2 py-0.5 rounded-full uppercase tracking-tighter">PRO</span>}
              </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-all"
          >
            <Icon name="X" className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-10 overflow-y-auto space-y-10 scrollbar-hide">
          
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono uppercase tracking-wider rounded-2xl flex items-center gap-3">
              <Icon name="Alert" className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Image Upload Area */}
          <div className="space-y-4">
            <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest ml-1">Visual Data</label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`relative h-80 border border-dashed rounded-[2rem] flex flex-col items-center justify-center cursor-pointer transition-all duration-700 overflow-hidden group ${
                selectedImage 
                ? 'border-cyan-500/30 bg-black' 
                : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleImageUpload} 
              />
              
              {selectedImage ? (
                <>
                  <img src={selectedImage} alt="Preview" className="w-full h-full object-contain p-4" />
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                    <div className="px-6 py-3 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3">
                      <Icon name="UploadCloud" className="w-4 h-4" />
                      Re-Initialize
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center p-10">
                  <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-400 group-hover:scale-110 transition-transform duration-500">
                    <Icon name="UploadCloud" className="w-6 h-6" />
                  </div>
                  <p className="text-white font-black text-sm uppercase tracking-widest">Upload Asset</p>
                  <p className="text-slate-500 text-[10px] font-mono mt-2 uppercase tracking-widest">MAX 5MB • PNG/JPG</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-10">
            
            {/* Prompt Input */}
            <div className="space-y-4">
                <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest ml-1">Neural Prompt</label>
                <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the source prompt..."
                rows={4}
                className="w-full bg-white/[0.02] border border-white/10 rounded-[1.5rem] px-6 py-5 text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/30 transition-all resize-none font-medium"
                />
            </div>

            {/* Description Input */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest ml-1">Asset Backstory</label>
                  <span className={`text-[10px] font-mono ${description.length >= MAX_DESC_LENGTH ? 'text-red-400' : 'text-slate-600'}`}>
                      {description.length} / {isPro ? '∞' : MAX_DESC_LENGTH}
                  </span>
              </div>
              <textarea 
                value={description}
                onChange={handleDescriptionChange}
                placeholder="The narrative behind this creation..."
                rows={3}
                className="w-full bg-white/[0.02] border border-white/10 rounded-[1.5rem] px-6 py-5 text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/30 transition-all resize-none font-medium"
              />
              {!isPro && (
                  <p className="text-[10px] font-mono text-yellow-500/50 flex items-center gap-2 uppercase tracking-wider">
                      <Icon name="Lock" className="w-3 h-3" />
                      PRO Membership required for extended narratives
                  </p>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-10 py-8 border-t border-white/5 flex justify-end gap-4">
          <button 
            onClick={onClose}
            className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-white transition-colors"
          >
            Abort
          </button>
          <button 
            onClick={handleSubmit}
            className="px-10 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-white/5 hover:bg-cyan-400 transition-all duration-500 transform active:scale-95"
          >
            Finalize & Sync
          </button>
        </div>

      </div>
    </div>
  );
};

export default CreatePostModal;
