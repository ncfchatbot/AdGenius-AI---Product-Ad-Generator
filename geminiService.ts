import { GoogleGenAI, Type } from "@google/genai";
import { AdConfiguration, BrandIdentityOutput } from "./types.ts";
import { Language } from "./translations.ts";

const getAIClient = () => {
  // สร้าง instance ใหม่ทุกครั้งเพื่อให้ได้ API Key ล่าสุดจากระบบ
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateProductAd = async (config: AdConfiguration, lang: Language): Promise<{imageUrl: string, caption: string}> => {
  if (!config.image) throw new Error("Please upload a product image.");
  
  const ai = getAIClient();
  const base64Data = config.image.split(',')[1];
  const mimeType = config.image.split(';')[0].split(':')[1];
  const langName = lang === 'th' ? 'Thai' : 'Lao';

  const imagePrompt = `ULTRA-PHOTOREALISTIC high-end commercial product advertisement for coffee. 
    Product image is provided. Context: ${config.atmosphere}. 
    Atmosphere Details: ${config.coffeeDetails}.
    Style: Professional studio lighting, 8k resolution, sharp focus, cinematic.
    NO TEXT ON IMAGE. NO AI ARTIFACTS.`;

  const imageResponse = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType: mimeType } },
        { text: imagePrompt }
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
  if (imageResponse.candidates?.[0]?.content?.parts) {
    for (const part of imageResponse.candidates[0].content.parts) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }
  }

  if (!imageUrl) throw new Error("Failed to generate image. Please check your API key.");

  const textPrompt = `Write a premium social media caption in ${langName} for ${config.platform}. 
    Product details: ${config.coffeeDetails}. Use professional and inviting tone. 
    For Lao: Follow modern official spelling strictly.`;

  const textResponse = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: textPrompt,
  });

  return {
    imageUrl: imageUrl,
    caption: textResponse.text || ""
  };
};

export const generateLabelDesign = async (
  concept: string, 
  shape: string, 
  bagColor: string, 
  type: string, 
  lang: Language,
  logoImage?: string | null
): Promise<{imageUrl: string}> => {
  const ai = getAIClient();
  const parts: any[] = [];
  if (logoImage) {
    parts.push({
      inlineData: {
        data: logoImage.split(',')[1],
        mimeType: logoImage.split(';')[0].split(':')[1]
      }
    });
  }
  parts.push({ text: `Create a professional 3D mockup of a coffee bag. Color: ${bagColor}. Label Shape: ${shape}. Application Type: ${type}. Style: ${concept}. High resolution, studio lighting.` });

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts },
    config: { imageConfig: { aspectRatio: "1:1", imageSize: "1K" } }
  });

  let imageUrl = '';
  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }
  }
  return { imageUrl };
};

export const generateBrandStrategy = async (brandName: string, concept: string, lang: Language): Promise<BrandIdentityOutput> => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Act as a branding expert. Provide 5 brand names, a logo concept, and 3 colors (HEX) for: ${brandName} with style: ${concept}. Output in ${lang === 'th' ? 'Thai' : 'Lao'}.`,
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
  const data = JSON.parse(response.text || '{}');
  return { ...data, mockupImageUrl: '' };
};