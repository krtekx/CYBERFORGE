import { GoogleGenAI, Type } from "@google/genai";
import { MachineDesign, Part, MachineConfig, BOMItem } from "../types";
import { ApiKeyManager } from "./apiKeyManager";

const cleanJsonResponse = (text: string) => {
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
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
      'Easy': "Simple 3-5 part assembly. Direct logic.",
      'Moderate': "Balanced 5-10 part circuit. Functional prototype.",
      'Hard': "Advanced 10-15 part system. High complexity, tight integration."
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
      model: 'gemini-2.5-flash',
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

    const prompt = `
    MASTERPIECE INDUSTRIAL PRODUCT PHOTOGRAPHY. 
    Machine: "${design.name}". 
    Style: ${materialAesthetic}
    ${accents}
    Visual Logic: Components integrated into a custom chassis. 
    Industrial top-down flatlay, cinematic lighting, 1:1 Aspect.
  `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] }
      });

      for (const candidate of response.candidates) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    } catch (err) {
      console.error("Image generation failed:", err);
      throw err; // Re-throw to trigger retry logic
    }
    return undefined;
  }, 2, 2000).catch(err => {
    console.error("Image generation failed after retries:", err);
    return undefined; // Return undefined instead of throwing for images
  });
};

export const generatePartDocumentation = async (partName: string): Promise<string | undefined> => {
  const apiKey = ApiKeyManager.getActiveKey();
  if (!apiKey) return undefined;

  try {
    return await executeWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Detailed technical line art blueprint of ${partName}. Schematic lines only, dark grid background.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: prompt }] },
        config: { imageConfig: { aspectRatio: "1:1" } }
      });

      for (const candidate of response.candidates) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
      return undefined;
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
        model: 'gemini-2.5-flash',
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