"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch("/api/admin/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setSettings(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const token = useAuthStore.getState().token;
      await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });
      alert("Settings saved successfully");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (section: string, key: string, value: any) => {
    setSettings((prev: any) => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }));
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  if (!settings) return null;

  const tabs = [
    { id: "general", label: "General" },
    { id: "escrow", label: "Escrow" },
    { id: "commissions", label: "Commissions" },
    { id: "security", label: "Security" },
    { id: "maintenance", label: "Maintenance" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Platform Settings
          </h1>
          <p className="text-gray-500 mt-1">
            Configure global platform settings
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="border-b">
          <nav className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "general" && (
            <div className="space-y-4 max-w-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Platform Name
                </label>
                <input
                  type="text"
                  value={settings.general.platformName}
                  onChange={(e) =>
                    updateSetting("general", "platformName", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tagline
                </label>
                <input
                  type="text"
                  value={settings.general.tagline}
                  onChange={(e) =>
                    updateSetting("general", "tagline", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Currency
                </label>
                <input
                  type="text"
                  value={settings.general.defaultCurrency}
                  onChange={(e) =>
                    updateSetting("general", "defaultCurrency", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Language
                </label>
                <input
                  type="text"
                  value={settings.general.defaultLanguage}
                  onChange={(e) =>
                    updateSetting("general", "defaultLanguage", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timezone
                </label>
                <input
                  type="text"
                  value={settings.general.timezone}
                  onChange={(e) =>
                    updateSetting("general", "timezone", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          )}

          {activeTab === "escrow" && (
            <div className="space-y-4 max-w-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dispute Window (Days)
                </label>
                <input
                  type="number"
                  value={settings.escrow.disputeWindowDays}
                  onChange={(e) =>
                    updateSetting(
                      "escrow",
                      "disputeWindowDays",
                      parseInt(e.target.value),
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.escrow.autoReleaseEnabled}
                  onChange={(e) =>
                    updateSetting(
                      "escrow",
                      "autoReleaseEnabled",
                      e.target.checked,
                    )
                  }
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <label className="text-sm font-medium text-gray-700">
                  Auto-release escrow after dispute window
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Escrow Amount
                </label>
                <input
                  type="number"
                  value={settings.escrow.minimumEscrowAmount}
                  onChange={(e) =>
                    updateSetting(
                      "escrow",
                      "minimumEscrowAmount",
                      parseInt(e.target.value),
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          )}

          {activeTab === "commissions" && (
            <div className="space-y-4 max-w-lg">
              {["standardRate", "silverRate", "goldRate", "proRate"].map(
                (key) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {key.replace("Rate", "").charAt(0).toUpperCase() +
                        key.replace("Rate", "").slice(1)}{" "}
                      Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={settings.commissions[key]}
                      onChange={(e) =>
                        updateSetting(
                          "commissions",
                          key,
                          parseFloat(e.target.value),
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                    />
                  </div>
                ),
              )}
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-4 max-w-lg">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.security.twoFactorRequired}
                  onChange={(e) =>
                    updateSetting(
                      "security",
                      "twoFactorRequired",
                      e.target.checked,
                    )
                  }
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <label className="text-sm font-medium text-gray-700">
                  Require 2FA for all admin users
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session Timeout (Minutes)
                </label>
                <input
                  type="number"
                  value={settings.security.sessionTimeoutMinutes}
                  onChange={(e) =>
                    updateSetting(
                      "security",
                      "sessionTimeoutMinutes",
                      parseInt(e.target.value),
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Login Attempts
                </label>
                <input
                  type="number"
                  value={settings.security.maxLoginAttempts}
                  onChange={(e) =>
                    updateSetting(
                      "security",
                      "maxLoginAttempts",
                      parseInt(e.target.value),
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          )}

          {activeTab === "maintenance" && (
            <div className="space-y-4 max-w-lg">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.maintenance.enabled}
                  onChange={(e) =>
                    updateSetting("maintenance", "enabled", e.target.checked)
                  }
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <label className="text-sm font-medium text-gray-700">
                  Enable Maintenance Mode
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maintenance Message
                </label>
                <textarea
                  value={settings.maintenance.message}
                  onChange={(e) =>
                    updateSetting("maintenance", "message", e.target.value)
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
