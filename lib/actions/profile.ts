"use server";

import { UserProfile } from "@/app/profile/page";
import { createClient } from "../supabase/server";
import { revalidatePath } from "next/cache";

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
 * Updates the user's profile, including the new 'body_type' field and preferences.
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
      body_type: profileData.body_type,
      birthdate: profileData.birthdate,
      avatar_url: profileData.avatar_url,
      preferences: profileData.preferences,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("Database Update Error:", error);
    return { success: false, error: error.message };
  }

  // Refresh the profile page data
  revalidatePath("/profile");
  return { success: true };
}

/**
 * Handles profile photo uploads to the 'avatars' bucket.
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
  // We use user.id in the path to help with RLS organization
  const fileName = `${user.id}/${Date.now()}.${fileExt}`;

  // 1. Upload to the bucket named 'avatars'
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    console.error("Storage Upload Error:", uploadError);
    return { success: false, error: uploadError.message };
  }

  // 2. Get the public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(fileName);

  // 3. Update the avatar_url in the 'users' table immediately
  const { error: updateError } = await supabase
    .from("users")
    .update({ 
      avatar_url: publicUrl,
      updated_at: new Date().toISOString() 
    })
    .eq("id", user.id);

  if (updateError) {
    console.error("Database Update Error after upload:", updateError);
    return { success: false, error: "Photo uploaded but failed to update profile link." };
  }

  // 4. Revalidate cache so the new image appears on the profile page
  revalidatePath("/profile");
  
  return { success: true, url: publicUrl };
}