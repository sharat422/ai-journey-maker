
import { Journey, Blog } from '../types';
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
    // Ensure we have a valid timestamp before calling toISOString()
    //const validDate = journey.createdAt ? new Date(journey.createdAt) : new Date();
    const timestamp = journey.createdAt ? new Date(journey.createdAt).toISOString() : new Date().toISOString();
    const validId = journey.id.startsWith('j-') ? crypto.randomUUID() : journey.id;
    if (!validId) throw new Error("Invalid Journey ID");
    if (!journey.userId) throw new Error("Invalid User ID");
    const { error } = await supabase
      .from('journeys')
      .upsert({
        id: validId,             // Ensure this is not null/undefined
        user_id: journey.userId,   // Mapped from camelCase to snake_case
        title: journey.title,
        description: journey.description,
        category: journey.category,
        progress: journey.progress,
        milestones: journey.milestones,
        created_at: timestamp
      }, { onConflict: 'id' });     // Explicitly handle the ID conflict

    if (error) {
      console.error("Supabase Save Error:", error);
      throw error;
    }
  }

  async setProStatus(userId: string, isPro: boolean): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ is_pro: isPro })
      .eq('id', userId);

    if (error) throw error;
  }

  async updateProfile(userId: string, updates: { name?: string; avatar_url?: string }): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) throw error;
  }

  async uploadAvatar(userId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  // Blog Methods
  async getBlogs(): Promise<Blog[]> {
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(b => ({
      id: b.id,
      title: b.title,
      content: b.content,
      authorId: b.author_id,
      authorEmail: b.author_email,
      authorName: b.author_name,
      createdAt: b.created_at,
      updatedAt: b.updated_at
    }));
  }

  async getBlog(id: string): Promise<Blog | null> {
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return {
      id: data.id,
      title: data.title,
      content: data.content,
      authorId: data.author_id,
      authorEmail: data.author_email,
      authorName: data.author_name,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  async saveBlog(blog: Partial<Blog> & { title: string; content: string; authorId: string; authorEmail: string; authorName?: string }): Promise<Blog> {
    const now = new Date().toISOString();
    const isNew = !blog.id;

    const dbBlog = {
      id: blog.id || crypto.randomUUID(),
      title: blog.title,
      content: blog.content,
      author_id: blog.authorId,
      author_email: blog.authorEmail,
      author_name: blog.authorName || null,
      created_at: blog.createdAt || now,
      updated_at: now
    };

    const { data, error } = await supabase
      .from('blogs')
      .upsert(dbBlog, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error("Blog Save Error:", error);
      throw error;
    }

    return {
      id: data.id,
      title: data.title,
      content: data.content,
      authorId: data.author_id,
      authorEmail: data.author_email,
      authorName: data.author_name,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  async deleteBlog(id: string): Promise<void> {
    const { error } = await supabase
      .from('blogs')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

export const db = new StrideDB();
