"use client";

import PhotoUpload from "@/components/PhotoUpload";
import {
  getCurrentUserProfile,
  updateUserProfile,
} from "@/lib/actions/profile";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Standard options for body types
const BODY_TYPE_OPTIONS = ["Slim", "Athletic", "Average", "Curvy", "Plus Size"];

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
    body_type: "Average" as string, // User's own body type
    birthdate: "",
    avatar_url: "",
    preferences: {
      age_range: { min: 18, max: 100 },
      gender_preference: [] as ("male" | "female" | "other")[],
      body_types: [] as string[],
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
            gender: (profileData.gender as "male" | "female" | "other") || "male",
            body_type: profileData.body_type || "Average",
            birthdate: profileData.birthdate || "",
            avatar_url: profileData.avatar_url || "",
            preferences: {
              age_range: profileData.preferences?.age_range || { min: 18, max: 100 },
              gender_preference: (profileData.preferences?.gender_preference as ("male" | "female" | "other")[]) || [],
              body_types: profileData.preferences?.body_types || [],
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
      // TypeScript fix: We cast to 'any' here if your UserProfile type is still strict, 
      // ensuring the preference object matches your database structure.
      const result = await updateUserProfile(formData as any);
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

  const toggleBodyPreference = (type: string) => {
    setFormData(prev => {
      const current = prev.preferences.body_types;
      const next = current.includes(type)
        ? current.filter(t => t !== type)
        : [...current, type];
      return {
        ...prev,
        preferences: { ...prev.preferences, body_types: next }
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Edit Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Update your profile and dating preferences
          </p>
        </header>

        <div className="max-w-2xl mx-auto">
          <form
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8"
            onSubmit={handleFormSubmit}
          >
            {/* Profile Picture Section */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Profile Picture
              </label>
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden ring-2 ring-pink-500 ring-offset-2">
                    <img
                      src={formData.avatar_url || "/default-avatar.png"}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <PhotoUpload
                    onPhotoUploaded={(url) => {
                      setFormData((prev) => ({
                        ...prev,
                        avatar_url: url,
                      }));
                    }}
                  />
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Upload a new profile picture
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    JPG, PNG or GIF. Max 5MB.
                  </p>
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  My Gender *
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Birthday *
                </label>
                <input
                  type="date"
                  name="birthdate"
                  value={formData.birthdate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  My Body Type *
                </label>
                <select
                  name="body_type"
                  value={formData.body_type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
                >
                  {BODY_TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                About Me *
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                required
                rows={4}
                maxLength={500}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white resize-none"
                placeholder="Tell others about yourself..."
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formData.bio.length}/500 characters
              </p>
            </div>

            {/* --- PREFERENCES SECTION --- */}
            <div className="pt-8 border-t border-gray-200 dark:border-gray-700 mt-8">
              <h3 className="text-xl font-bold text-pink-600 dark:text-pink-400 mb-6">
                Discovery Preferences
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Min Age Preference
                  </label>
                  <input
                    type="number"
                    min="18"
                    max="100"
                    value={formData.preferences.age_range.min}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      preferences: { 
                        ...prev.preferences, 
                        age_range: { ...prev.preferences.age_range, min: parseInt(e.target.value) || 18 } 
                      }
                    }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Age Preference
                  </label>
                  <input
                    type="number"
                    min="18"
                    max="100"
                    value={formData.preferences.age_range.max}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      preferences: { 
                        ...prev.preferences, 
                        age_range: { ...prev.preferences.age_range, max: parseInt(e.target.value) || 100 } 
                      }
                    }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Interested in
                </label>
                <div className="flex flex-wrap gap-2">
                  {(["male", "female", "other"] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => toggleGenderPreference(g)}
                      className={`px-4 py-2 rounded-full border text-sm transition-all ${
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

              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Preferred Body Types
                </label>
                <div className="flex flex-wrap gap-2">
                  {BODY_TYPE_OPTIONS.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleBodyPreference(type)}
                      className={`px-4 py-2 rounded-full border text-sm transition-all ${
                        formData.preferences.body_types.includes(type)
                          ? "bg-red-500 border-red-500 text-white shadow-md"
                          : "bg-transparent border-gray-300 dark:border-gray-600 text-gray-500"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">Multiple selections allowed</p>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-2 bg-gradient-to-r from-pink-500 to-red-500 text-white font-bold rounded-lg hover:from-pink-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
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