import { GoogleGenAI } from "@google/genai";
import { VotingCenter } from '../types';

// Declare process to avoid 'Cannot find name' TS errors
declare const process: { env: { API_KEY?: string } };

// Initialize Gemini Client safely
// process.env is injected by Vite config, but we default to empty string to prevent init crashes
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateSecurityPlan = async (center: VotingCenter): Promise<string> => {
  if (!apiKey) return "API Key not configured. Please add your Gemini API Key to the .env file.";

  try {
    const prompt = `
      Act as a security expert for an election.
      Create a brief, bulleted security plan for a voting center with the following details:
      
      Center Name: ${center.name}
      Location: ${center.location}
      Key Personnel:
      - Presiding Officer: ${center.presidingOfficer?.name || 'N/A'} (${center.presidingOfficer?.phone || 'N/A'})
      - Police Officer: ${center.policeOfficer?.name || 'N/A'}

      The plan should include crowd control, ballot box security, and communication protocols.
      Keep it under 200 words.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "No plan generated.";
  } catch (error) {
    console.error("AI Generation failed:", error);
    return "Failed to generate security plan. Please check your network or API key.";
  }
};

export const analyzeUpazillaStats = async (unionCount: number, centerCount: number): Promise<string> => {
     if (!apiKey) return "API Key not configured.";

     try {
        const prompt = `
            I have an Upazilla with ${unionCount} unions and ${centerCount} total voting centers.
            Briefly analyze if this ratio seems manageable or if more unions might be needed for administrative efficiency.
            Assume a standard rural density.
        `;
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
        return response.text || "Analysis unavailable.";
     } catch (error) {
         return "Could not perform analysis.";
     }
}