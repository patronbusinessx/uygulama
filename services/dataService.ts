
import { ContactMessage, UserReport, GeneratedImage } from '../types';

const CONTACT_STORAGE_KEY = 'nebula_contact_messages';
const REPORTS_STORAGE_KEY = 'nebula_reports';
const IMAGES_STORAGE_KEY = 'nebula_generated_images';

export const dataService = {
  // --- Generated Images ---
  saveGeneratedImage: (data: Omit<GeneratedImage, 'id' | 'timestamp'>) => {
    const existing: GeneratedImage[] = JSON.parse(localStorage.getItem(IMAGES_STORAGE_KEY) || '[]');
    const newImage: GeneratedImage = {
      ...data,
      id: Math.random().toString(36).substring(2, 11),
      timestamp: Date.now()
    };
    existing.push(newImage);
    localStorage.setItem(IMAGES_STORAGE_KEY, JSON.stringify(existing));
    return newImage;
  },

  getUserGeneratedImages: (userId: string): GeneratedImage[] => {
    const all: GeneratedImage[] = JSON.parse(localStorage.getItem(IMAGES_STORAGE_KEY) || '[]');
    return all.filter(img => img.userId === userId).sort((a, b) => b.timestamp - a.timestamp);
  },

  // --- Contact Messages ---

  saveContactMessage: (data: Omit<ContactMessage, 'id' | 'timestamp' | 'status'>) => {
    const existing: ContactMessage[] = JSON.parse(localStorage.getItem(CONTACT_STORAGE_KEY) || '[]');
    
    const newMessage: ContactMessage = {
      ...data,
      id: Date.now().toString(),
      timestamp: Date.now(),
      status: 'new'
    };

    existing.push(newMessage);
    localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(existing));
    return newMessage;
  },

  getAllMessages: (): ContactMessage[] => {
    return JSON.parse(localStorage.getItem(CONTACT_STORAGE_KEY) || '[]');
  },

  // --- Reports ---

  saveReport: (data: Omit<UserReport, 'id' | 'timestamp' | 'status'>) => {
    const existing: UserReport[] = JSON.parse(localStorage.getItem(REPORTS_STORAGE_KEY) || '[]');

    const newReport: UserReport = {
      ...data,
      id: Date.now().toString(),
      timestamp: Date.now(),
      status: 'Pending'
    };

    existing.push(newReport);
    localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(existing));
    return newReport;
  },

  getAllReports: (): UserReport[] => {
    return JSON.parse(localStorage.getItem(REPORTS_STORAGE_KEY) || '[]');
  }
};
