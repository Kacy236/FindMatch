"use client";

import { getCurrentUserProfile } from "@/lib/actions/profile";
import { useEffect, useState } from "react";
import Link from "next/link";
import { calculateAge } from "@/lib/helpers/calculate-age";

// --- Interfaces ---
export interface UserPreferences {
  age_range: {
    min: number;
    max: number;
  };
  distance: number;
  gender_preference: ("male" | "female" | "other")[];
  body_types?: string[];
}

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

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const profileData = await getCurrentUserProfile();
        if (profileData) {
          // Explicitly casting the gender arrays to match our local Interface
          setProfile(profileData as UserProfile);
        } else {
          setError("Failed to load profile");
        }
      } catch (err) {
        console.error("Error loading profile: ", err);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-xl">
          <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">❌</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Profile not found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || "Unable to load your profile. Please try again."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-pink-500 to-red-500 text-white font-semibold py-3 px-8 rounded-full hover:shadow-lg transition-all duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    // Fixed "Black Void": Added min-h-screen and a matching background color to the bottom
    <div className="min-h-screen w-full bg-gradient-to-br from-pink-50 via-white to-red-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-3">
            My Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
            This is how your profile appears to others. Keep your preferences updated to find better matches.
          </p>
        </header>

        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            
            {/* --- Main Content Column --- */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                {/* Header/Cover Area */}
                <div className="h-32 bg-gradient-to-r from-pink-400 to-red-400"></div>
                
                <div className="px-8 pb-8">
                  <div className="relative flex flex-col md:flex-row items-center md:items-end -mt-16 mb-8 gap-6">
                    <div className="relative">
                      <div className="w-40 h-40 rounded-3xl overflow-hidden ring-8 ring-white dark:ring-gray-800 shadow-2xl">
                        <img
                          src={profile.avatar_url || "/default-avatar.png"}
                          alt={profile.full_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {profile.is_online && (
                        <div className="absolute bottom-3 right-3 w-6 h-6 bg-green-500 border-4 border-white dark:border-gray-800 rounded-full"></div>
                      )}
                    </div>

                    <div className="flex-1 text-center md:text-left pb-2">
                      <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                          {profile.full_name}, {calculateAge(profile.birthdate)}
                        </h2>
                        {profile.is_verified && (
                          <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.64.304 1.24.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <p className="text-pink-600 font-semibold text-lg">@{profile.username}</p>
                    </div>
                  </div>

                  {/* Bio Section */}
                  <div className="space-y-8">
                    <div className="bg-gray-50 dark:bg-gray-700/30 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">About Me</h3>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg whitespace-pre-wrap">
                        {profile.bio || "No bio added yet. Click edit to tell people about yourself!"}
                      </p>
                    </div>

                    {/* Information Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <span className="w-1.5 h-6 bg-pink-500 rounded-full"></span>
                          Basic Details
                        </h3>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
                            <span className="text-gray-500">Gender</span>
                            <span className="text-gray-900 dark:text-white font-medium capitalize">{profile.gender}</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
                            <span className="text-gray-500">Birthday</span>
                            <span className="text-gray-900 dark:text-white font-medium">
                              {new Date(profile.birthdate).toLocaleDateString(undefined, {
                                year: 'numeric', month: 'long', day: 'numeric'
                              })}
                            </span>
                          </div>
                          <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
                            <span className="text-gray-500">Status</span>
                            <span className="flex items-center gap-1.5 font-medium text-gray-900 dark:text-white">
                              <span className={`w-2 h-2 rounded-full ${profile.is_online ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                              {profile.is_online ? "Active Now" : "Offline"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <span className="w-1.5 h-6 bg-red-500 rounded-full"></span>
                          Discovery Settings
                        </h3>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
                            <span className="text-gray-500">Age Range</span>
                            <span className="text-gray-900 dark:text-white font-medium">
                              {profile.preferences.age_range.min} - {profile.preferences.age_range.max} years
                            </span>
                          </div>
                          <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
                            <span className="text-gray-500">Radius</span>
                            <span className="text-gray-900 dark:text-white font-medium">{profile.preferences.distance} km</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Preferences Tags Section */}
                    <div className="pt-4 space-y-6">
                      <div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">I'm Interested In</h3>
                        <div className="flex flex-wrap gap-3">
                          {profile.preferences.gender_preference.map((g) => (
                            <span key={g} className="px-5 py-2 bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300 rounded-xl font-bold border border-pink-200 dark:border-pink-800 capitalize shadow-sm">
                              {g}
                            </span>
                          ))}
                        </div>
                      </div>

                      {profile.preferences.body_types && profile.preferences.body_types.length > 0 && (
                        <div>
                          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Preferred Body Types</h3>
                          <div className="flex flex-wrap gap-3">
                            {profile.preferences.body_types.map((type) => (
                              <span key={type} className="px-5 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-xl font-bold border border-indigo-100 dark:border-indigo-800 shadow-sm">
                                {type}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* --- Sidebar Column --- */}
            <div className="space-y-8">
              {/* Profile Completion / Quick Actions */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-8">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Manage Profile</h3>
                <div className="space-y-4">
                  <Link
                    href="/profile/edit"
                    className="flex items-center justify-between w-full p-4 rounded-2xl bg-gradient-to-r from-pink-500 to-red-500 text-white font-bold shadow-lg shadow-pink-500/20 hover:scale-[1.03] transition-transform"
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      <span>Edit My Info</span>
                    </div>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                  
                  <div className="p-4 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Profile Visibility</span>
                      <span className="text-green-500 font-bold">Public</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                      <div className="bg-pink-500 w-[90%] h-full"></div>
                    </div>
                    <p className="text-[10px] text-gray-400 text-center">Your profile is 90% complete</p>
                  </div>
                </div>
              </div>

              {/* Account Meta Data */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-8">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Account Summary</h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-400">Handle</p>
                      <p className="text-gray-900 dark:text-white font-mono text-sm">@{profile.username}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center text-purple-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs text-gray-400">Email Address</p>
                      <p className="text-gray-900 dark:text-white text-sm truncate">{profile.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center text-green-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-400">Joined Date</p>
                      <p className="text-gray-900 dark:text-white text-sm">
                        {new Date(profile.created_at).toLocaleDateString(undefined, {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative Spacer to ensure background consistency */}
      <div className="h-20 w-full"></div>
    </div>
  );
}