"use client";

import { getCurrentUserProfile, updateUserProfile } from "@/lib/actions/profile";
import { useEffect, useState } from "react";
import { calculateAge } from "@/lib/helpers/calculate-age";
import { useRouter } from "next/navigation";

export interface UserProfile {
  id: string;
  full_name: string;
  username: string;
  email: string;
  gender: "male" | "female" | "other";
  birthdate: string;
  bio: string;
  avatar_url: string;
  preferences: UserPreferences;
  location_lat?: number;
  location_lng?: number;
  last_active: string;
  is_verified: boolean;
  is_online: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  age_range: { min: number; max: number };
  distance: number;
  gender_preference: ("male" | "female" | "other")[];
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const profileData = await getCurrentUserProfile();
        if (profileData) setProfile(profileData);
        else setError("Failed to load profile");
      } catch (err) {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const result = await updateUserProfile(profile);
    setSaving(false);
    if (result.success) {
      setIsEditing(false);
      router.refresh();
    } else {
      alert("Error saving: " + result.error);
    }
  };

  const toggleGenderPref = (g: "male" | "female" | "other") => {
    if (!profile) return;
    const current = profile.preferences.gender_preference;
    const next = current.includes(g) ? current.filter((i) => i !== g) : [...current, g];
    setProfile({ ...profile, preferences: { ...profile.preferences, gender_preference: next } });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (error || !profile) return <div className="p-10 text-center">{error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your identity and discovery settings</p>
          </div>
          <button
            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
            disabled={saving}
            className={`px-6 py-2 rounded-full font-bold shadow-md transition-all ${
              isEditing ? "bg-green-500 text-white" : "bg-white dark:bg-gray-700 text-pink-600"
            }`}
          >
            {saving ? "Saving..." : isEditing ? "Save Changes" : "Edit Profile"}
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* MAIN PROFILE CARD */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
              <div className="flex items-center space-x-6 mb-8">
                <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-pink-100">
                  <img src={profile.avatar_url || "/default-avatar.png"} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  {isEditing ? (
                    <input
                      className="text-2xl font-bold bg-gray-50 dark:bg-gray-700 border rounded px-2 w-full"
                      value={profile.full_name}
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    />
                  ) : (
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {profile.full_name}, {calculateAge(profile.birthdate)}
                    </h2>
                  )}
                  <p className="text-gray-500">@{profile.username}</p>
                </div>
              </div>

              {/* BIO */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">About Me</h3>
                {isEditing ? (
                  <textarea
                    rows={4}
                    className="w-full bg-gray-50 dark:bg-gray-700 border rounded-xl p-3"
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  />
                ) : (
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{profile.bio || "No bio yet."}</p>
                )}
              </div>

              {/* DATING PREFERENCES */}
              <div className="pt-6 border-t dark:border-gray-700 space-y-8">
                <h3 className="text-xl font-bold text-pink-600">Discovery Settings</h3>

                {/* GENDER PREFERENCE */}
                <div>
                  <label className="block text-sm font-semibold mb-3">Interested in:</label>
                  <div className="flex gap-2">
                    {["male", "female", "other"].map((g) => (
                      <button
                        key={g}
                        disabled={!isEditing}
                        onClick={() => toggleGenderPref(g as any)}
                        className={`px-4 py-1.5 rounded-full border transition-all ${
                          profile.preferences.gender_preference.includes(g as any)
                            ? "bg-pink-500 border-pink-500 text-white"
                            : "bg-transparent border-gray-300 text-gray-500"
                        } ${!isEditing && "opacity-80 cursor-default"}`}
                      >
                        {g.charAt(0).toUpperCase() + g.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* DISTANCE */}
                <div>
                  <div className="flex justify-between mb-2 text-sm font-semibold">
                    <label>Maximum Distance</label>
                    <span className="text-pink-500">{profile.preferences.distance} km</span>
                  </div>
                  <input
                    type="range"
                    disabled={!isEditing}
                    min="1"
                    max="100"
                    value={profile.preferences.distance}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        preferences: { ...profile.preferences, distance: parseInt(e.target.value) },
                      })
                    }
                    className="w-full accent-pink-500 disabled:opacity-50"
                  />
                </div>

                {/* AGE RANGE - DUAL SLIDER */}
                <div>
                  <div className="flex justify-between mb-2 text-sm font-semibold">
                    <label>Age Range</label>
                    <span className="text-pink-500">
                      {profile.preferences.age_range.min} - {profile.preferences.age_range.max}
                    </span>
                  </div>
                  <div className="relative h-6 flex items-center">
                    <div className="absolute w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full" />
                    <input
                      type="range"
                      disabled={!isEditing}
                      min="18"
                      max="100"
                      value={profile.preferences.age_range.min}
                      onChange={(e) => {
                        const val = Math.min(parseInt(e.target.value), profile.preferences.age_range.max - 1);
                        setProfile({
                          ...profile,
                          preferences: {
                            ...profile.preferences,
                            age_range: { ...profile.preferences.age_range, min: val },
                          },
                        });
                      }}
                      className="absolute w-full appearance-none bg-transparent pointer-events-none accent-pink-500 z-10 [&::-webkit-slider-thumb]:pointer-events-auto"
                    />
                    <input
                      type="range"
                      disabled={!isEditing}
                      min="18"
                      max="100"
                      value={profile.preferences.age_range.max}
                      onChange={(e) => {
                        const val = Math.max(parseInt(e.target.value), profile.preferences.age_range.min + 1);
                        setProfile({
                          ...profile,
                          preferences: {
                            ...profile.preferences,
                            age_range: { ...profile.preferences.age_range, max: val },
                          },
                        });
                      }}
                      className="absolute w-full appearance-none bg-transparent pointer-events-none accent-pink-500 z-20 [&::-webkit-slider-thumb]:pointer-events-auto"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="font-bold mb-4">Account Status</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Verified</span>
                  <span className={profile.is_verified ? "text-green-500 font-bold" : "text-gray-400"}>
                    {profile.is_verified ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Joined</span>
                  <span>{new Date(profile.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}