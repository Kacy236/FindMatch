"use client";

import { getCurrentUserProfile } from "@/lib/actions/profile";
import { useEffect, useState } from "react";
import Link from "next/link";
import { calculateAge } from "@/lib/helpers/calculate-age";

// Updated Interfaces
export interface UserPreferences {
  age_range: {
    min: number;
    max: number;
  };
  gender_preference: ("male" | "female" | "other")[];
  body_types?: string[];
}

export interface UserProfile {
  id: string;
  full_name: string;
  username: string;
  email: string;
  gender: "male" | "female" | "other";
  body_type: string;
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 border-4 border-pink-200 dark:border-pink-900 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-pink-500 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="mt-6 text-gray-500 dark:text-gray-400 font-medium animate-pulse">
            Curating your profile...
          </p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-xl max-w-sm w-full text-center border border-gray-100 dark:border-gray-800">
          <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl text-red-500">⚠️</span>
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Oops!</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
            {error || "We couldn't retrieve your profile data right now."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gray-900 dark:bg-white dark:text-gray-900 text-white font-bold py-4 rounded-2xl hover:opacity-90 transition-all active:scale-95"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFD] dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-20">
      {/* Mobile Sticky Header */}
      <div className="sticky top-0 z-30 lg:hidden bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
        <h1 className="text-xl font-black tracking-tight">My Profile</h1>
        <Link href="/profile/edit" className="bg-pink-50 dark:bg-pink-900/20 text-pink-600 p-2 rounded-full">
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
        </Link>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-6 lg:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Media & Core Stats */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-6">
              <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 transition-all hover:shadow-xl">
                <div className="aspect-[3/4] relative group">
                  <img
                    key={profile.avatar_url}
                    src={profile.avatar_url || "/default-avatar.png"}
                    alt={profile.full_name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/default-avatar.png"; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <div className="absolute bottom-6 left-6 right-6 text-white">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-3xl font-black tracking-tight">
                        {profile.full_name}, {calculateAge(profile.birthdate)}
                      </h2>
                      {profile.is_verified && (
                        <div className="bg-blue-500 rounded-full p-1 shadow-lg">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.64.304 1.24.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" /></svg>
                        </div>
                      )}
                    </div>
                    <p className="text-white/80 font-medium">@{profile.username}</p>
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Status</span>
                    <span className="flex items-center gap-1.5 font-bold text-green-500">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      Online
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Joined</span>
                    <span className="font-bold text-gray-700 dark:text-gray-300">
                      {new Date(profile.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Desktop Quick Actions */}
              <div className="hidden lg:block bg-white dark:bg-gray-900 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                <Link
                  href="/profile/edit"
                  className="w-full flex items-center justify-center gap-2 bg-gray-900 dark:bg-white dark:text-gray-900 text-white font-bold py-4 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  Edit Profile
                </Link>
              </div>
            </div>

            {/* Right Column: Information & Preferences */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-8">
              
              {/* Bio Card */}
              <section className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 shadow-sm border border-gray-100 dark:border-gray-800">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-pink-500 mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                  About Me
                </h3>
                <p className="text-lg lg:text-xl text-gray-700 dark:text-gray-300 leading-relaxed font-medium italic">
                  "{profile.bio || "This user prefers to keep things mysterious..."}"
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-10">
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-3xl border border-gray-100 dark:border-gray-800">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Gender</p>
                    <p className="font-bold text-gray-900 dark:text-white capitalize">{profile.gender}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-3xl border border-gray-100 dark:border-gray-800">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Body Type</p>
                    <p className="font-bold text-gray-900 dark:text-white">{profile.body_type || "Secret"}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 col-span-2 md:col-span-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Birthday</p>
                    <p className="font-bold text-gray-900 dark:text-white">
                      {new Date(profile.birthdate).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              </section>

              {/* Preferences Section */}
              <section className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 shadow-sm border border-gray-100 dark:border-gray-800">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-pink-500 mb-8 flex items-center gap-2">
                  <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                  Dating Preferences
                </h3>
                
                <div className="space-y-10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-lg">Ideal Age Range</h4>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Looking for partners between these ages</p>
                    </div>
                    <div className="inline-flex items-center gap-3 bg-pink-50 dark:bg-pink-900/10 px-6 py-3 rounded-2xl border border-pink-100 dark:border-pink-900/20">
                      <span className="text-2xl font-black text-pink-600 dark:text-pink-400">
                        {profile.preferences.age_range.min} — {profile.preferences.age_range.max}
                      </span>
                      <span className="text-pink-400 text-xs font-bold uppercase tracking-tighter">years</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        Interested In
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {profile.preferences.gender_preference.map((g) => (
                          <span key={g} className="px-4 py-2 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm font-bold rounded-xl shadow-sm capitalize">
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>

                    {profile.preferences.body_types && profile.preferences.body_types.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="font-bold text-gray-900 dark:text-white">Body Preferences</h4>
                        <div className="flex flex-wrap gap-2">
                          {profile.preferences.body_types.map((type) => (
                            <span key={type} className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-black rounded-xl">
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Account Details Footer */}
              <section className="bg-gray-50 dark:bg-gray-900/50 rounded-[2rem] p-6 border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-xl shadow-sm">📧</div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Account Email</p>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{profile.email}</p>
                  </div>
                </div>
                <div className="h-px w-full md:w-px md:h-8 bg-gray-200 dark:bg-gray-700"></div>
                <p className="text-xs text-gray-400 font-medium">
                  ID: <span className="font-mono">{profile.id.slice(0, 8)}...</span>
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Floating Action Button */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-[280px] lg:hidden z-40">
        <Link
          href="/profile/edit"
          className="flex items-center justify-center gap-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black py-5 px-8 rounded-full shadow-2xl shadow-rose-500/40 active:scale-95 transition-transform"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          Edit My Profile
        </Link>
      </div>
    </div>
  );
}