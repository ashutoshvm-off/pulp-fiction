import { supabase } from '../supabase';

export interface AppSettings {
    showCategories: boolean;
    hiddenCategories: string[];
}

const DEFAULT_SETTINGS: AppSettings = {
    showCategories: false,
    hiddenCategories: []
};

/**
 * Fetch app settings
 */
export const fetchSettings = async (): Promise<AppSettings> => {
    try {
        const { data, error } = await supabase
            .from('app_settings')
            .select('*')
            .eq('key', 'shop_settings')
            .single();

        if (error || !data) {
            return DEFAULT_SETTINGS;
        }

        return {
            ...DEFAULT_SETTINGS,
            ...data.value
        };
    } catch (error) {
        console.error('Error fetching settings:', error);
        return DEFAULT_SETTINGS;
    }
};

/**
 * Update app settings
 */
export const updateSettings = async (settings: Partial<AppSettings>): Promise<boolean> => {
    try {
        const currentSettings = await fetchSettings();
        const newSettings = { ...currentSettings, ...settings };

        const { error } = await supabase
            .from('app_settings')
            .upsert({
                key: 'shop_settings',
                value: newSettings,
                updated_at: new Date().toISOString()
            }, { onConflict: 'key' });

        if (error) {
            console.error('Error updating settings:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error updating settings:', error);
        return false;
    }
};

/**
 * Toggle category visibility
 */
export const toggleCategoryVisibility = async (show: boolean): Promise<boolean> => {
    return updateSettings({ showCategories: show });
};

export default {
    fetchSettings,
    updateSettings,
    toggleCategoryVisibility
};
