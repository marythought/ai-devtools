/**
 * Tests for Mock API Service
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { MockAPI } from '../js/api.js';

describe('MockAPI', () => {
    let api;

    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        api = new MockAPI();
    });

    describe('Authentication', () => {
        it('should login with valid credentials', async () => {
            const user = await api.login('player1', 'pass123');
            expect(user).toBeDefined();
            expect(user.username).toBe('player1');
            expect(api.getCurrentUser()).toEqual(user);
        });

        it('should throw error for invalid username', async () => {
            await expect(api.login('nonexistent', 'pass123'))
                .rejects.toThrow('User not found');
        });

        it('should throw error for invalid password', async () => {
            await expect(api.login('player1', 'wrongpass'))
                .rejects.toThrow('Invalid password');
        });

        it('should signup with valid data', async () => {
            const user = await api.signup('newuser', 'password123');
            expect(user).toBeDefined();
            expect(user.username).toBe('newuser');
            expect(user.highScore).toBe(0);
        });

        it('should throw error for duplicate username', async () => {
            await expect(api.signup('player1', 'pass123'))
                .rejects.toThrow('Username already exists');
        });

        it('should throw error for short username', async () => {
            await expect(api.signup('ab', 'password123'))
                .rejects.toThrow('Username must be at least 3 characters');
        });

        it('should throw error for short password', async () => {
            await expect(api.signup('validuser', '12345'))
                .rejects.toThrow('Password must be at least 6 characters');
        });

        it('should logout successfully', async () => {
            await api.login('player1', 'pass123');
            expect(api.getCurrentUser()).toBeTruthy();
            await api.logout();
            expect(api.getCurrentUser()).toBeNull();
        });
    });

    describe('User Persistence', () => {
        it('should persist user in localStorage', async () => {
            await api.login('player1', 'pass123');
            const stored = JSON.parse(localStorage.getItem('snake_current_user'));
            expect(stored.username).toBe('player1');
        });

        it('should load current user from localStorage', () => {
            const user = { username: 'testuser', highScore: 100 };
            localStorage.setItem('snake_current_user', JSON.stringify(user));
            const newApi = new MockAPI();
            expect(newApi.getCurrentUser()).toEqual(user);
        });

        it('should clear user from localStorage on logout', async () => {
            await api.login('player1', 'pass123');
            await api.logout();
            expect(localStorage.getItem('snake_current_user')).toBeNull();
        });
    });

    describe('Leaderboard', () => {
        it('should return leaderboard sorted by score', async () => {
            const leaderboard = await api.getLeaderboard();
            expect(leaderboard).toBeDefined();
            expect(leaderboard.length).toBeGreaterThan(0);

            // Check sorting
            for (let i = 1; i < leaderboard.length; i++) {
                expect(leaderboard[i - 1].score).toBeGreaterThanOrEqual(leaderboard[i].score);
            }
        });

        it('should return top 10 players only', async () => {
            const leaderboard = await api.getLeaderboard();
            expect(leaderboard.length).toBeLessThanOrEqual(10);
        });

        it('should update user score', async () => {
            await api.login('player1', 'pass123');
            const newScore = 500;
            await api.updateScore('player1', newScore);

            const leaderboard = await api.getLeaderboard();
            const userEntry = leaderboard.find(entry => entry.username === 'player1');
            expect(userEntry.score).toBe(newScore);
        });

        it('should only update if score is higher', async () => {
            await api.login('snakemaster', 'pass123');
            const originalScore = api.currentUser.highScore;

            // Try to update with lower score
            await api.updateScore('snakemaster', 100);
            const leaderboard = await api.getLeaderboard();
            const userEntry = leaderboard.find(entry => entry.username === 'snakemaster');
            expect(userEntry.score).toBe(originalScore);
        });

        it('should add new user to leaderboard', async () => {
            await api.signup('newplayer', 'password123');
            await api.updateScore('newplayer', 150);

            const leaderboard = await api.getLeaderboard();
            const userEntry = leaderboard.find(entry => entry.username === 'newplayer');
            expect(userEntry).toBeDefined();
            expect(userEntry.score).toBe(150);
        });
    });

    describe('Active Players', () => {
        it('should return list of active players', async () => {
            const players = await api.getActivePlayers();
            expect(Array.isArray(players)).toBe(true);
            expect(players.length).toBeGreaterThan(0);
        });

        it('should exclude current user from active players', async () => {
            await api.login('snakemaster', 'pass123');
            const players = await api.getActivePlayers();
            const found = players.find(p => p.username === 'snakemaster');
            expect(found).toBeUndefined();
        });

        it('should return player game state', async () => {
            const players = await api.getActivePlayers();
            const firstPlayer = players[0];

            const state = await api.getPlayerGameState(firstPlayer.username);
            expect(state).toBeDefined();
            expect(state.username).toBe(firstPlayer.username);
            expect(state.score).toBeDefined();
            expect(state.playing).toBeDefined();
        });

        it('should throw error for non-existent player', async () => {
            await expect(api.getPlayerGameState('nonexistent'))
                .rejects.toThrow('Player not found');
        });
    });

    describe('Data Initialization', () => {
        it('should initialize with mock users', () => {
            expect(Object.keys(api.users).length).toBeGreaterThan(0);
        });

        it('should initialize with leaderboard', () => {
            expect(api.leaderboard.length).toBeGreaterThan(0);
        });

        it('should initialize with active players', () => {
            expect(api.activePlayers.length).toBeGreaterThan(0);
        });
    });
});
