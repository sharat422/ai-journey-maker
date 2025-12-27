
import { User } from '../types';
import { supabase } from './supabaseClient';

type AuthCallback = (user: User | null) => void;

class AuthService {
  private currentUser: User | null = null;
  private listeners: AuthCallback[] = [];

  constructor() {
    this.initSession();
  }

  private async initSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      this.currentUser = await this.mapUser(session.user);
    }
    this.notify();

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        this.currentUser = await this.mapUser(session.user);
      } else {
        this.currentUser = null;
      }
      this.notify();
    });
  }

  private async mapUser(sbUser: any): Promise<User> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, is_pro, avatar_url')
      .eq('id', sbUser.id)
      .single();

    return {
      id: sbUser.id,
      email: sbUser.email || '',
      name: profile?.name || sbUser.user_metadata?.full_name || '',
      isPro: profile?.is_pro || false,
      avatar: profile?.avatar_url || sbUser.user_metadata?.avatar_url || ''
    };
  }

  subscribe(callback: AuthCallback) {
    this.listeners.push(callback);
    callback(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notify() {
    this.listeners.forEach(l => l(this.currentUser));
  }

  async signIn(email: string, pass: string): Promise<User> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
    return await this.mapUser(data.user);
  }

  async signUp(email: string, pass: string, name: string): Promise<User> {
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password: pass,
      options: { data: { full_name: name } }
    });
    if (error) throw error;
    if (!data.user) throw new Error("Signup failed");
    
    // Create initial profile
    await supabase.from('profiles').insert([{ id: data.user.id, name, is_pro: false }]);
    
    return await this.mapUser(data.user);
  }

  async signInWithGoogle(): Promise<void> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) throw error;
  }

  async signOut() {
    await supabase.auth.signOut();
    this.currentUser = null;
    this.notify();
  }

  getCurrentUser() {
    return this.currentUser;
  }

  async refreshUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      this.currentUser = await this.mapUser(session.user);
      this.notify();
    }
  }

  updateUser(updated: User) {
    this.currentUser = updated;
    this.notify();
  }
}

export const auth = new AuthService();
