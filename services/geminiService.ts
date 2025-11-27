import { GoogleGenAI } from "@google/genai";

const getMimeType = () => {
  if (MediaRecorder.isTypeSupported('audio/webm; codecs=opus')) {
    return 'audio/webm';
  }
  if (MediaRecorder.isTypeSupported('audio/mp4')) {
    return 'audio/mp4';
  }
  return 'audio/wav'; // Fallback
};

// Helper to convert Blob/File to Base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64String = result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const base64Data = await blobToBase64(audioBlob);
  const mimeType = audioBlob.type || getMimeType();

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: `
            You are a professional transcriber for a personal diary app. 
            1. Transcribe the spoken audio exactly as it is said.
            2. If the user corrects themselves, transcribe the final intended meaning if possible, otherwise write verbatim.
            3. Format the text into clean paragraphs if it is long.
            4. Do not add any introductory or concluding remarks. Just the transcription.
            5. If the audio is silent or unintelligible, return "[Unintelligible audio]".
            `
          }
        ]
      }
    });

    return response.text || "";
  } catch (error) {
    console.error("Gemini Audio Transcription Error:", error);
    throw error;
  }
};

export const transcribeImage = async (imageFile: File): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const base64Data = await blobToBase64(imageFile);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: imageFile.type, // e.g., image/jpeg, image/png
              data: base64Data
            }
          },
          {
            text: `
            You are a helpful assistant for a diary app. 
            The user has uploaded an image of a handwritten diary entry.
            1. Perform OCR to transcribe the handwritten text into digital text.
            2. Ignore any drawings, doodles, or marginalia unless they are text.
            3. Format the output clearly.
            4. Do not add comments like "Here is the transcription". Just provide the text found in the image.
            5. If the image contains no text, return "[No text detected in image]".
            `
          }
        ]
      }
    });

    return response.text || "";
  } catch (error) {
    console.error("Gemini Image Transcription Error:", error);
    throw error;
  }
};
