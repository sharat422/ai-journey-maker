import { GoogleGenAI, Type } from "@google/genai";
import { Journey, Milestone, Step } from "../types";

// Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
//console.log("Gemini API Key:", process.env.GEMINI_API_KEY);
const API_KEY = import.meta.env.VITE_API_KEY || (import.meta as any).env.VITE_API_KEY;
// Removed global genAI instance to prevent state issues
// const genAI = new GoogleGenAI({ apiKey: API_KEY as string });

// A safe ID generator that works in all browsers
function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
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

export async function generateJourney(goal: string, timeframe: string, model: string): Promise<Journey> {
  // Create a new instance for each request to ensure fresh state
  const genAI = new GoogleGenAI({ apiKey: API_KEY as string });
  const isProModel = model === "gemini-3-pro-preview";

  const prompt = `Create a detailed learning roadmap for the following goal: "${goal}". 
  The target timeframe is "${timeframe}". 
  Break it down into logical milestones with actionable steps.
  Be specific and practical. ${isProModel ? "Since this is an ADVANCED reasoning request, provide significantly more depth, edge cases, and high-level strategic advice for each step." : ""}`;

  try {
    const response = await genAI.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: JOURNEY_SCHEMA,
        ...(isProModel ? { thinkingConfig: { thinkingBudget: 4000 } } : {})
      }
    });

    const data = JSON.parse(response.text);

    const milestones: Milestone[] = data.milestones.map((m: any, mIdx: number) => ({
      id: generateId(),
      title: m.title,
      description: m.description,
      estimatedDays: m.estimatedDays,
      steps: m.steps.map((s: string, sIdx: number) => ({
        id: generateId(),
        title: s,
        completed: false
      }))
    }));

    // Fix: Added userId to satisfy Journey interface; App.tsx will populate it with the correct ID.
    return {
      id: generateId(),
      userId: '',
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

export interface AIInsight {
  type: 'achievement' | 'focus' | 'encouragement' | 'prediction';
  text: string;
  icon: string;
}

export async function analyzeJourneyProgress(journey: Journey): Promise<AIInsight[]> {
  const genAI = new GoogleGenAI({ apiKey: API_KEY as string });

  const completedSteps = journey.milestones.reduce((acc, m) => acc + m.steps.filter(s => s.completed).length, 0);
  const totalSteps = journey.milestones.reduce((acc, m) => acc + m.steps.length, 0);

  const progressData = journey.milestones.map(m => ({
    title: m.title,
    completed: m.steps.filter(s => s.completed).length,
    total: m.steps.length
  }));

  const prompt = `Analyze this progress for the journey: "${journey.title}".
  Description: ${journey.description}
  Overall Progress: ${journey.progress}% (${completedSteps}/${totalSteps} steps).
  Milestone Detail: ${JSON.stringify(progressData)}

  Provide exactly 4 structured insights:
  1. ACHIEVEMENT: Highlight something they have successfully done or a streak.
  2. FOCUS: Identify the exact next step or concept they should master next.
  3. ENCOURAGEMENT: A high-energy motivational statement specific to the goal.
  4. PREDICTION: A "next big win" forecast based on their current trajectory.

  Return ONLY a JSON object with a key "insights" which is an array of objects with "type", "text", and "icon" (single emoji).`;

  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  text: { type: Type.STRING },
                  icon: { type: Type.STRING }
                },
                required: ["type", "text", "icon"]
              }
            }
          },
          required: ["insights"]
        }
      }
    });

    const data = JSON.parse(response.text);
    return data.insights;
  } catch (error) {
    console.error("Error analyzing progress:", error);
    return [
      { type: 'encouragement', text: "Keep moving forward, every small step counts!", icon: "🚀" },
      { type: 'focus', text: "Review your upcoming steps to stay prepared.", icon: "🎯" },
      { type: 'achievement', text: "You've already started the hardest part: beginning.", icon: "🌟" }
    ];
  }
}

export async function generateProgressVideo(journey: Journey, onStatusUpdate: (status: string) => void): Promise<string> {
  // Always create a new instance right before making an API call for Veo models to ensure the latest API key is used
  const videoAi = new GoogleGenAI({ apiKey: API_KEY as string });

  const videoPrompt = `A dynamic, cinematic vertical social media reel for TikTok/Instagram. 
  Theme: Personal growth and progress for "${journey.title}". 
  The video shows an abstract 3D path or mountain being climbed, with glowing neon markers. 
  Current milestone progress is ${journey.progress}%. 
  Visual style: Futuristic UI overlays, sleek typography, high-contrast lighting, inspiring and modern. 
  Aspect ratio 9:16. Vibrant colors matching ${journey.category}.`;

  onStatusUpdate("Initializing Video AI...");

  try {
    let operation = await videoAi.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: videoPrompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '9:16'
      }
    });

    onStatusUpdate("Synthesizing cinematic frames...");

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      // Random reassuring messages
      const statuses = [
        "Synthesizing cinematic frames...",
        "Rendering progress overlays...",
        "Optimizing for social platforms...",
        "Finalizing high-resolution textures...",
        "Color grading for maximum impact..."
      ];
      onStatusUpdate(statuses[Math.floor(Math.random() * statuses.length)]);
      operation = await videoAi.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video generation failed");

    // Append API key as required for fetching the MP4 bytes
    return `${downloadLink}&key=${API_KEY}`;
  } catch (err) {
    console.error("Veo Error:", err);
    throw err;
  }
}
