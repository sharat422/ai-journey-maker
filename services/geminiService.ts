
import { GoogleGenAI, Type } from "@google/genai";
import { Journey, Milestone, Step } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const JOURNEY_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "The name of the journey" },
    description: { type: Type.STRING, description: "Brief overview of the goal" },
    category: { type: Type.STRING, description: "Professional, Personal, Skill, etc." },
    milestones: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          estimatedDays: { type: Type.NUMBER },
          steps: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["title", "description", "estimatedDays", "steps"]
      }
    }
  },
  required: ["title", "description", "category", "milestones"]
};

export async function generateJourney(goal: string, timeframe: string): Promise<Journey> {
  const prompt = `Create a detailed learning roadmap for the following goal: "${goal}". 
  The target timeframe is "${timeframe}". 
  Break it down into logical milestones with actionable steps.
  Be specific and practical.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: JOURNEY_SCHEMA,
      }
    });

    const data = JSON.parse(response.text);
    
    // Transform API response to our Journey type
    const milestones: Milestone[] = data.milestones.map((m: any, mIdx: number) => ({
      id: `m-${Date.now()}-${mIdx}`,
      title: m.title,
      description: m.description,
      estimatedDays: m.estimatedDays,
      steps: m.steps.map((s: string, sIdx: number) => ({
        id: `s-${Date.now()}-${mIdx}-${sIdx}`,
        title: s,
        completed: false
      }))
    }));

    return {
      id: `j-${Date.now()}`,
      title: data.title,
      description: data.description,
      category: data.category,
      createdAt: Date.now(),
      milestones,
      progress: 0
    };
  } catch (error) {
    console.error("Error generating journey:", error);
    throw new Error("Failed to generate journey. Please try again.");
  }
}
