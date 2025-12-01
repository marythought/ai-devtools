/**
 * Backend API Service
 * All backend calls are centralized here
 * Connects to FastAPI backend based on OpenAPI specifications
 */

// Type Definitions matching OpenAPI specs
export interface UserProfile {
    username: string;
    highScore: number;
}

export interface LeaderboardEntry {
    username: string;
    score: number;
}

export interface ActivePlayer {
    username: string;
    score: number;
    playing: boolean;
}

export interface GameState {
    username: string;
    score: number;
    playing: boolean;
}

interface LoginRequest {
    username: string;
    password: string;
}

interface SignupRequest {
    username: string;
    password: string;
}

interface ScoreUpdate {
    username: string;
    score: number;
}

interface ScoreUpdateResponse {
    success: boolean;
    updated: boolean;
    newHighScore: number;
}

interface ErrorResponse {
    detail: string;
}

export class API {
    private baseUrl: string;
    private token: string | null;

    constructor(baseUrl: string = "http://localhost:8000/api/v1") {
        this.baseUrl = baseUrl;
        this.token = this.loadToken();
    }

    // Token Management
    private loadToken(): string | null {
        return localStorage.getItem("snake_auth_token");
    }

    private saveToken(token: string): void {
        localStorage.setItem("snake_auth_token", token);
        this.token = token;
    }

    private clearToken(): void {
        localStorage.removeItem("snake_auth_token");
        this.token = null;
    }

    // HTTP Helper Methods
    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            ...((options.headers as Record<string, string>) || {}),
        };

        // Add auth token if available
        if (this.token) {
            headers["Authorization"] = `Bearer ${this.token}`;
        }

        const response = await fetch(url, {
            ...options,
            headers,
        });

        // Handle error responses
        if (!response.ok) {
            const error: ErrorResponse = await response.json();
            throw new Error(error.detail || `HTTP error ${response.status}`);
        }

        return response.json();
    }

    // Authentication Methods
    async login(username: string, password: string): Promise<UserProfile> {
        const body: LoginRequest = { username, password };

        const response = await this.request<
            UserProfile & { token: string }
        >("/auth/login", {
            method: "POST",
            body: JSON.stringify(body),
        });

        // Save the token from the backend
        this.saveToken(response.token);

        // Return user profile without token
        return {
            username: response.username,
            highScore: response.highScore,
        };
    }

    async signup(username: string, password: string): Promise<UserProfile> {
        const body: SignupRequest = { username, password };

        const response = await this.request<
            UserProfile & { token: string }
        >("/auth/signup", {
            method: "POST",
            body: JSON.stringify(body),
        });

        // Save the token from the backend
        this.saveToken(response.token);

        // Return user profile without token
        return {
            username: response.username,
            highScore: response.highScore,
        };
    }

    async logout(): Promise<boolean> {
        try {
            await this.request<{ success: boolean }>("/auth/logout", {
                method: "POST",
            });
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            this.clearToken();
        }
        return true;
    }

    async getCurrentUser(): Promise<UserProfile | null> {
        if (!this.token) {
            return null;
        }

        try {
            return await this.request<UserProfile>("/auth/current");
        } catch (error) {
            // Token might be invalid, clear it
            this.clearToken();
            return null;
        }
    }

    // Leaderboard Methods
    async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
        return this.request<LeaderboardEntry[]>(
            `/leaderboard?limit=${limit}`
        );
    }

    async updateScore(username: string, score: number): Promise<boolean> {
        const body: ScoreUpdate = { username, score };

        const response = await this.request<ScoreUpdateResponse>("/scores", {
            method: "POST",
            body: JSON.stringify(body),
        });

        return response.success;
    }

    // Active Players / Spectator Methods
    async getActivePlayers(): Promise<ActivePlayer[]> {
        return this.request<ActivePlayer[]>("/players/active");
    }

    async getPlayerGameState(username: string): Promise<GameState> {
        return this.request<GameState>(`/players/${username}/state`);
    }

    // Helper to check if user is logged in
    isLoggedIn(): boolean {
        return this.token !== null;
    }
}

// Export singleton instance
export const api = new API();
