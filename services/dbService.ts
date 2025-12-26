
import { Journey } from '../types';
import { supabase } from './supabaseClient';

class StrideDB {
  async getUserJourneys(userId: string): Promise<Journey[]> {
    const { data, error } = await supabase
      .from('journeys')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(j => ({
      id: j.id,
      userId: j.user_id,
      title: j.title,
      description: j.description,
      category: j.category,
      createdAt: new Date(j.created_at).getTime(),
      milestones: j.milestones,
      progress: j.progress
    }));
  }

  async saveJourney(journey: Journey): Promise<void> {
    const { error } = await supabase
      .from('journeys')
      .upsert({
        id: journey.id,
        user_id: journey.userId,
        title: journey.title,
        description: journey.description,
        category: journey.category,
        progress: journey.progress,
        milestones: journey.milestones,
        created_at: new Date(journey.createdAt).toISOString()
      });

    if (error) throw error;
  }

  async setProStatus(userId: string, isPro: boolean): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ is_pro: isPro })
      .eq('id', userId);

    if (error) throw error;
  }
}

export const db = new StrideDB();
