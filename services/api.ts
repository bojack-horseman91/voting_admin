import { Upazilla, Union, VotingCenter, ImportantPerson } from '../types';

// --- API CONFIGURATION ---

// LIVE PRODUCTION SERVER (Render)
const API_BASE_URL = 'https://voting-admin-wfmv.onrender.com/api';

// ANDROID EMULATOR LOCALHOST (Uncomment for local testing)
// const API_BASE_URL = 'http://10.0.2.2:3000/api';

// PHYSICAL DEVICE LOCALHOST (Uncomment and set your PC's IP for local testing on real phone)
// const API_BASE_URL = 'http://192.168.1.X:3000/api';


const apiCall = async (endpoint: string, upazillaId?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (upazillaId) {
    headers['x-upazilla-id'] = upazillaId;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers,
    });
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

export const getUpazillas = async (): Promise<Upazilla[]> => {
  return apiCall('/upazillas');
};

export const getUnions = async (upazillaId: string): Promise<Union[]> => {
  return apiCall('/unions', upazillaId);
};

export const getCenters = async (unionId: string, upazillaId: string): Promise<VotingCenter[]> => {
  const qs = new URLSearchParams({ unionId }).toString();
  return apiCall(`/centers?${qs}`, upazillaId);
};

export const getCenterDetails = async (centerId: string, upazillaId: string): Promise<VotingCenter> => {
  return apiCall(`/centers/${centerId}`, upazillaId);
};

export const getImportantPersons = async (upazillaId: string): Promise<ImportantPerson[]> => {
  return apiCall('/important-persons', upazillaId);
};