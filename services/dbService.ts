
import { User, Journey } from '../types';

/**
 * Stride Mock Real-time Database
 * Simulates a cloud database (like Firebase or Supabase) using localStorage.
 * Handles async operations with latency to mimic network calls.
 */

const LATENCY = 800;

class StrideDB {
  private getStorage<T>(key: string): T[] {
    const data = localStorage.getItem(`stride_db_${key}`);
    return data ? JSON.parse(data) : [];
  }

  private setStorage<T>(key: string, data: T[]): void {
    localStorage.setItem(`stride_db_${key}`, JSON.stringify(data));
  }

  private wait(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, LATENCY));
  }

  // --- Auth Logic ---

  async signup(email: string, password: string, name: string): Promise<User> {
    await this.wait();
    const users = this.getStorage<{ email: string; pass: string; user: User }>('users');
    
    if (users.find(u => u.email === email)) {
      throw new Error("User already exists with this email.");
    }

    const newUser: User = {
      id: `u-${Date.now()}`,
      email,
      name,
      isPro: false
    };

    users.push({ email, pass: password, user: newUser });
    this.setStorage('users', users);
    return newUser;
  }

  async login(email: string, password: string): Promise<User> {
    await this.wait();
    const users = this.getStorage<{ email: string; pass: string; user: User }>('users');
    const record = users.find(u => u.email === email && u.pass === password);
    
    if (!record) {
      throw new Error("Invalid email or password.");
    }

    return record.user;
  }

  async googleAuth(): Promise<User> {
    await this.wait();
    const email = "google.explorer@gmail.com";
    const users = this.getStorage<{ email: string; pass: string; user: User }>('users');
    let record = users.find(u => u.email === email);
    
    if (!record) {
      const newUser: User = {
        id: `u-google-${Date.now()}`,
        email,
        name: "Google Explorer",
        isPro: false,
        avatar: "https://lh3.googleusercontent.com/a/default-user"
      };
      record = { email, pass: 'oauth-protected', user: newUser };
      users.push(record);
      this.setStorage('users', users);
    }

    return record.user;
  }

  // --- Journey Logic ---

  async getUserJourneys(userId: string): Promise<Journey[]> {
    await this.wait();
    const allJourneys = this.getStorage<Journey>('journeys');
    return allJourneys.filter(j => j.userId === userId).sort((a, b) => b.createdAt - a.createdAt);
  }

  async saveJourney(journey: Journey): Promise<void> {
    await this.wait();
    const allJourneys = this.getStorage<Journey>('journeys');
    const index = allJourneys.findIndex(j => j.id === journey.id);
    
    if (index !== -1) {
      allJourneys[index] = journey;
    } else {
      allJourneys.push(journey);
    }
    
    this.setStorage('journeys', allJourneys);
  }

  async setProStatus(userId: string, isPro: boolean): Promise<void> {
    await this.wait();
    const users = this.getStorage<{ email: string; pass: string; user: User }>('users');
    const index = users.findIndex(u => u.user.id === userId);
    if (index !== -1) {
      users[index].user.isPro = isPro;
      this.setStorage('users', users);
    }
  }
}

export const db = new StrideDB();
