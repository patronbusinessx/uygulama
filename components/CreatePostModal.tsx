
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-[#0f172a] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Icon name="Plus" className="w-5 h-5 text-cyan-400" />
                Create New Post
              </h2>
              {isPro && <span className="text-[10px] font-bold bg-yellow-500 text-black px-2 py-0.5 rounded uppercase">Pro Unlocked</span>}
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <Icon name="X" className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
          
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Image Upload Area */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Artwork Image</label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`relative h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group ${
                selectedImage 
                ? 'border-cyan-500/50 bg-slate-900' 
                : 'border-slate-700 bg-slate-800/30 hover:bg-slate-800/50 hover:border-slate-600'
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
                  <img src={selectedImage} alt="Preview" className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white font-medium flex items-center gap-2">
                      <Icon name="UploadCloud" className="w-5 h-5" />
                      Change Image
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center p-6">
                  <div className="w-12 h-12 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                    <Icon name="UploadCloud" className="w-6 h-6" />
                  </div>
                  <p className="text-slate-300 font-medium">Click to upload image</p>
                  <p className="text-slate-500 text-sm mt-1">PNG, JPG up to 5MB</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            
            {/* Prompt Input (Moved up as it's more important now) */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">Prompt Used</label>
                <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the prompt you used to generate this image..."
                rows={4}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all placeholder-slate-600 resize-none"
                />
            </div>

            {/* Description Input */}
            <div className="space-y-2">
              <div className="flex justify-between">
                  <label className="block text-sm font-medium text-slate-300">Description (Optional)</label>
                  <span className={`text-xs ${description.length >= MAX_DESC_LENGTH ? 'text-red-400' : 'text-slate-500'}`}>
                      {description.length} / {isPro ? '∞' : MAX_DESC_LENGTH}
                  </span>
              </div>
              <textarea 
                value={description}
                onChange={handleDescriptionChange}
                placeholder="Share the story behind your creation..."
                rows={2}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all placeholder-slate-600 resize-none"
              />
              {!isPro && (
                  <p className="text-[10px] text-yellow-500/80 flex items-center gap-1">
                      <Icon name="Lock" className="w-3 h-3" />
                      Free users are limited to 100 characters. Upgrade to PRO for unlimited descriptions.
                  </p>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex justify-end gap-3 bg-slate-900/50">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg font-bold shadow-lg shadow-cyan-500/20 transform active:scale-95 transition-all"
          >
            Publish Post
          </button>
        </div>

      </div>
    </div>
  );
};

export default CreatePostModal;
