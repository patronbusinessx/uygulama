import React, { useState, useRef, useEffect } from 'react';
import { Icon } from './Icons';
import { Message, GeminiModel } from '../types';
import { streamGeminiResponse, generateImageFromText } from '../services/geminiService';

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

  const handleSendMessage = async () => {
    if ((!inputValue.trim() && !selectedImage) || isLoading) return;

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
        
        // Append style and negative prompt
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
      console.error(error);
      let errorMessage = "I'm sorry, I encountered an error while processing your request.";
      
      // Handle safety blocks specifically
      if (error.message && (error.message.includes("SAFETY") || error.message.includes("blocked"))) {
          errorMessage = "This content was blocked by safety filters. Please try a different prompt.";
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
    <div className="flex flex-col h-full bg-slate-900 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[20%] w-96 h-96 bg-purple-600/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-20%] right-[20%] w-96 h-96 bg-cyan-600/10 rounded-full blur-[100px]"></div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 z-10 scroll-smooth">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-4 md:p-6 shadow-xl backdrop-blur-md border ${
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-cyan-600 to-blue-700 border-cyan-500/30 text-white rounded-br-none'
                  : 'bg-slate-800/60 border-slate-700/50 text-slate-100 rounded-bl-none'
              }`}
            >
              {/* Image Display (User Upload or Model Generation) */}
              {msg.image && (
                <div className="mb-4 overflow-hidden rounded-lg border border-white/10 bg-black/20 relative group">
                  <img src={msg.image} alt="Content" className="max-h-96 w-auto object-contain mx-auto" />
                  {msg.role === 'model' && !msg.isStreaming && (
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 rounded text-[10px] text-cyan-400 font-medium uppercase tracking-wider backdrop-blur-md">
                      AI Generated
                    </div>
                  )}
                </div>
              )}
              
              {/* Text Content */}
              <div className="prose prose-invert prose-sm md:prose-base leading-relaxed whitespace-pre-wrap">
                {msg.text}
                {msg.isStreaming && (
                  <span className="inline-block w-2 h-4 ml-1 align-middle bg-cyan-400 animate-pulse"></span>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-8 z-20">
        
        {/* Suggested Prompts (Image Mode Only) */}
        {isImageMode && !inputValue && !showSettings && (
          <div className="max-w-4xl mx-auto mb-3 overflow-x-auto whitespace-nowrap scrollbar-hide px-2 pb-2">
             <div className="flex gap-2">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider self-center mr-2">Try:</span>
                {SUGGESTED_PROMPTS.map((prompt, index) => (
                   <button
                      key={index}
                      onClick={() => setInputValue(prompt)}
                      className="px-3 py-1.5 bg-slate-800/80 hover:bg-cyan-500/10 border border-slate-700 hover:border-cyan-500/40 rounded-full text-xs text-slate-300 hover:text-cyan-300 transition-all backdrop-blur-md flex-shrink-0"
                   >
                      {prompt}
                   </button>
                ))}
             </div>
          </div>
        )}

        {/* Advanced Settings Panel */}
        {isImageMode && showSettings && (
             <div className="max-w-4xl mx-auto mb-4 bg-slate-800/90 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-4 shadow-xl animate-fade-in-up">
                 <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
                     <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                         <Icon name="Sliders" className="w-4 h-4" />
                         Generation Settings
                     </h3>
                     <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white">
                         <Icon name="X" className="w-4 h-4" />
                     </button>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {/* Aspect Ratio */}
                     <div>
                         <label className="text-[10px] text-slate-400 font-bold uppercase mb-2 block">Aspect Ratio</label>
                         <div className="flex gap-2 flex-wrap">
                             {ASPECT_RATIOS.map(ratio => (
                                 <button
                                     key={ratio}
                                     onClick={() => setAspectRatio(ratio)}
                                     className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                         aspectRatio === ratio 
                                         ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' 
                                         : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:bg-slate-700'
                                     }`}
                                 >
                                     {ratio}
                                 </button>
                             ))}
                         </div>
                     </div>

                     {/* Style Preset */}
                     <div>
                         <label className="text-[10px] text-slate-400 font-bold uppercase mb-2 block">Style Preset</label>
                         <div className="relative">
                             <select
                                 value={stylePreset}
                                 onChange={(e) => setStylePreset(e.target.value)}
                                 className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                             >
                                 {STYLE_PRESETS.map(style => (
                                     <option key={style} value={style}>{style}</option>
                                 ))}
                             </select>
                         </div>
                     </div>
                     
                     {/* Negative Prompt */}
                     <div className="md:col-span-2">
                         <label className="text-[10px] text-slate-400 font-bold uppercase mb-2 block">Negative Prompt (Exclude)</label>
                         <input
                             type="text"
                             value={negativePrompt}
                             onChange={(e) => setNegativePrompt(e.target.value)}
                             placeholder="e.g. blurry, low quality, distorted"
                             className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 placeholder-slate-600"
                         />
                     </div>
                 </div>
             </div>
        )}

        <div className={`max-w-4xl mx-auto relative bg-slate-800/80 backdrop-blur-xl border rounded-2xl shadow-2xl p-2 flex flex-col gap-2 transition-all focus-within:ring-1 focus-within:ring-cyan-500/20 ${isImageMode ? 'border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.15)]' : 'border-slate-700'}`}>
          
          {/* Selected Image Preview in Input (for uploads) */}
          {selectedImage && !isImageMode && (
            <div className="relative inline-block w-24 h-24 m-2 rounded-lg overflow-hidden border border-slate-600 group">
              <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-1 right-1 bg-black/60 p-1 rounded-full text-white hover:bg-red-500 transition-colors"
              >
                <Icon name="X" className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Mode Indicator */}
          {isImageMode && (
             <div className="px-3 py-1.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 text-xs font-bold uppercase tracking-wider rounded-t-lg mx-1 mt-1 flex items-center justify-between border-b border-cyan-500/20">
                <div className="flex items-center gap-2">
                    <Icon name="Sparkles" className="w-3 h-3" />
                    Image Generation Mode
                </div>
                {/* Current Settings Summary */}
                <div className="text-[10px] text-cyan-300/70 font-mono hidden md:block">
                    {aspectRatio} • {stylePreset}
                </div>
             </div>
          )}

          <div className="flex items-end gap-2 p-1">
             {/* Image Gen Toggle */}
             <button
              onClick={toggleImageMode}
              className={`p-3 rounded-xl transition-all duration-300 relative group ${
                isImageMode 
                ? 'text-cyan-400 bg-cyan-500/10' 
                : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50'
              }`}
              title={isImageMode ? "Switch to Regular Chat" : "Switch to Image Generation"}
            >
              <Icon name="Sparkles" className={`w-6 h-6 transition-transform duration-300 ${isImageMode ? 'scale-110 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : ''}`} />
            </button>
            
            {/* Settings Toggle (Only in Image Mode) */}
            {isImageMode && (
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className={`p-3 rounded-xl transition-all duration-300 ${
                        showSettings 
                        ? 'text-cyan-400 bg-cyan-500/10' 
                        : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50'
                    }`}
                    title="Advanced Settings"
                >
                    <Icon name="Sliders" className="w-6 h-6" />
                </button>
            )}

             {/* File Upload Button (Disabled in Image Mode) */}
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
                className={`p-3 rounded-xl transition-all text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50`}
                title="Upload Image"
                >
                <Icon name="Image" className="w-6 h-6" />
                </button>
            )}

            {/* Text Input */}
            <div className="flex-1 relative">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isImageMode ? "Describe the image you want to create..." : "Ask anything or upload a photo to analyze..."}
                  className="w-full bg-transparent text-slate-200 placeholder-slate-500 focus:outline-none resize-none py-3 pr-10 max-h-32 min-h-[50px] scrollbar-hide"
                  rows={1}
                  style={{ height: 'auto', minHeight: '24px' }}
                />
                 {/* Clear Text Button */}
                {inputValue && (
                  <button 
                    onClick={() => setInputValue('')}
                    className="absolute right-0 top-3 text-slate-500 hover:text-white transition-colors p-1"
                  >
                     <Icon name="X" className="w-4 h-4" />
                  </button>
                )}
                 {/* Character Counter */}
                <div className="absolute right-0 -bottom-5 text-[10px] text-slate-600 font-mono">
                    {inputValue.length} chars
                </div>
            </div>

            {/* Send Button */}
            <button
              onClick={handleSendMessage}
              disabled={isLoading || (!inputValue.trim() && !selectedImage)}
              className={`p-3 rounded-xl transition-all duration-300 ${
                isLoading || (!inputValue.trim() && !selectedImage)
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transform hover:-translate-y-0.5'
              }`}
            >
              <Icon name="Send" className="w-6 h-6" />
            </button>
          </div>
        </div>
        <div className="text-center mt-3">
            <p className="text-[10px] text-slate-600 uppercase tracking-widest opacity-60">Powered by Gemini 2.5 & 3 Pro</p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;