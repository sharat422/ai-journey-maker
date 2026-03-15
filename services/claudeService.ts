import { Journey, Milestone } from "../types";

// A safe ID generator that works in all browsers
function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

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
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody?.detail || "Failed to generate journey. Please try again.");
    }
    const result = await response.json();
    const raw = result.result.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    const data = JSON.parse(raw);
    const milestones: Milestone[] = data.milestones.map((m: any) => ({
      id: generateId(),
      title: m.title,
      description: m.description,
      estimatedDays: m.estimatedDays,
      steps: m.steps.map((s: string) => ({
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
    throw error instanceof Error ? error : new Error("Failed to generate journey. Please try again.");
  }
}

export interface AIInsight {
  type: 'achievement' | 'focus' | 'encouragement' | 'prediction';
  text: string;
  icon: string;
}

export async function analyzeJourneyProgress(journey: Journey): Promise<AIInsight[]> {
  try {
    const response = await fetch("/api/analyze-progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ journey })
    });
    if (!response.ok) {
      throw new Error("Failed to analyze progress");
    }
    const data = await response.json();
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
  onStatusUpdate("Video generation is not yet available.");
  throw new Error("Video generation is not currently supported.");
}
