import { Part, PartCategory } from '../types';
import { COMMON_PARTS } from '../constants';

const STORAGE_KEY_PARTS = 'cyberforge_parts_v1';
const STORAGE_KEY_CATEGORIES = 'cyberforge_categories_v1';

const DEFAULT_CATEGORIES: PartCategory[] = [
    'Core', 'Display', 'Sensor', 'Power', 'Input',
    'Actuator', 'Light', 'Structure', 'Comm', 'Passive'
];

export const StorageService = {
    getParts: (): Part[] => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY_PARTS);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.error("Failed to load parts", e);
        }
        return COMMON_PARTS;
    },

    saveParts: (parts: Part[]) => {
        try {
            localStorage.setItem(STORAGE_KEY_PARTS, JSON.stringify(parts));
        } catch (e) {
            console.error("Failed to save parts", e);
        }
    },

    getCategories: (): PartCategory[] => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY_CATEGORIES);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.error("Failed to load categories", e);
        }
        return DEFAULT_CATEGORIES;
    },

    saveCategories: (categories: PartCategory[]) => {
        try {
            localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
        } catch (e) {
            console.error("Failed to save categories", e);
        }
    },

    getCategoryIcon: (category: string): string => {
        try {
            // Check custom icons first
            const storedIcons = localStorage.getItem('cyberforge_category_icons');
            if (storedIcons) {
                const icons = JSON.parse(storedIcons);
                if (icons[category]) return icons[category];
            }

            // Fallback to defaults
            const lower = category.toLowerCase();
            const defaultMap: Record<string, string> = {
                'core': '/assets/icons/core.png',
                'display': '/assets/icons/display.png',
                'sensor': '/assets/icons/sensor.png',
                'power': '/assets/icons/power.png',
                'input': '/assets/icons/input.png',
                'actuator': '/assets/icons/motors.png', // Mapped to motors
                'light': '/assets/icons/light.png',
                'structure': '/assets/icons/structure.png',
                'comm': '/assets/icons/comm.png',
                'passive': '/assets/icons/passive.png',
            };

            if (defaultMap[lower]) return defaultMap[lower];

            // Try exact filename match if new category has one manually added (unlikely but safe)
            return '/assets/icons/passive.png';
        } catch (e) {
            return '/assets/icons/passive.png';
        }
    },

    saveCategoryIcon: (category: string, iconUrl: string) => {
        try {
            const stored = localStorage.getItem('cyberforge_category_icons');
            const icons = stored ? JSON.parse(stored) : {};
            icons[category] = iconUrl;
            localStorage.setItem('cyberforge_category_icons', JSON.stringify(icons));
        } catch (e) {
            console.error("Failed to save icon", e);
        }
    }
};
