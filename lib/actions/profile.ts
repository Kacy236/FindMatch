"use server";

import { UserProfile } from "@/app/profile/page";
import { createClient } from "../supabase/server";

/**
 * Fetches the current user's profile from the 'users' table.
 */
export async function getCurrentUserProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }

  return profile;
}

/**
 * Updates the user's profile, including the complex 'preferences' JSON object.
 */
export async function updateUserProfile(profileData: Partial<UserProfile>) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  const { error } = await supabase
    .from("users")
    .update({
      full_name: profileData.full_name,
      username: profileData.username,
      bio: profileData.bio,
      gender: profileData.gender,
      birthdate: profileData.birthdate,
      avatar_url: profileData.avatar_url,
      // FIX: Added 'preferences' to the update object so JSON changes persist
      preferences: profileData.preferences, 
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("Database Update Error:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Handles profile photo uploads to Supabase Storage.
 */
export async function uploadProfilePhoto(file: File) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  const fileExt = file.name.split(".").pop();
  const fileName = `${user.id}-${Date.now()}.${fileExt}`;

  const { error } = await supabase.storage
    .from("profile-photos")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    return { success: false, error: error.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("profile-photos").getPublicUrl(fileName);
  
  return { success: true, url: publicUrl };
}