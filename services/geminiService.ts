import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GeminiModel } from '../types';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

// Helper to clean base64 string
const cleanBase64 = (base64Data: string) => {
  return base64Data.split(',')[1] || base64Data;
};

// Safety settings to block 18+ content (BLOCK_LOW_AND_ABOVE ensures strict filtering)
const SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_LOW_AND_ABOVE' },
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
];

export const streamGeminiResponse = async function* (
  modelName: string,
  prompt: string,
  imageBase64?: string
) {
  const ai = getAiClient();
  
  // Prepare contents
  const parts: any[] = [];
  
  if (imageBase64) {
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg', // Assuming jpeg for simplicity, works for png too usually
        data: cleanBase64(imageBase64)
      }
    });
  }
  
  parts.push({ text: prompt });

  try {
    const responseStream = await ai.models.generateContentStream({
      model: modelName,
      contents: { parts: parts },
      config: {
        safetySettings: SAFETY_SETTINGS,
      }
    });

    for await (const chunk of responseStream) {
       // Check if text exists to avoid errors on empty chunks
       if (chunk.text) {
         yield chunk.text;
       }
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // Propagate error to be handled by UI
    throw new Error(error.message || "Failed to generate content");
  }
};

interface ImageGenerationOptions {
  aspectRatio?: string;
}

export const generateImageFromText = async (prompt: string, options?: ImageGenerationOptions): Promise<string> => {
  const ai = getAiClient();
  try {
    // Using gemini-2.5-flash-image for standard image generation
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: {
        safetySettings: SAFETY_SETTINGS,
        imageConfig: options?.aspectRatio ? {
            aspectRatio: options.aspectRatio
        } : undefined
      }
    });
    
    // Check if the model returned a safety block or no parts
    if (!response.candidates?.[0]?.content?.parts) {
         throw new Error("Content blocked by safety filters or no image generated.");
    }

    // Iterate to find image part in the response as per guidelines
    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
            const mimeType = part.inlineData.mimeType || 'image/png';
            return `data:${mimeType};base64,${part.inlineData.data}`;
        }
    }
    
    throw new Error("No valid image data found in response. The model might have returned only text.");
  } catch (error: any) {
    console.error("Gemini Image Gen Error:", error);
    throw new Error(error.message || "Failed to generate image due to safety or API error.");
  }
};