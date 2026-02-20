
import { supabase } from './supabaseClient';
import { UserStreak } from '../types';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export const StreakService = {

    async checkStreak(userId: string, timezoneOffset: number = new Date().getTimezoneOffset()): Promise<{ status: string, current_streak: number, longest_streak: number }> {
        try {
            // 1. Call Backend to update/calculate streak
            const response = await fetch(`${API_URL}/api/streak/check`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ user_id: userId, timezone_offset: timezoneOffset }),
            });

            if (!response.ok) {
                throw new Error('Failed to check streak');
            }

            return await response.json();
        } catch (error) {
            console.error("Streak Check Error:", error);
            // Fallback: Return 0 or cached logic if needed
            return { status: "error", current_streak: 0, longest_streak: 0 };
        }
    },

    async unlockReward(userId: string, rewardType: 'video_ad' | 'share' | 'micro_purchase'): Promise<boolean> {
        try {
            const response = await fetch(`${API_URL}/api/unlock-reward`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ user_id: userId, reward_type: rewardType }),
            });

            if (!response.ok) {
                throw new Error('Failed to claim reward');
            }

            return true;
        } catch (error) {
            console.error("Unlock Reward Error:", error);
            return false;
        }
    }
};
