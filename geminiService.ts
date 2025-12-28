import { GoogleGenAI, Type } from "@google/genai";
import { AdConfiguration, BrandIdentityOutput } from "./types.ts";
import { Language } from "./translations.ts";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateProductAd = async (config: AdConfiguration, lang: Language): Promise<{imageUrl: string, caption: string}> => {
  if (!config.image) throw new Error("Please upload a product photo.");
  
  const ai = getAI();
  const base64 = config.image.split(',')[1];
  const mime = config.image.split(';')[0].split(':')[1];
  
  // 📸 สร้างรูปภาพด้วย Gemini 3 Pro Image (High Quality)
  const imgRes = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [
        { inlineData: { data: base64, mimeType: mime } },
        { text: `ULTRA-REALISTIC premium commercial product photography. 
                 Context: ${config.atmosphere}. Details: ${config.coffeeDetails}. 
                 Style: High-end studio lighting, sharp focus, cinematic depth of field. 
                 NO TEXT ON IMAGE. 8K resolution.` }
      ],
    },
    config: {
      imageConfig: { 
        aspectRatio: config.aspectRatio === '1:1' ? '1:1' : config.aspectRatio === '9:16' ? '9:16' : '16:9',
        imageSize: "1K"
      }
    }
  });

  let imageUrl = '';
  const parts = imgRes.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData) {
      imageUrl = `data:image/png;base64,${part.inlineData.data}`;
      break;
    }
  }

  if (!imageUrl) throw new Error("Failed to generate image. Please check if your API Key is from a paid project.");

  // ✍️ สร้างแคปชัน
  const textRes = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Write a premium social media caption for ${config.platform} about coffee: ${config.coffeeDetails}. 
               Language: ${lang === 'th' ? 'Thai' : 'Lao'}. 
               Tone: Professional and inviting. For Lao, use modern official spelling.`,
  });

  return { imageUrl, caption: textRes.text || "" };
};

export const generateLabelDesign = async (concept: string, shape: string, bagColor: string, type: string, lang: Language, logo?: string | null): Promise<{imageUrl: string}> => {
  const ai = getAI();
  const parts: any[] = [];
  if (logo) {
    parts.push({ inlineData: { data: logo.split(',')[1], mimeType: logo.split(';')[0].split(':')[1] } });
  }
  parts.push({ text: `3D Mockup of a coffee bag. Color: ${bagColor}. Label Shape: ${shape}. Style: ${concept}. Hyper-realistic studio render.` });

  const res = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts },
    config: { imageConfig: { aspectRatio: "1:1", imageSize: "1K" } }
  });

  let imageUrl = '';
  for (const part of (res.candidates?.[0]?.content?.parts || [])) {
    if (part.inlineData) { imageUrl = `data:image/png;base64,${part.inlineData.data}`; break; }
  }
  return { imageUrl };
};

export const generateBrandStrategy = async (brandName: string, concept: string, lang: Language): Promise<BrandIdentityOutput> => {
  const ai = getAI();
  const res = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Act as a brand expert. Suggest 5 names, a logo concept, and 3 HEX colors for: ${brandName} (${concept}). Language: ${lang === 'th' ? 'Thai' : 'Lao'}.`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          names: { type: Type.ARRAY, items: { type: Type.STRING } },
          logoConcept: { type: Type.STRING },
          colors: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["names", "logoConcept", "colors"]
      }
    }
  });
  return { ...JSON.parse(res.text || '{}'), mockupImageUrl: '' };
};