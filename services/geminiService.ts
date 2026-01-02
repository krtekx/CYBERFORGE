import { GoogleGenAI, Type } from "@google/genai";
import { MachineDesign, Part, MachineConfig, BOMItem } from "../types";
import { ApiKeyManager } from "./apiKeyManager";

export const CURRENT_IMAGE_MODEL = "gemini-3.0-flash";

const cleanJsonResponse = (text: string) => {
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
};

/**
 * Helper: Extract base64 image from Gemini response
 */
const extractInlineImage = (response: any): string | undefined => {
  for (const candidate of response.candidates || []) {
    for (const part of candidate.content?.parts || []) {
      if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  return undefined;
};

/**
 * Sleep utility for delays
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Check if error is a rate limit error
 */
const isRateLimitError = (error: any): boolean => {
  const errorStr = error?.message || error?.toString() || '';
  return errorStr.includes('429') ||
    errorStr.includes('Too Many Requests') ||
    errorStr.includes('RESOURCE_EXHAUSTED') ||
    errorStr.includes('quota');
};

/**
 * Try to rotate to next available API key
 */
const tryRotateApiKey = (): boolean => {
  const allKeys = ApiKeyManager.getAll();
  const currentActiveId = ApiKeyManager.getActiveId();

  if (allKeys.length <= 1) {
    return false; // No other keys to rotate to
  }

  // Find next key
  const currentIndex = allKeys.findIndex(k => k.id === currentActiveId);
  const nextIndex = (currentIndex + 1) % allKeys.length;
  const nextKey = allKeys[nextIndex];

  if (nextKey && nextKey.id !== currentActiveId) {
    ApiKeyManager.setActive(nextKey.id);
    console.log(`🔄 Rotated to API key: ${nextKey.name}`);
    return true;
  }

  return false;
};

/**
 * Execute API call with retry logic and rate limit handling
 */
async function executeWithRetry<T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 2000
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Add a small delay between attempts to respect rate limits
      if (attempt > 0) {
        const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
        console.log(`⏳ Waiting ${delay}ms before retry ${attempt}/${maxRetries}...`);
        await sleep(delay);
      }

      return await apiCall();
    } catch (error: any) {
      lastError = error;
      console.error(`Attempt ${attempt + 1}/${maxRetries} failed:`, error?.message || error);

      // Check if it's a rate limit error
      if (isRateLimitError(error)) {
        console.warn('⚠️ Rate limit detected!');

        // Try to rotate to another API key
        if (attempt < maxRetries - 1) {
          const rotated = tryRotateApiKey();
          if (rotated) {
            console.log('✅ Switched to different API key, retrying...');
            continue;
          } else {
            console.warn('⚠️ No other API keys available. Waiting before retry...');
            // Wait longer for rate limit errors
            await sleep(5000 * (attempt + 1));
          }
        }
      }

      // If not a rate limit error or last attempt, throw
      if (attempt === maxRetries - 1) {
        throw error;
      }
    }
  }

  throw lastError;
}

export const generateDesigns = async (parts: Part[], config: MachineConfig): Promise<MachineDesign[]> => {
  return executeWithRetry(async () => {
    // Get the active API key from the manager
    const apiKey = ApiKeyManager.getActiveKey();
    if (!apiKey) {
      throw new Error('No API key configured. Please add an API key in the API Key Manager.');
    }

    const ai = new GoogleGenAI({ apiKey });

    const difficultyReq = {
      'Easy': "BEGINNER BUILD: Construction material + 1-3 electronic components ONLY (total 2-4 BOM items). Minimal assembly, direct connections. Perfect for first-time builders. Example: Plywood frame + ESP32 + LED.",
      'Moderate': "INTERMEDIATE BUILD: Construction + 5-8 electronic parts total. Balanced complexity with resistors, LEDs, sensors. Requires basic soldering skills.",
      'Hard': "ADVANCED BUILD: Construction + 10-15 parts total. Complex system with multiple subsystems, advanced integration, sophisticated functionality. Expert-level project."
    }[config.difficulty];

    const powerPrompt = config.useBattery
      ? `Power: Integrated ${config.powerType} battery system.`
      : "Power: External USBC link.";

    const visualStyle = `Material: ${config.structureMaterial}. ${config.brassWires ? 'Uses point-to-point exposed Brass Wiring.' : ''} ${config.brassLight ? 'Features warm Brass Light fixtures.' : ''}`;

    const partConstraint = parts.length > 0
      ? `MUST USE THESE NODES: [${parts.map(p => p.name).join(', ')}]. You can add additional suitable passives/hardware.`
      : `NO SPECIFIC NODES PROVIDED. Brainstorm a full BOM appropriate for "${config.userPrompt}".`;

    const prompt = `
    CONTEXT: CyberForge Neural Workshop.
    RESEARCH GOAL: "${config.userPrompt}"
    ${partConstraint}
    SETTINGS: Difficulty: ${config.difficulty} (${difficultyReq}). ${visualStyle}
    ${powerPrompt}

    TASK: Generate EXACTLY ${config.synthesisCount} unique MachineDesign JSON objects.
    Each design should be a distinct hardware interpretation.
    Include a detailed Bill of Materials (BOM) for each.
  `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.0-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              purpose: { type: Type.STRING },
              synergy: { type: Type.STRING },
              type: { type: Type.STRING },
              description: { type: Type.STRING },
              bom: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    part: { type: Type.STRING },
                    quantity: { type: Type.STRING },
                    purpose: { type: Type.STRING }
                  },
                  required: ["part", "quantity", "purpose"]
                }
              }
            },
            required: ["id", "name", "purpose", "synergy", "type", "description", "bom"]
          }
        }
      }
    });

    const text = response.text || "[]";
    const parsed = JSON.parse(cleanJsonResponse(text));
    return parsed.slice(0, config.synthesisCount).map((d: any) => ({ ...d, images: [] }));
  }, 3, 3000); // 3 retries, 3 second base delay
};


