import { GoogleGenAI, Type } from "@google/genai";
import { AccountingRecord } from "../types";

// NOTE: In a real production app, never expose keys in client-side code.
// This assumes process.env.API_KEY is injected by the build system/environment.
const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

export const generateChatResponse = async (history: { role: string, parts: { text: string }[] }[], newMessage: string) => {
  try {
    const model = 'gemini-3-flash-preview'; 
    
    // Construct chat history for the SDK
    const contents = [
        ...history.map(msg => ({
            role: msg.role === 'model' ? 'model' : 'user',
            parts: msg.parts
        })),
        {
            role: 'user',
            parts: [{ text: newMessage }]
        }
    ];

    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: `You are a helpful, witty, and concise intelligent voice assistant named 'Xiaoyi'. 
        You provide short, spoken-style responses suitable for TTS. 
        If the user asks to play music, select a song relevant to their request (or a random popular one if unspecified) and include the tag [MUSIC: Song Title|Artist Name] at the start of your response. 
        Example: "[MUSIC: Sunny Day|Jay Chou] OK, playing Sunny Day for you."`,
      }
    });

    return response.text || "I'm sorry, I didn't catch that.";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "I'm having trouble connecting to the network right now.";
  }
};

export const analyzeReceipt = async (base64Image: string): Promise<Partial<AccountingRecord> | null> => {
  try {
    const model = 'gemini-2.5-flash-image';

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg', // Assuming jpeg for simplicity, or detect from file
              data: base64Image
            }
          },
          {
            text: "Analyze this receipt image. Extract the total amount, merchant name, date, and a category (e.g., Food, Transport, Shopping). Return JSON."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                amount: { type: Type.NUMBER },
                merchant: { type: Type.STRING },
                date: { type: Type.STRING },
                category: { type: Type.STRING }
            },
            required: ["amount", "merchant", "category"]
        }
      }
    });

    if (response.text) {
        return JSON.parse(response.text);
    }
    return null;
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    return null;
  }
};
