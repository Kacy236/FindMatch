"use client";

import PhotoUpload from "@/components/PhotoUpload";
import {
  getCurrentUserProfile,
  updateUserProfile,
} from "@/lib/actions/profile";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Standard options
const BODY_TYPE_OPTIONS = ["Slim", "Athletic", "Average", "Curvy", "Plus Size"];
const INTEREST_OPTIONS = [
  "Music", "Travel", "Cooking", "Gaming", "Fitness", 
  "Art", "Movies", "Photography", "Reading", "Dancing",
  "Hiking", "Tech", "Fashion", "Yoga", "Coffee"
];

// Define a type that allows numbers to be empty strings during editing
interface ProfileFormData {
  full_name: string;
  username: string;
  bio: string;
  gender: "male" | "female" | "other";
  body_type: string;
  birthdate: string;
  avatar_url: string;
  preferences: {
    age_range: { 
      min: number | ""; 
      max: number | ""; 
    };
    gender_preference: ("male" | "female" | "other")[];
    body_types: string[];
    interests: string[];
  };
}

export default function EditProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState<ProfileFormData>({
    full_name: "",
    username: "",
    bio: "",
    gender: "male",
    body_type: "Average",
    birthdate: "",
    avatar_url: "",
    preferences: {
      age_range: { min: 18, max: 100 },
      gender_preference: [],
      body_types: [],
      interests: [],
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
              age_range: {
                min: profileData.preferences?.age_range?.min ?? 18,
                max: profileData.preferences?.age_range?.max ?? 100,
              },
              gender_preference: (profileData.preferences?.gender_preference as ("male" | "female" | "other")[]) || [],
              body_types: profileData.preferences?.body_types || [],
              interests: profileData.preferences?.interests || [],
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
    setError(null);

    if (!formData.avatar_url || formData.avatar_url.trim() === "") {
      setError("A profile photo is required to save your profile.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Validate that we aren't sending empty strings to the backend
    const finalData = {
      ...formData,
      preferences: {
        ...formData.preferences,
        age_range: {
          min: formData.preferences.age_range.min === "" ? 18 : formData.preferences.age_range.min,
          max: formData.preferences.age_range.max === "" ? 100 : formData.preferences.age_range.max,
        }
      }
    };

    setSaving(true);

    try {
      const result = await updateUserProfile(finalData as any);
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

  const toggleInterest = (interest: string) => {
    setFormData(prev => {
      const current = prev.preferences.interests;
      const next = current.includes(interest)
        ? current.filter(i => i !== interest)
        : [...current, interest];
      return {
        ...prev,
        preferences: { ...prev.preferences, interests: next }
      };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-6 sm:py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header Section */}
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Edit Profile
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm sm:text-base">
              Update your information and who you're looking for
            </p>
          </div>
          <button 
            onClick={() => router.back()}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <form onSubmit={handleFormSubmit} className="space-y-6">
          
          {/* Section: Profile Image */}
          <section className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-800">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-pink-500 rounded-full"></span>
              Profile Photo
            </h2>
            <div className={`p-6 rounded-2xl border-2 transition-all ${!formData.avatar_url ? 'border-dashed border-pink-200 bg-pink-50/30 dark:bg-pink-900/10' : 'border-transparent bg-gray-50 dark:bg-gray-800/50'}`}>
              <div className="flex flex-col sm:flex-row items-center gap-8">
                <div className="relative group">
                  <div className={`w-32 h-32 rounded-3xl overflow-hidden ring-4 transition-all duration-300 ${!formData.avatar_url ? 'ring-pink-400 animate-pulse' : 'ring-white dark:ring-gray-700 shadow-xl'}`}>
                    <img
                      key={formData.avatar_url}
                      src={formData.avatar_url || "/default-avatar.png"}
                      alt="Profile"
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/default-avatar.png";
                      }}
                    />
                  </div>
                  <div className="absolute -bottom-3 -right-3">
                    <PhotoUpload
                      onPhotoUploaded={(url) => {
                        setFormData((prev) => ({ ...prev, avatar_url: url }));
                        setError(null);
                      }}
                    />
                  </div>
                </div>

                <div className="text-center sm:text-left flex-1">
                  <h3 className={`text-base font-bold mb-1 ${!formData.avatar_url ? 'text-pink-600' : 'text-gray-900 dark:text-white'}`}>
                    {formData.avatar_url ? 'Profile photo uploaded' : 'Upload a photo (Required)'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
                    A clear photo helps you connect with more people. 
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Basic Details */}
          <section className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-800">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-pink-500 rounded-full"></span>
              Basic Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Full Name *</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 rounded-2xl border-none bg-gray-100 dark:bg-gray-800 focus:ring-2 focus:ring-pink-500 transition-all dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Username *</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 rounded-2xl border-none bg-gray-100 dark:bg-gray-800 focus:ring-2 focus:ring-pink-500 transition-all dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">My Gender *</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 rounded-2xl border-none bg-gray-100 dark:bg-gray-800 focus:ring-2 focus:ring-pink-500 transition-all dark:text-white"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Birthday *</label>
                <input
                  type="date"
                  name="birthdate"
                  value={formData.birthdate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 rounded-2xl border-none bg-gray-100 dark:bg-gray-800 focus:ring-2 focus:ring-pink-500 transition-all dark:text-white"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">My Body Type *</label>
                <select
                  name="body_type"
                  value={formData.body_type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 rounded-2xl border-none bg-gray-100 dark:bg-gray-800 focus:ring-2 focus:ring-pink-500 transition-all dark:text-white"
                >
                  {BODY_TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">About Me *</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  maxLength={500}
                  placeholder="What makes you, you?"
                  className="w-full px-4 py-3 rounded-2xl border-none bg-gray-100 dark:bg-gray-800 focus:ring-2 focus:ring-pink-500 transition-all dark:text-white resize-none"
                />
              </div>
            </div>
          </section>

          {/* Section: Interests */}
          <section className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-800">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-pink-500 rounded-full"></span>
              Interests & Hobbies
            </h2>
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    formData.preferences.interests.includes(interest)
                      ? "bg-pink-500 text-white shadow-lg shadow-pink-200 dark:shadow-none"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </section>

          {/* Section: Preferences */}
          <section className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-800">
            <h2 className="text-lg font-bold text-pink-500 mb-6 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-pink-500 rounded-full"></span>
              Discovery Preferences
            </h2>

            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Preferred Age Range</label>
                <div className="flex items-center gap-4">
                  <div className="flex-1 space-y-1">
                    <span className="text-[10px] text-gray-400 ml-2">MIN</span>
                    <input
                      type="number"
                      min="18"
                      max="100"
                      value={formData.preferences.age_range.min}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          preferences: { 
                            ...prev.preferences, 
                            age_range: { ...prev.preferences.age_range, min: val === "" ? "" : parseInt(val) } 
                          }
                        }));
                      }}
                      onBlur={(e) => {
                        const val = parseInt(e.target.value);
                        if (e.target.value === "" || isNaN(val) || val < 18) {
                          setFormData(prev => ({
                            ...prev,
                            preferences: { 
                              ...prev.preferences, 
                              age_range: { ...prev.preferences.age_range, min: 18 } 
                            }
                          }));
                        }
                      }}
                      className="w-full px-4 py-2 rounded-xl border-none bg-gray-100 dark:bg-gray-800 font-bold dark:text-white"
                    />
                  </div>
                  <div className="h-0.5 w-4 bg-gray-200 mt-4"></div>
                  <div className="flex-1 space-y-1">
                    <span className="text-[10px] text-gray-400 ml-2">MAX</span>
                    <input
                      type="number"
                      min="18"
                      max="100"
                      value={formData.preferences.age_range.max}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          preferences: { 
                            ...prev.preferences, 
                            age_range: { ...prev.preferences.age_range, max: val === "" ? "" : parseInt(val) } 
                          }
                        }));
                      }}
                      onBlur={(e) => {
                        const val = parseInt(e.target.value);
                        if (e.target.value === "" || isNaN(val) || val > 100) {
                          setFormData(prev => ({
                            ...prev,
                            preferences: { 
                              ...prev.preferences, 
                              age_range: { ...prev.preferences.age_range, max: 100 } 
                            }
                          }));
                        }
                      }}
                      className="w-full px-4 py-2 rounded-xl border-none bg-gray-100 dark:bg-gray-800 font-bold dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Interested in</label>
                <div className="flex flex-wrap gap-3">
                  {(["male", "female", "other"] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => toggleGenderPreference(g)}
                      className={`px-6 py-2.5 rounded-2xl text-sm font-bold transition-all ${
                        formData.preferences.gender_preference.includes(g)
                          ? "bg-pink-500 text-white shadow-lg"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                      }`}
                    >
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Preferred Body Types</label>
                <div className="flex flex-wrap gap-2">
                  {BODY_TYPE_OPTIONS.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleBodyPreference(type)}
                      className={`px-4 py-2 rounded-xl text-xs font-medium border-2 transition-all ${
                        formData.preferences.body_types.includes(type)
                          ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white"
                          : "bg-transparent border-gray-100 dark:border-gray-800 text-gray-500"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm font-bold">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 pb-10">
            <button
              type="button"
              onClick={() => router.back()}
              className="w-full sm:w-auto px-10 py-4 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold py-4 px-10 rounded-3xl shadow-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
            >
              {saving ? "Saving..." : "Save Profile Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}