export const generateImageForDesign = async (
  design: MachineDesign,
  config: MachineConfig
): Promise<string | undefined> => {
  return executeWithRetry(async () => {
    const apiKey = ApiKeyManager.getActiveKey();
    if (!apiKey) {
      throw new Error('No API key configured. Please add an API key in the API Key Manager.');
    }

    const ai = new GoogleGenAI({ apiKey });

    const materialAesthetic = config.structureMaterial === '3D Print'
      ? "Exposed 3D printed chassis with structural lattice."
      : `${config.structureMaterial} industrial hardware.`;

    const accents = `${config.brassWires ? 'EXPOSED POINT-TO-POINT BRASS WIRING.' : ''} ${config.brassLight ? 'WARM BRASS FILAMENT LIGHT HOUSINGS.' : ''}`;

    const visualComplexity = {
      'Easy': "MINIMAL DESIGN: Show ONLY 2-3 visible electronic components on a simple construction base. Clean, spacious layout with lots of empty space. Beginner-friendly appearance. Very few wires, direct connections only.",
      'Moderate': "BALANCED DESIGN: Show 5-8 visible components with moderate wiring. Organized layout with clear component placement. Some complexity but still readable.",
      'Hard': "COMPLEX DESIGN: Show 10-15+ densely packed components with intricate wiring. Advanced integration, multiple subsystems visible. Professional, sophisticated appearance with tight component spacing."
    }[config.difficulty];

    const prompt = `
    MASTERPIECE INDUSTRIAL PRODUCT PHOTOGRAPHY. 
    Machine: "${design.name}". 
    Style: ${materialAesthetic}
    ${accents}
    ${visualComplexity}
    Visual Logic: Components integrated into a custom chassis. 
    Industrial top-down flatlay, cinematic lighting, 1:1 Aspect.
  `;

    try {
      // Try Gemini 3.0 Flash text/image
      const response = await ai.models.generateContent({
        model: 'gemini-3.0-flash',
        contents: { parts: [{ text: prompt }] },
        config: { imageConfig: { aspectRatio: "1:1" } }
      });
      const img = extractInlineImage(response);
      if (img) return img;
    } catch (err) {
      console.warn("Gemini 3 Flash generation failed, falling back to Gemini 2.5 Flash Image:", err);
    }

    // Fallback or if first attempt yielded no image (though catch handles errors)
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] }
      });
      return extractInlineImage(response);
    } catch (err) {
      console.error("Fallback image generation failed:", err);
      throw err;
    }
  }, 2, 2000).catch(err => {
    console.error("Image generation failed after retries:", err);
    return undefined; // Return undefined instead of throwing for images
  });
};

