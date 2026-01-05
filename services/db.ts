import { Upazilla, Union, VotingCenter } from '../types';

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

export const createUpazilla = async (upazilla: Upazilla): Promise<void> => {
    await apiCall('/upazillas', 'POST', upazilla);
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

// --- Image Utility ---

// Uploads image to ImgBB and returns the hosted URL
export const uploadImageToImgBB = async (file: File): Promise<string> => {
    const apiKey = process.env.IMGBB_KEY;
    if (!apiKey) {
        throw new Error("IMGBB_KEY is missing in environment variables");
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