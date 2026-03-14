import '@anthropic-ai/sdk/shims/web';
import Anthropic from "@anthropic-ai/sdk";
import { Journey, Milestone, Step } from "../types";

// Claude API setup
const API_KEY = import.meta.env.VITE_CLAUDE_API_KEY || (import.meta as any).env.VITE_CLAUDE_API_KEY;
const anthropic = new Anthropic({
  apiKey: API_KEY as string,
});

// A safe ID generator that works in all browsers
function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const JOURNEY_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "The name of the journey" },
    description: { type: "string", description: "Brief overview of the goal" },
    category: { type: "string", description: "Professional, Personal, Skill, etc." },
    milestones: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          estimatedDays: { type: "number" },
          steps: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: ["title", "description", "estimatedDays", "steps"]
      }
    }
  },
  required: ["title", "description", "category", "milestones"]
};

export async function generateJourney(goal: string, timeframe: string, model: string): Promise<Journey> {
  try {
    const response = await fetch("/api/generate-journey", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ goal, timeframe, model })
    });
    if (!response.ok) {
      throw new Error("Failed to generate journey. Please try again.");
    }
    const result = await response.json();
    const data = JSON.parse(result.result);
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

  Return your response as a JSON object with a key "insights" which is an array of objects with "type", "text", and "icon" (single emoji).`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      system: "You are a motivational coach and progress analyst. Always respond with valid JSON."
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const data = JSON.parse(content.text);
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
  // Claude doesn't have built-in video generation like Gemini's Veo
  // For now, we'll create a placeholder or use a different approach
  onStatusUpdate("Video generation with Claude is not currently supported.");
  onStatusUpdate("Consider using a dedicated video generation service.");

  // Return a placeholder URL or throw an error
  throw new Error("Video generation is not available with Claude API. Please use Gemini for video features.");
}