export const generateCategoryIcon = async (category: string): Promise<string | undefined> => {
  return executeWithRetry(async () => {
    const apiKey = ApiKeyManager.getActiveKey();
    if (!apiKey) throw new Error("No API key");

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
      Design a simple, high-contrast monochrome icon for the electronics category: "${category}".
      Style: Cyberpunk UI, futuristic, neon blue/white lines.
      Format: Icon, centered, transparent background if possible, or black background.
      The image should look like a game inventory icon.
      Aspect Ratio: 1:1.
    `;

    try {
      // Try Gemini 3 Flash
      const response = await ai.models.generateContent({
        model: 'gemini-3.0-flash',
        contents: { parts: [{ text: prompt }] },
        config: { imageConfig: { aspectRatio: "1:1" } }
      });
      const img = extractInlineImage(response);
      if (img) return img;
    } catch (err) {
      console.warn("Gemini 3 Flash icon generation failed, falling back to Gemini 2.5 Flash:", err);
    }

    try {
      // Fallback: Gemini 2.5 Flash
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] }
      });
      const img = extractInlineImage(response);
      if (img) return img;
    } catch (err) {
      console.warn("Flash icon gen failed, falling back to SVG:", err);
    }

    // Fallback: SVG
    return generateSVGIcon(category);
  }, 2, 2000);
};

const generateSVGIcon = async (category: string): Promise<string | undefined> => {
  const apiKey = ApiKeyManager.getActiveKey();
  if (!apiKey) return undefined;
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
     Generate valid SVG code for a simple icon representing "${category}".
     Size: 64x64. Color: #00f3ff. Background: none/transparent.
     Style: Cyberpunk, tech, circuit lines.
     Return ONLY the <svg>...</svg> code string. No markdown block.
   `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt
  });

  let svg = response.text || '';
  svg = svg.replace(/```xml/g, '').replace(/```svg/g, '').replace(/```/g, '').trim();
  if (svg.startsWith('<svg')) {
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }
  return undefined;
};

export const generatePartDocumentation = async (partName: string): Promise<string | undefined> => {
  const apiKey = ApiKeyManager.getActiveKey();
  if (!apiKey) return undefined;

  try {
    return await executeWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Detailed technical line art blueprint of ${partName}. Schematic lines only, dark grid background.`;

      try {
        // Try Gemini 3 Flash
        const response = await ai.models.generateContent({
          model: 'gemini-3.0-flash',
          contents: { parts: [{ text: prompt }] },
          config: { imageConfig: { aspectRatio: "1:1" } }
        });
        const img = extractInlineImage(response);
        if (img) return img;
      } catch (err) {
        console.warn("Gemini 3 Flash documentation generation failed, falling back to Gemini 2.5 Flash:", err);
      }

      // Fallback
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: { imageConfig: { aspectRatio: "1:1" } }
      });
      return extractInlineImage(response);
    }, 2, 1500);
  } catch (err) {
    console.error("Part documentation generation failed:", err);
    return undefined;
  }
};

export const generateRealPartAbstract = async (partName: string): Promise<{ abstract: string, specs: string[] } | null> => {
  const apiKey = ApiKeyManager.getActiveKey();
  if (!apiKey) return null;

  try {
    return await executeWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3.0-flash',
        contents: `Provide a real technical summary and 4 key specs for: ${partName}.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              abstract: { type: Type.STRING },
              specs: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["abstract", "specs"]
          }
        }
      });
      const text = response.text;
      if (text) return JSON.parse(cleanJsonResponse(text));
      return null;
    }, 2, 1500);
  } catch (e) {
    console.error("Part abstract generation failed:", e);
    return null;
  }
};

export const analyzeProductLink = async (url: string): Promise<{ name: string; category: string; description: string; imageUrl?: string } | null> => {
  const apiKey = ApiKeyManager.getActiveKey();
  if (!apiKey) return null;

  try {
    return await executeWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `
        Analyze this product link/URL and infer the likely component details.
        URL: "${url}"
        
        If it's a known electronics part, provide its standard specific name (e.g. "Arduino Uno R3", "ESP32-WROOM").
        Infer the Category from this list: 'Core', 'Display', 'Sensor', 'Power', 'Input', 'Actuator', 'Light', 'Structure', 'Comm', 'Passive'. If unsure, use 'Passive'.
        Write a short technical description (max 1 sentence).
        
        For "imageUrl": Try to find a direct, valid HTTP URL to a product image (e.g. from wikimedia, adafruit, sparkfun, or generic CDN) if it is a standard part. 
        DO NOT invent a URL. If you cannot confidently predict a static image URL, return an empty string.
        
        Return JSON format: { "name": string, "category": string, "description": string, "imageUrl": string }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.0-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              category: { type: Type.STRING },
              description: { type: Type.STRING },
              imageUrl: { type: Type.STRING }
            },
            required: ["name", "category", "description"]
          }
        }
      });

      const text = response.text;
      if (text) {
        const data = JSON.parse(cleanJsonResponse(text));
        return data;
      }
      return null;
    }, 2, 2000);
  } catch (e) {
    console.error("Link analysis failed:", e);
    throw e;
  }
};