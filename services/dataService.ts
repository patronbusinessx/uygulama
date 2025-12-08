
import { ContactMessage, UserReport } from '../types';

const CONTACT_STORAGE_KEY = 'nebula_contact_messages';
const REPORTS_STORAGE_KEY = 'nebula_reports';

export const dataService = {
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
