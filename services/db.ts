import { Upazilla, Union, VotingCenter, ImportantPerson, Markha } from '../types';

// Declare process for TS environment
declare const process: { env: { IMGBB_KEY?: string; NODE_ENV?: string } };

// Use process.env.NODE_ENV which is injected by Vite at build time
const isDevelopment = process.env.NODE_ENV === 'development';

// In development, we hit the specific port 3000. 
// In production (when served by Express), we use the relative path '/api'.
const API_URL = isDevelopment ? 'http://localhost:3000/api' : '/api';

// Helper to handle API requests
const apiCall = async (endpoint: string, method: string = 'GET', body?: any, upazillaId?: string) => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (upazillaId) {
        headers['x-upazilla-id'] = upazillaId;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'API Request Failed');
    }
    return response.json();
};

// --- Upazilla Operations (Super Admin) ---

export const getUpazillas = async (): Promise<Upazilla[]> => {
    return apiCall('/upazillas');
};

export const getUpazilla = async (id: string): Promise<Upazilla> => {
    return apiCall(`/upazillas/${id}`);
};

export const createUpazilla = async (upazilla: Upazilla): Promise<void> => {
    await apiCall('/upazillas', 'POST', upazilla);
};

export const updateUpazilla = async (upazilla: Upazilla): Promise<void> => {
    await apiCall(`/upazillas/${upazilla.id}`, 'PUT', upazilla);
};

export const deleteUpazilla = async (id: string): Promise<void> => {
    await apiCall(`/upazillas/${id}`, 'DELETE');
}

// --- Union Operations (Upazilla Admin) ---

export const getUnions = async (upazillaId: string): Promise<Union[]> => {
    return apiCall('/unions', 'GET', undefined, upazillaId);
};

export const createUnion = async (union: Union): Promise<void> => {
    await apiCall('/unions', 'POST', union, union.upazillaId);
};

// --- Center Operations (Upazilla Admin) ---

export const getCenters = async (unionId: string, upazillaId: string): Promise<VotingCenter[]> => {
    // Returns LITE version: [{id, name, location, unionId}]
    const qs = new URLSearchParams({ unionId }).toString();
    return apiCall(`/centers?${qs}`, 'GET', undefined, upazillaId);
};

export const getCenterDetails = async (centerId: string, upazillaId: string): Promise<VotingCenter> => {
    // Returns FULL version: Includes officers, images, etc.
    return apiCall(`/centers/${centerId}`, 'GET', undefined, upazillaId);
};

export const createCenter = async (center: VotingCenter, upazillaId: string): Promise<void> => {
    await apiCall('/centers', 'POST', center, upazillaId);
};

export const updateCenter = async (center: VotingCenter, upazillaId: string): Promise<void> => {
    await apiCall(`/centers/${center.id}`, 'PUT', center, upazillaId);
};

export const deleteCenter = async (_id: string, _upazillaId: string): Promise<void> => {
    // Implement delete in server if needed
    return;
}

// --- Important Persons Operations ---

export const getImportantPersons = async (upazillaId: string): Promise<ImportantPerson[]> => {
    return apiCall('/important-persons', 'GET', undefined, upazillaId);
};

export const createImportantPerson = async (person: ImportantPerson, upazillaId: string): Promise<void> => {
    await apiCall('/important-persons', 'POST', person, upazillaId);
};

export const updateImportantPerson = async (person: ImportantPerson, upazillaId: string): Promise<void> => {
    await apiCall(`/important-persons/${person.id}`, 'PUT', person, upazillaId);
};

export const deleteImportantPerson = async (id: string, upazillaId: string): Promise<void> => {
    await apiCall(`/important-persons/${id}`, 'DELETE', undefined, upazillaId);
};

// --- Markha (Symbols) Operations ---

export const getMarkhas = async (upazillaId: string): Promise<Markha[]> => {
    return apiCall('/markhas', 'GET', undefined, upazillaId);
};

export const createMarkha = async (markha: Markha, upazillaId: string): Promise<void> => {
    await apiCall('/markhas', 'POST', markha, upazillaId);
};

export const updateMarkha = async (markha: Markha, upazillaId: string): Promise<void> => {
    await apiCall(`/markhas/${markha.id}`, 'PUT', markha, upazillaId);
};

export const deleteMarkha = async (id: string, upazillaId: string): Promise<void> => {
    await apiCall(`/markhas/${id}`, 'DELETE', undefined, upazillaId);
};


// --- Image Utility ---

// Uploads image to ImgBB and returns the hosted URL
export const uploadImageToImgBB = async (file: File, customKey?: string): Promise<string> => {
    // Prioritize specific Upazilla key, fallback to env variable
    const apiKey = customKey || process.env.IMGBB_KEY;
    
    if (!apiKey) {
        throw new Error("ImgBB API Key is missing. Please contact Super Admin.");
    }

    const formData = new FormData();
    formData.append('image', file);
    
    try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        
        if (data.success) {
            return data.data.url;
        } else {
            throw new Error(data.error?.message || "ImgBB Upload Failed");
        }
    } catch (error) {
        console.error("Image upload failed:", error);
        throw error;
    }
};