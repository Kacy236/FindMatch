"use server";

import { UserProfile } from "@/app/profile/page";
import { createClient } from "../supabase/server";

/**
 * NEW: GET USER BY ID
 * Fetches a specific user profile by their ID.
 */
export async function getUserById(userId: string): Promise<UserProfile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching user by ID:", error.message);
    return null;
  }

  return {
    ...data,
    email: "", // Masking email for privacy unless needed
  } as UserProfile;
}

/**
 * 1. POTENTIAL MATCHES
 * Fetches users who haven't been liked yet but match current user preferences.
 */
export async function getPotentialMatches(): Promise<UserProfile[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated.");
  }

  const { data: currentUser, error: userError } = await supabase
    .from("users")
    .select("preferences")
    .eq("id", user.id)
    .single();

  if (userError) throw new Error("Failed to get user preferences");

  const prefs = currentUser.preferences as any;
  const genderPrefs = prefs?.gender_preference || [];
  const bodyTypePrefs = prefs?.body_types || [];

  const { data: alreadyLiked } = await supabase
    .from("likes")
    .select("to_user_id")
    .eq("from_user_id", user.id);

  const excludedIds = alreadyLiked?.map((l) => l.to_user_id) || [];
  excludedIds.push(user.id);

  let query = supabase
    .from("users")
    .select("*")
    .not("id", "in", `(${excludedIds.join(",")})`);

  if (genderPrefs.length > 0) {
    query = query.in("gender", genderPrefs);
  }

  const { data: potentialMatches, error: fetchError } = await query.limit(50);

  if (fetchError) {
    throw new Error("failed to fetch potential matches");
  }

  return potentialMatches
    .filter((match) => {
      if (!bodyTypePrefs || bodyTypePrefs.length === 0) return true;
      return bodyTypePrefs.includes(match.body_type);
    })
    .map((match) => ({
      ...match,
      email: "", 
    }));
}

/**
 * 2. LIKE A USER
 * Handles liking a user and checks for mutual matches.
 */
export async function likeUser(toUserId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated.");
  }

  const { error: likeError } = await supabase.from("likes").insert({
    from_user_id: user.id,
    to_user_id: toUserId,
  });

  if (likeError) {
    throw new Error("Failed to create like");
  }

  const { data: existingLike, error: checkError } = await supabase
    .from("likes")
    .select("*")
    .eq("from_user_id", toUserId)
    .eq("to_user_id", user.id)
    .single();

  if (checkError && checkError.code !== "PGRST116") {
    throw new Error("Failed to check for match");
  }

  if (existingLike) {
    const matchedUser = await getUserById(toUserId);

    return {
      success: true,
      isMatch: true,
      matchedUser,
    };
  }

  return { success: true, isMatch: false };
}

/**
 * 3. LIKES SENT TO ME (PENDING)
 */
export async function getUsersWhoLikedMe(): Promise<UserProfile[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated.");

  const { data: myLikes } = await supabase
    .from("likes")
    .select("to_user_id")
    .eq("from_user_id", user.id);

  const myLikedIds = myLikes?.map((l) => l.to_user_id) || [];

  const { data: likesToMe, error } = await supabase
    .from("likes")
    .select("from_user_id")
    .eq("to_user_id", user.id);

  if (error) throw new Error("Failed to fetch likes to me");

  const likerIds = (likesToMe || [])
    .map((l) => l.from_user_id)
    .filter((id) => !myLikedIds.includes(id));

  if (likerIds.length === 0) return [];

  const { data: profiles } = await supabase.from("users").select("*").in("id", likerIds);
  return (profiles || []).map(p => ({ ...p, email: "" }));
}

/**
 * 4. LIKES SENT BY ME (PENDING)
 */
export async function getUsersILiked(): Promise<UserProfile[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated.");

  const { data: myLikes, error } = await supabase
    .from("likes")
    .select("to_user_id")
    .eq("from_user_id", user.id);

  if (error) throw new Error("Failed to fetch your likes");

  const myLikedIds = myLikes?.map((l) => l.to_user_id) || [];
  if (myLikedIds.length === 0) return [];

  const { data: likesToMe } = await supabase
    .from("likes")
    .select("from_user_id")
    .eq("to_user_id", user.id);

  const usersWhoLikedMeBackIds = likesToMe?.map((l) => l.from_user_id) || [];
  const pendingIds = myLikedIds.filter(id => !usersWhoLikedMeBackIds.includes(id));

  if (pendingIds.length === 0) return [];

  const { data: profiles } = await supabase.from("users").select("*").in("id", pendingIds);
  return (profiles || []).map(p => ({ ...p, email: "" }));
}

/**
 * 5. CONFIRMED MATCHES
 * Optimized to fetch all "other users" in one query.
 */
export async function getUserMatches(): Promise<UserProfile[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");

  const { data: matches, error } = await supabase
    .from("matches")
    .select("*")
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .eq("is_active", true);

  if (error) throw new Error("Failed to fetch matches");
  if (!matches || matches.length === 0) return [];

  const otherUserIds = matches.map(m => m.user1_id === user.id ? m.user2_id : m.user1_id);

  const { data: profiles, error: profileError } = await supabase
    .from("users")
    .select("*")
    .in("id", otherUserIds);

  if (profileError) throw new Error("Failed to fetch match profiles");

  return profiles.map(profile => {
    const matchRecord = matches.find(m => m.user1_id === profile.id || m.user2_id === profile.id);
    return {
      ...profile,
      id: matchRecord?.id, // Keep Match ID for routing
      email: profile.email,
      created_at: matchRecord?.created_at,
    };
  });
}