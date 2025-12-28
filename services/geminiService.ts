import { GoogleGenAI, Type } from "@google/genai";
import { AdConfiguration, BrandIdentityOutput } from "../types.ts";
import { Language } from "../translations.ts";

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateProductAd = async (config: AdConfiguration, lang: Language): Promise<{imageUrl: string, caption: string}> => {
  if (!config.image) throw new Error("Please upload a product image.");
  
  const ai = getAIClient();
  const base64Data = config.image.split(',')[1];
  const mimeType = config.image.split(';')[0].split(':')[1];
  const langName = lang === 'th' ? 'Thai' : 'Lao';

  const imagePrompt = `ULTRA-PHOTOREALISTIC high-end commercial product advertisement. 
    The core product is a coffee bean bag or coffee equipment as shown in the upload.
    Context: ${config.atmosphere}. 
    Lighting: Professional cinematic studio lighting, volumetric light, natural caustic reflections. 
    Lens: Shot on Sony A7R IV with Sony FE 90mm f/2.8 Macro G OSS, sharp focus on texture, soft bokeh background.
    Details: ${config.coffeeDetails}.
    NO TEXT ON IMAGE. NO AI ARTIFACTS. MUST LOOK LIKE A REAL PHOTOGRAPH, NOT AN ILLUSTRATION.`;

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

  if (!imageUrl) throw new Error("Failed to generate photorealistic image.");

  const textPrompt = `You are a world-class copywriter and language expert in ${langName}.
    Write a short, powerful social media caption for ${config.platform} about ${config.coffeeDetails}.
    
    CRITICAL SPELLING RULE FOR LAO:
    - MUST use current official Lao spelling (ພົດຈະນານຸກົມສະບັບປັດຈຸບັນ).
    - Correct: ສະຫຼາກ (Sarak), ສະເໜ່ (Saneh), ຈະຕຸລັດ (Square).
    - Avoid Thai phonetics. Ensure perfect Ho-Sung (ຫູສູງ) placement.
    
    Return ONLY the caption text.`;

  const textResponse = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: textPrompt,
    config: { thinkingConfig: { thinkingBudget: 2000 } }
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

  const visualPrompt = `Close-up studio product photography of a premium coffee bag.
    Product: A specialty coffee bag.
    Logo Application: Place the provided LOGO design onto the bag as a ${type}.
    Specifications: Bag color is ${bagColor}, Label shape is ${shape}.
    Design Style: ${concept}. 
    Execution: Hyper-realistic, professional commercial lighting, 8k resolution, macro lens focus, realistic shadows and material texture.`;

  parts.push({ text: visualPrompt });

  const imageResponse = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts },
    config: { imageConfig: { aspectRatio: "1:1", imageSize: "1K" } }
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
  return { imageUrl };
};

export const generateBrandStrategy = async (brandName: string, concept: string, lang: Language): Promise<BrandIdentityOutput> => {
  const ai = getAIClient();
  const langName = lang === 'th' ? 'Thai' : 'Lao';
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Specialty Coffee Brand Strategist. 
    Current Brand Name Idea: ${brandName}.
    Desired Style/Concept: ${concept}. 
    Provide:
    1. 5 Brand Names in ${langName} that fit this concept.
    2. Deep Brand Concept/Identity explanation in ${langName}.
    3. 3 Primary Brand Colors (HEX codes).
    
    LAO LANGUAGE: Strictly follow modern official spelling rules.
    Return as JSON.`,
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