"use client";

import PhotoUpload from "@/components/PhotoUpload";
import {
  getCurrentUserProfile,
  updateUserProfile,
} from "@/lib/actions/profile";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    bio: "",
    gender: "male" as "male" | "female" | "other",
    birthdate: "",
    avatar_url: "",
    // Added preferences to state
    preferences: {
      age_range: { min: 18, max: 100 },
      distance: 50,
      gender_preference: [] as ("male" | "female" | "other")[],
    }
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const profileData = await getCurrentUserProfile();
        if (profileData) {
          setFormData({
            full_name: profileData.full_name || "",
            username: profileData.username || "",
            bio: profileData.bio || "",
            gender: profileData.gender || "male",
            birthdate: profileData.birthdate || "",
            avatar_url: profileData.avatar_url || "",
            // Populate preferences from DB or keep defaults
            preferences: profileData.preferences || {
              age_range: { min: 18, max: 100 },
              distance: 50,
              gender_preference: [],
            },
          });
        }
      } catch (err) {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const result = await updateUserProfile(formData);
      if (result.success) {
        router.push("/profile");
      } else {
        setError(result.error || "Failed to update profile.");
      }
    } catch (err) {
      setError("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  function handleInputChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  // Specific handler for nested preference changes
  const toggleGenderPreference = (gender: "male" | "female" | "other") => {
    setFormData(prev => {
      const current = prev.preferences.gender_preference;
      const next = current.includes(gender)
        ? current.filter(g => g !== gender)
        : [...current, gender];
      return {
        ...prev,
        preferences: { ...prev.preferences, gender_preference: next }
      };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Edit Profile</h1>
          <p className="text-gray-600 dark:text-gray-400">Update your profile and dating preferences</p>
        </header>

        <div className="max-w-2xl mx-auto">
          <form className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8" onSubmit={handleFormSubmit}>
            
            {/* Profile Picture Section */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Profile Picture</label>
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden ring-2 ring-pink-500 ring-offset-2">
                    <img
                      src={formData.avatar_url || "/default-avatar.png"}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <PhotoUpload onPhotoUploaded={(url) => setFormData(prev => ({ ...prev, avatar_url: url }))} />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Update your photo</p>
                  <p className="text-xs text-gray-500">JPG, PNG or GIF. Max 5MB.</p>
                </div>
              </div>
            </div>

            {/* Basic Info Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name *</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Username *</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">My Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Birthday</label>
                <input
                  type="date"
                  name="birthdate"
                  value={formData.birthdate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700"
                />
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium mb-2">Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 resize-none"
              />
            </div>

            {/* --- PREFERENCES SECTION --- */}
            <div className="pt-6 border-t border-gray-100 dark:border-gray-700 mt-8">
              <h3 className="text-xl font-bold text-pink-600 mb-6">Dating Preferences</h3>

              {/* Age Range Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Min Age</label>
                  <input
                    type="number"
                    min="18"
                    max="100"
                    value={formData.preferences.age_range.min}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      preferences: { 
                        ...prev.preferences, 
                        age_range: { ...prev.preferences.age_range, min: parseInt(e.target.value) } 
                      }
                    }))}
                    className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Max Age</label>
                  <input
                    type="number"
                    min="18"
                    max="100"
                    value={formData.preferences.age_range.max}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      preferences: { 
                        ...prev.preferences, 
                        age_range: { ...prev.preferences.age_range, max: parseInt(e.target.value) } 
                      }
                    }))}
                    className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700"
                  />
                </div>
              </div>

              {/* Distance Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Max Distance (km)</label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={formData.preferences.distance}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences, distance: parseInt(e.target.value) }
                  }))}
                  className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700"
                />
              </div>

              {/* Gender Preference Multi-select */}
              <div className="mb-8">
                <label className="block text-sm font-medium mb-3">Interested in (Show me)</label>
                <div className="flex gap-3">
                  {(["male", "female", "other"] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => toggleGenderPreference(g)}
                      className={`px-4 py-2 rounded-full border transition-all ${
                        formData.preferences.gender_preference.includes(g)
                          ? "bg-pink-500 border-pink-500 text-white shadow-md"
                          : "bg-transparent border-gray-300 dark:border-gray-600 text-gray-500"
                      }`}
                    >
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 text-gray-500 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-2 bg-gradient-to-r from-pink-500 to-red-500 text-white font-bold rounded-lg shadow-lg hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}