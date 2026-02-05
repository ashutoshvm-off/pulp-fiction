import React, { useState, useEffect } from 'react';
import { fetchSettings, updateSettings } from '../../lib/services/settingsService';

// ...existing imports and code...

export const AdminDashboard: React.FC = () => {
  // ...existing state...
  const [showCategories, setShowCategories] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    // ...existing useEffect code...
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const settings = await fetchSettings();
    setShowCategories(settings.showCategories);
  };

  const handleToggleCategories = async () => {
    setSavingSettings(true);
    const newValue = !showCategories;
    const success = await updateSettings({ showCategories: newValue });
    if (success) {
      setShowCategories(newValue);
    }
    setSavingSettings(false);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* ...existing admin dashboard content... */}

      {/* Shop Settings Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined">storefront</span>
          Shop Settings
        </h2>

        <div className="space-y-4">
          {/* Category Visibility Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <h3 className="font-medium text-gray-900">Show Category Selection</h3>
              <p className="text-sm text-gray-500">
                When enabled, customers will see category cards before browsing products.
                When disabled, all products are shown directly.
              </p>
            </div>
            <button
              onClick={handleToggleCategories}
              disabled={savingSettings}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                showCategories ? 'bg-primary' : 'bg-gray-300'
              } ${savingSettings ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showCategories ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Status indicator */}
          <div className={`flex items-center gap-2 text-sm ${showCategories ? 'text-green-600' : 'text-gray-500'}`}>
            <span className={`material-symbols-outlined text-sm ${showCategories ? 'filled' : ''}`}>
              {showCategories ? 'visibility' : 'visibility_off'}
            </span>
            <span>
              Categories are currently <strong>{showCategories ? 'visible' : 'hidden'}</strong> on the shop page
            </span>
          </div>
        </div>
      </div>

      {/* ...rest of existing admin dashboard content... */}
    </div>
  );
};
