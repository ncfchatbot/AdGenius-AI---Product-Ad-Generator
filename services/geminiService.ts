
import { GoogleGenAI, Type } from "@google/genai";
import { AdConfiguration, ProductCategory, BagColor, PostObjective } from "../types.ts";
import { Language } from "../translations.ts";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface GenerationOutput {
  imageUrl: string;
  caption: string;
}

export interface BrandIdentityOutput {
  names: string[];
  logoConcept: string;
  mockupImageUrl: string;
}

export const generateProductAd = async (config: AdConfiguration, lang: Language, retries = 3): Promise<GenerationOutput> => {
  if (!config.image) throw new Error("No product image provided");
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const base64Data = config.image.split(',')[1];
  const mimeType = config.image.split(';')[0].split(':')[1];

  const langName = lang === 'th' ? 'Thai' : 'Lao';
  const isPackaging = config.category === ProductCategory.PACKAGING;

  const imagePrompt = isPackaging 
    ? `Role: Luxury Coffee Photographer. Focus on the SENSORY experience of coffee beans. The packaging must look premium as it preserves the aroma. Atmosphere: ${config.atmosphere}. Details: ${config.coffeeDetails}. NO TEXT overlays.`
    : `Role: High-end Product Photographer. Focus on the DESIGN and FUNCTIONALITY of the coffee equipment. Atmosphere: ${config.atmosphere}. Key features: ${config.coffeeDetails}. NO TEXT overlays.`;

  const captionPrompt = `
    Task: Write a professional ${config.platform} sales caption.
    Strict Language Requirement: The output MUST be 100% in ${langName} language.
    Context: Selling ${isPackaging ? 'specialty coffee beans' : 'premium coffee equipment'}.
    Details: ${config.coffeeDetails}
    Goal: ${config.objective}

    CRITICAL RULES:
    1. Start directly with the content in ${langName}. 
    2. DO NOT include any introductory conversational phrases like "แน่นอนค่ะ" (Thai) or "แน่นอน" or "Here is your caption" or "Sure".
    3. DO NOT mix ${langName} with other languages. If the language is Lao, use ONLY Lao script and words.
    4. If it is coffee beans: emphasize the taste and flavor preservation of the valve bag.
    5. If it is equipment: emphasize how it elevates the brewing experience.
    6. Include 5 relevant hashtags in ${langName}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: mimeType } },
          { text: imagePrompt },
          { text: captionPrompt }
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: config.aspectRatio as any
        }
      }
    });

    let generatedImageUrl = '';
    let generatedCaption = '';
    
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          generatedImageUrl = `data:image/png;base64,${part.inlineData.data}`;
        } else if (part.text) {
          // Robust cleaning of preambles in Thai, Lao, and English
          generatedCaption = part.text
            .replace(/^(นี่คือแคปชั่น|แน่นอนค่ะ|แน่นอน|แน่นอนครับ|ສຳລັບ|ນີ້ແມ່ນ|ແນ່ນອນ|Here is|Sure|Certainly).*?[:\n\s]*/i, '')
            .trim();
        }
      }
    }

    if (!generatedImageUrl) {
      // Fallback: If 2.5 flash image was needed for image part specifically
      // We rely on the model choice rules.
    }

    return { imageUrl: generatedImageUrl, caption: generatedCaption };
    
  } catch (error: any) {
    if ((error?.status === 429 || error?.message?.includes('429')) && retries > 0) {
      await sleep(2000);
      return generateProductAd(config, lang, retries - 1);
    }
    throw error;
  }
};

export const generateBrandIdentity = async (concept: string, bagColor: BagColor, lang: Language): Promise<BrandIdentityOutput> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const langName = lang === 'th' ? 'Thai' : 'Lao';
  
  const textResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Specialty Coffee Brand Strategist. Concept: ${concept}. Bag color: ${bagColor}. Provide 5 names and a design concept.
    STRICT LANGUAGE: Everything must be in ${langName} ONLY. No other languages.
    Return as JSON object with keys "names" (array) and "logoConcept" (string).`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          names: { type: Type.ARRAY, items: { type: Type.STRING } },
          logoConcept: { type: Type.STRING }
        }
      }
    }
  });

  const identity = JSON.parse(textResponse.text || '{}');
  const imageResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: `Premium coffee roastery mockup. Bag color: ${bagColor}. Brand style description: ${identity.logoConcept}. Photorealistic high-end look.`,
    config: {
      imageConfig: { aspectRatio: "1:1" }
    }
  });

  let mockupUrl = '';
  if (imageResponse.candidates?.[0]?.content?.parts) {
    for (const part of imageResponse.candidates[0].content.parts) {
      if (part.inlineData) {
        mockupUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }
  }

  return {
    names: identity.names || [],
    logoConcept: identity.logoConcept || '',
    mockupImageUrl: mockupUrl
  };
};
