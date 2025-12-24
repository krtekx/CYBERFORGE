/**
 * API Key Manager Service
 * Manages multiple Gemini API keys with localStorage persistence
 */

export interface ApiKeyEntry {
    id: string;
    name: string;
    key: string;
    createdAt: number;
}

const STORAGE_KEY = 'cyberforge_api_keys';
const ACTIVE_KEY_ID = 'cyberforge_active_key_id';

export class ApiKeyManager {
    /**
     * Get all stored API keys
     */
    static getAll(): ApiKeyEntry[] {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Failed to load API keys:', error);
            return [];
        }
    }

    /**
     * Add a new API key
     */
    static add(name: string, key: string): ApiKeyEntry {
        const keys = this.getAll();
        const newKey: ApiKeyEntry = {
            id: `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: name.trim(),
            key: key.trim(),
            createdAt: Date.now()
        };

        keys.push(newKey);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));

        // If this is the first key, make it active
        if (keys.length === 1) {
            this.setActive(newKey.id);
        }

        return newKey;
    }

    /**
     * Delete an API key by ID
     */
    static delete(id: string): boolean {
        const keys = this.getAll();
        const filtered = keys.filter(k => k.id !== id);

        if (filtered.length === keys.length) {
            return false; // Key not found
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

        // If we deleted the active key, clear active or set to first available
        const activeId = this.getActiveId();
        if (activeId === id) {
            if (filtered.length > 0) {
                this.setActive(filtered[0].id);
            } else {
                localStorage.removeItem(ACTIVE_KEY_ID);
            }
        }

        return true;
    }

    /**
     * Get the active API key ID
     */
    static getActiveId(): string | null {
        return localStorage.getItem(ACTIVE_KEY_ID);
    }

    /**
     * Set the active API key
     */
    static setActive(id: string): boolean {
        const keys = this.getAll();
        const keyExists = keys.some(k => k.id === id);

        if (keyExists) {
            localStorage.setItem(ACTIVE_KEY_ID, id);
            return true;
        }

        return false;
    }

    /**
     * Get the active API key entry
     */
    static getActive(): ApiKeyEntry | null {
        const activeId = this.getActiveId();
        if (!activeId) return null;

        const keys = this.getAll();
        return keys.find(k => k.id === activeId) || null;
    }

    /**
     * Get the active API key string (for use in API calls)
     */
    static getActiveKey(): string | null {
        const active = this.getActive();
        return active ? active.key : null;
    }

    /**
     * Check if any API keys are configured
     */
    static hasKeys(): boolean {
        return this.getAll().length > 0;
    }

    /**
     * Update an existing API key
     */
    static update(id: string, name: string, key: string): boolean {
        const keys = this.getAll();
        const index = keys.findIndex(k => k.id === id);

        if (index === -1) return false;

        keys[index] = {
            ...keys[index],
            name: name.trim(),
            key: key.trim()
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
        return true;
    }

    /**
     * Clear all API keys (use with caution)
     */
    static clearAll(): void {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(ACTIVE_KEY_ID);
    }
}
