import { MachineDesign, MachineConfig } from '../types';

export interface BlueprintMetadata {
    name: string;
    description: string;
    bom: Array<{ part: string; quantity: string; purpose: string }>;
    difficulty: string;
    material: string;
    config?: {
        useBattery?: boolean;
        powerType?: string;
        brassLight?: boolean;
        brassWires?: boolean;
    };
    timestamp: string;
    version: string;
}

/**
 * Embeds metadata as a JSON string in the WebP image
 * We'll store it as a text chunk in the canvas or as a separate JSON file
 */
export const createMetadataJSON = (design: MachineDesign, config?: MachineConfig): string => {
    const metadata: BlueprintMetadata = {
        name: design.name,
        description: design.description,
        bom: design.bom,
        difficulty: config?.difficulty || 'Moderate',
        material: config?.structureMaterial || 'Brass',
        config: config ? {
            useBattery: config.useBattery,
            powerType: config.powerType,
            brassLight: config.brassLight,
            brassWires: config.brassWires,
        } : undefined,
        timestamp: new Date().toISOString(),
        version: 'v13.6.0',
    };

    return JSON.stringify(metadata, null, 2);
};

/**
 * Saves metadata as a companion JSON file
 */
export const saveMetadataFile = (design: MachineDesign, config?: MachineConfig): void => {
    const metadata = createMetadataJSON(design, config);
    const blob = new Blob([metadata], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const sanitizedName = design.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    a.href = url;
    a.download = `${sanitizedName}_metadata.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

/**
 * Extracts metadata from a JSON file or embedded data
 */
export const parseMetadata = (jsonString: string): BlueprintMetadata | null => {
    try {
        return JSON.parse(jsonString);
    } catch (e) {
        console.error('Failed to parse metadata:', e);
        return null;
    }
};

export const analyzeImageWithAI = async (imageBase64: string): Promise<BlueprintMetadata | null> => {
    try {
        const { GoogleGenAI, Type } = await import('@google/genai');
        const { ApiKeyManager } = await import('./apiKeyManager');

        const activeKey = ApiKeyManager.getActive();
        if (!activeKey) {
            throw new Error('No API key available');
        }

        const ai = new GoogleGenAI({ apiKey: activeKey.key });

        const prompt = `Analyze this DIY electronics blueprint image and extract the following information:
- Project name (creative, cyberpunk style)
- Brief description of what this device does
- List of components with quantities and purposes
- Difficulty level (Easy, Moderate, or Hard)
- Main structural material (Brass, Acrylic, Plywood, or 3D Print)

Look for electronic components like ESP32, Arduino, sensors, displays, LEDs, batteries, and structural materials.`;

        const imagePart = {
            inlineData: {
                data: imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64,
                mimeType: 'image/webp',
            },
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: {
                parts: [{ text: prompt }, imagePart]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
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
                        },
                        difficulty: { type: Type.STRING },
                        material: { type: Type.STRING }
                    },
                    required: ["name", "description", "bom", "difficulty", "material"]
                }
            }
        });

        const text = response.text || '{}';
        const parsed = JSON.parse(text);

        return {
            ...parsed,
            timestamp: new Date().toISOString(),
            version: 'v13.6.0-ai-analyzed',
        };
    } catch (error) {
        console.error('AI analysis failed:', error);
        return null;
    }
};
