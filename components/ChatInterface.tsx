
import React, { useState, useRef, useEffect } from 'react';
import { Icon } from './Icons';
import { Message, GeminiModel } from '../types';
import { streamGeminiResponse, generateImageFromText } from '../services/geminiService';
import { authService } from '../services/authService';

const SUGGESTED_PROMPTS = [
  "A cyberpunk city street at night with neon lights",
  "A cute robot gardening in a futuristic greenhouse",
  "An oil painting of a cottage by a lake at sunset",
  "A futuristic spaceship landing on Mars, cinematic",
  "A magical forest with glowing mushrooms and fairies",
  "Portrait of a warrior in golden armor, digital art"
];

const ASPECT_RATIOS = ["1:1", "16:9", "9:16", "4:3", "3:4"];
const STYLE_PRESETS = ["None", "Cinematic", "Photorealistic", "Anime", "Digital Art", "Oil Painting", "3D Render", "Sketch", "Cyberpunk"];

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hello! I'm your NeuraFlow AI assistant. You can chat with me, show me images to analyze, or generate new images using the Sparkle button.",
      timestamp: Date.now(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isImageMode, setIsImageMode] = useState(false);
  
  // Image Generation Settings
  const [showSettings, setShowSettings] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [stylePreset, setStylePreset] = useState('None');
  const [negativePrompt, setNegativePrompt] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleImageMode = () => {
    setIsImageMode(prev => {
      const newMode = !prev;
      if (newMode) {
        setSelectedImage(null); // Clear upload when entering image mode
      } else {
        setShowSettings(false); // Hide settings when exiting
      }
      return newMode;
    });
  };

  // Helper to check if settings are non-default
  const isSettingsModified = stylePreset !== 'None' || negativePrompt.trim() !== '' || aspectRatio !== '1:1';

  const resetSettings = () => {
    setAspectRatio('1:1');
    setStylePreset('None');
    setNegativePrompt('');
  };

  const handleSendMessage = async () => {
    if ((!inputValue.trim() && !selectedImage) || isLoading) return;

    // --- Usage Limit Check ---
    const user = authService.getCurrentUser();
    
    if (user) {
        // Registered User Check
        const { allowed } = authService.checkAndIncrementUsage(user.id);
        if (!allowed) {
             setMessages(prev => [...prev, {
                 id: Date.now().toString(),
                 role: 'model',
                 text: "⚠️ **Daily Limit Reached**\n\nYou have reached your daily limit for AI interactions on the Free plan. Upgrade to **Pro** for unlimited access.",
                 timestamp: Date.now(),
             }]);
             return;
        }
    } else {
        // Guest Limit Check (5 interactions)
        const GUEST_KEY = 'neura_guest_chat_usage';
        const currentUsage = parseInt(localStorage.getItem(GUEST_KEY) || '0');
        if (currentUsage >= 5) {
             setMessages(prev => [...prev, {
                 id: Date.now().toString(),
                 role: 'model',
                 text: "🔒 **Guest Limit Reached**\n\nYou've reached the limit for guest interactions. Please **Log In** or **Sign Up** to continue using NeuraFlow AI.",
                 timestamp: Date.now(),
             }]);
             return;
        }
        localStorage.setItem(GUEST_KEY, (currentUsage + 1).toString());
    }
    // -------------------------

    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputValue,
      image: selectedImage || undefined,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInputValue('');
    const imageToSend = selectedImage;
    setSelectedImage(null);
    setIsLoading(true);
    setShowSettings(false); // Collapse settings on send

    const modelMessageId = (Date.now() + 1).toString();

    // Placeholder message
    setMessages((prev) => [
      ...prev,
      {
        id: modelMessageId,
        role: 'model',
        text: isImageMode ? 'Generating image...' : '',
        timestamp: Date.now(),
        isStreaming: true,
      },
    ]);

    try {
      if (isImageMode) {
        // Image Generation Mode
        let prompt = newUserMessage.text || "A surprise image";
        
        // Append style and negative prompt for enhanced generation
        if (stylePreset && stylePreset !== 'None') {
            prompt += `, ${stylePreset} style, high quality, detailed`;
        }
        if (negativePrompt) {
            prompt += `. Do not include: ${negativePrompt}`;
        }

        const generatedImageBase64 = await generateImageFromText(prompt, { aspectRatio });
        
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === modelMessageId
              ? { 
                  ...msg, 
                  text: `Generated image based on: "${newUserMessage.text}"\nDetails: ${stylePreset !== 'None' ? stylePreset : 'Standard'}, ${aspectRatio}`, 
                  image: generatedImageBase64,
                  isStreaming: false 
                }
              : msg
          )
        );
      } else {
        // Text/Vision Chat Mode
        // Use Gemini Pro for Image Analysis (Vision capabilities)
        const modelToUse = imageToSend ? GeminiModel.PRO : GeminiModel.FLASH;
        const prompt = newUserMessage.text || "Analyze this image.";
        
        const stream = streamGeminiResponse(
          modelToUse,
          prompt,
          imageToSend || undefined
        );

        let fullText = '';
        
        for await (const chunk of stream) {
          fullText += chunk;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === modelMessageId
                ? { ...msg, text: fullText }
                : msg
            )
          );
        }
        
        // Final update to remove streaming flag
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === modelMessageId ? { ...msg, isStreaming: false } : msg
          )
        );
      }

    } catch (error: any) {
      console.error("AI Request Failed:", error);
      let errorMessage = "I'm sorry, I encountered an unexpected error. Please try again.";
      
      // Normalize error message for checking
      const errString = (error.message || error.toString()).toLowerCase();

      // Granular Error Feedback based on error content
      if (errString.includes("safety") || errString.includes("blocked") || errString.includes("harm")) {
          errorMessage = "🛡️ **Safety Filter Triggered**\n\nThe content was flagged by safety settings. Please try a different prompt or description.";
      } else if (errString.includes("quota") || errString.includes("429") || errString.includes("resource exhausted")) {
          errorMessage = "⏳ **Usage Limit Reached**\n\nThe AI service is currently busy or quota exceeded. Please try again in a few minutes.";
      } else if (errString.includes("network") || errString.includes("fetch") || errString.includes("offline")) {
          errorMessage = "🌐 **Connection Error**\n\nUnable to reach the AI service. Please check your internet connection.";
      } else if (errString.includes("503") || errString.includes("overloaded") || errString.includes("busy")) {
          errorMessage = "🔥 **High Traffic**\n\nThe model is currently experiencing high load. Please retry shortly.";
      } else if (errString.includes("api key") || errString.includes("403") || errString.includes("permission")) {
          errorMessage = "🔑 **Access Error**\n\nThere seems to be an issue with the API configuration.";
      } else if (errString.includes("candidate")) {
          errorMessage = "⚠️ **Generation Failed**\n\nThe model could not generate a valid response for this input.";
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'model',
          text: errorMessage,
          timestamp: Date.now(),
        },
      ]);
      // Remove the placeholder if it failed completely
      setMessages(prev => prev.filter(msg => !(msg.id === modelMessageId && msg.isStreaming)));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] relative overflow-hidden scrollbar-hide">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-purple-500/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-cyan-500/5 rounded-full blur-[120px]"></div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-10 z-10 scroll-smooth scrollbar-hide">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div
              className={`max-w-[85%] md:max-w-[70%] rounded-[2rem] p-6 md:p-8 shadow-2xl backdrop-blur-3xl border transition-all duration-500 ${
                msg.role === 'user'
                  ? 'bg-white text-black border-white/20 rounded-br-none'
                  : 'bg-white/[0.03] border-white/5 text-slate-100 rounded-bl-none'
              }`}
            >
              {/* Image Display */}
              {msg.image && (
                <div className="mb-6 overflow-hidden rounded-2xl border border-white/10 bg-black/40 relative group">
                  <img src={msg.image} alt="Content" className="max-h-[500px] w-full object-contain mx-auto transition-transform duration-700 group-hover:scale-105" />
                  {msg.role === 'model' && !msg.isStreaming && (
                    <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/80 rounded-full text-[10px] text-cyan-400 font-black uppercase tracking-widest backdrop-blur-xl border border-white/10">
                      Neural Synthesis
                    </div>
                  )}
                </div>
              )}
              
              {/* Text Content */}
              <div className={`prose prose-invert prose-sm md:prose-base leading-relaxed whitespace-pre-wrap font-medium ${msg.role === 'user' ? 'text-black prose-headings:text-black' : 'text-slate-200'}`}>
                {msg.text}
                {msg.isStreaming && (
                  <span className="inline-block w-1.5 h-4 ml-2 align-middle bg-cyan-400 animate-pulse"></span>
                )}
              </div>
              
              {/* Timestamp */}
              <div className={`mt-4 text-[10px] font-mono uppercase tracking-widest opacity-40 ${msg.role === 'user' ? 'text-black' : 'text-slate-500'}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 md:p-12 z-20 relative">
        
        {/* Suggested Prompts */}
        {isImageMode && !inputValue && !showSettings && (
          <div className="max-w-4xl mx-auto mb-6 overflow-x-auto whitespace-nowrap scrollbar-hide px-2 pb-2">
             <div className="flex gap-3">
                {SUGGESTED_PROMPTS.map((prompt, index) => (
                   <button
                      key={index}
                      onClick={() => setInputValue(prompt)}
                      className="px-6 py-3 bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/20 rounded-full text-[10px] font-mono text-slate-400 hover:text-white transition-all backdrop-blur-3xl uppercase tracking-widest flex-shrink-0"
                   >
                      {prompt}
                   </button>
                ))}
             </div>
          </div>
        )}

        {/* Advanced Settings Panel */}
        {isImageMode && showSettings && (
             <div className="max-w-4xl mx-auto mb-8 bg-black border border-cyan-500/30 rounded-[2rem] p-8 shadow-2xl animate-fade-in backdrop-blur-3xl">
                 <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                     <div className="flex flex-col">
                        <span className="text-[10px] font-mono text-cyan-500 uppercase tracking-[0.3em] mb-1">Neural Parameters</span>
                        <h3 className="text-xl font-black text-white tracking-tighter uppercase">Synthesis Configuration</h3>
                     </div>
                     <div className="flex items-center gap-4">
                        {isSettingsModified && (
                          <button 
                            onClick={resetSettings}
                            className="text-[10px] text-red-400 hover:text-red-300 font-black uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-red-500/10 transition-all"
                          >
                            Reset
                          </button>
                        )}
                        <button onClick={() => setShowSettings(false)} className="p-3 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all">
                            <Icon name="X" className="w-4 h-4" />
                        </button>
                     </div>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                     {/* Aspect Ratio */}
                     <div className="space-y-4">
                         <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest ml-1">Aspect Ratio</label>
                         <div className="flex gap-3 flex-wrap">
                             {ASPECT_RATIOS.map(ratio => (
                                 <button
                                     key={ratio}
                                     onClick={() => setAspectRatio(ratio)}
                                     className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all duration-500 ${
                                         aspectRatio === ratio 
                                         ? 'bg-cyan-500 text-white border-cyan-500 shadow-lg shadow-cyan-500/20' 
                                         : 'bg-white/[0.03] border-white/5 text-slate-500 hover:text-white hover:border-white/20'
                                     }`}
                                 >
                                     {ratio}
                                 </button>
                             ))}
                         </div>
                     </div>

                     {/* Style Preset */}
                     <div className="space-y-4">
                         <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest ml-1">Style Preset</label>
                         <div className="relative">
                             <select
                                 value={stylePreset}
                                 onChange={(e) => setStylePreset(e.target.value)}
                                 className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-cyan-500 transition-all appearance-none cursor-pointer"
                             >
                                 {STYLE_PRESETS.map(style => (
                                     <option key={style} value={style} className="bg-black text-white">{style}</option>
                                 ))}
                             </select>
                             <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                                <Icon name="ChevronDown" className="w-4 h-4" />
                             </div>
                         </div>
                     </div>
                     
                     {/* Negative Prompt */}
                     <div className="md:col-span-2 space-y-4">
                         <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest ml-1">Negative Directives</label>
                         <input
                             type="text"
                             value={negativePrompt}
                             onChange={(e) => setNegativePrompt(e.target.value)}
                             placeholder="e.g. blurry, low quality, distorted"
                             className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-6 py-4 text-sm text-white focus:outline-none focus:border-cyan-500 placeholder-slate-700 transition-all"
                         />
                     </div>
                 </div>
             </div>
        )}

        <div className={`max-w-5xl mx-auto relative bg-black border rounded-[2.5rem] shadow-2xl p-3 flex flex-col gap-2 transition-all duration-700 ${isImageMode ? 'border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.1)]' : 'border-white/10'}`}>
          
          {/* Selected Image Preview */}
          {selectedImage && !isImageMode && (
            <div className="relative inline-block w-32 h-32 m-4 rounded-2xl overflow-hidden border border-white/10 group animate-fade-in">
              <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                <button
                  onClick={() => setSelectedImage(null)}
                  className="bg-white p-2 rounded-xl text-black hover:bg-red-500 hover:text-white transition-all"
                >
                  <Icon name="X" className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Mode Indicator */}
          {isImageMode && (
             <div className="px-6 py-3 bg-cyan-500/10 text-cyan-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-t-[1.5rem] mx-2 mt-2 flex items-center justify-between border-b border-cyan-500/10">
                <div className="flex items-center gap-3">
                    <Icon name="Sparkles" className="w-3 h-3 animate-pulse" />
                    Neural Synthesis Mode
                </div>
                <div className="text-[10px] font-mono text-cyan-300/50 hidden md:block">
                    {aspectRatio} • {stylePreset}
                </div>
             </div>
          )}

          <div className="flex items-end gap-4 p-2">
             {/* Image Gen Toggle */}
             <button
              onClick={toggleImageMode}
              className={`p-4 rounded-2xl transition-all duration-500 relative group ${
                isImageMode 
                ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20' 
                : 'text-slate-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon name="Sparkles" className={`w-6 h-6 transition-transform duration-500 ${isImageMode ? 'scale-110' : ''}`} />
            </button>
            
            {/* Settings Toggle */}
            {isImageMode && (
                <div className="relative">
                  <button
                      onClick={() => setShowSettings(!showSettings)}
                      className={`p-4 rounded-2xl transition-all duration-500 ${
                          showSettings 
                          ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20' 
                          : isSettingsModified 
                            ? 'text-cyan-400 bg-white/5 border border-cyan-500/20'
                            : 'text-slate-500 hover:text-white hover:bg-white/5'
                      }`}
                  >
                      <Icon name="Sliders" className="w-6 h-6" />
                  </button>
                  {isSettingsModified && !showSettings && (
                      <span className="absolute top-3 right-3 w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)]"></span>
                  )}
                </div>
            )}

             {/* File Upload Button */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={isImageMode}
            />
            {!isImageMode && (
                <button
                onClick={() => fileInputRef.current?.click()}
                className="p-4 rounded-2xl transition-all text-slate-500 hover:text-white hover:bg-white/5"
                >
                <Icon name="Image" className="w-6 h-6" />
                </button>
            )}

            {/* Text Input */}
            <div className="flex-1 relative pb-2">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isImageMode ? "Describe the asset to synthesize..." : "Ask anything or upload a photo..."}
                  className="w-full bg-transparent text-white placeholder-slate-700 focus:outline-none resize-none py-4 pr-12 max-h-48 min-h-[60px] scrollbar-hide font-medium"
                  rows={1}
                />
                 {/* Clear Text Button */}
                {inputValue && (
                  <button 
                    onClick={() => setInputValue('')}
                    className="absolute right-0 top-4 text-slate-700 hover:text-white transition-colors p-2"
                  >
                     <Icon name="X" className="w-4 h-4" />
                  </button>
                )}
            </div>

            {/* Send Button */}
            <button
              onClick={handleSendMessage}
              disabled={isLoading || (!inputValue.trim() && !selectedImage)}
              className={`p-5 rounded-2xl transition-all duration-700 ${
                isLoading || (!inputValue.trim() && !selectedImage)
                  ? 'bg-white/5 text-slate-700 cursor-not-allowed'
                  : 'bg-white text-black shadow-2xl shadow-white/5 hover:bg-cyan-400 transform hover:-translate-y-1'
              }`}
            >
              <Icon name="Send" className="w-6 h-6" />
            </button>
          </div>
        </div>
        <div className="text-center mt-6">
            <p className="text-[10px] font-mono text-slate-700 uppercase tracking-[0.4em]">Neural Processing Unit • Gemini 3.1 Pro</p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
