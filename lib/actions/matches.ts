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
    email: "", // Masking email for privacy
  } as UserProfile;
}

/**
 * 1. POTENTIAL MATCHES
 * STRICT FILTERING: Only fetches users who strictly fit gender AND body type preferences.
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

  if (userError || !currentUser) throw new Error("Failed to get user preferences");

  const prefs = currentUser.preferences as any;
  const genderPrefs = prefs?.gender_preference || [];
  const bodyTypePrefs = prefs?.body_types || [];

  // STRICT RULE: If no preferences are set, return empty to avoid random matches
  if (genderPrefs.length === 0 || bodyTypePrefs.length === 0) {
    return [];
  }

  const { data: alreadyLiked } = await supabase
    .from("likes")
    .select("to_user_id")
    .eq("from_user_id", user.id);

  const excludedIds = alreadyLiked?.map((l) => l.to_user_id) || [];
  excludedIds.push(user.id);

  // Database Filter: Gender & Exclusions
  let query = supabase
    .from("users")
    .select("*")
    .not("id", "in", `(${excludedIds.join(",")})`)
    .in("gender", genderPrefs);

  const { data: potentialMatches, error: fetchError } = await query.limit(50);

  if (fetchError) {
    throw new Error("failed to fetch potential matches");
  }

  // Application Filter: Strict Body Type check
  return potentialMatches
    .filter((match) => {
      return bodyTypePrefs.includes(match.body_type);
    })
    .map((match) => ({
      ...match,
      email: "", 
    }));
}

/**
 * 2. LIKE A USER
 * Handles liking a user and AUTOMATICALLY creates a record in 'matches' table if mutual.
 */
export async function likeUser(toUserId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated.");
  }

  // Create the record of your like
  const { error: likeError } = await supabase.from("likes").insert({
    from_user_id: user.id,
    to_user_id: toUserId,
  });

  if (likeError) {
    throw new Error("Failed to create like");
  }

  // Check if they liked you previously
  const { data: existingLike, error: checkError } = await supabase
    .from("likes")
    .select("*")
    .eq("from_user_id", toUserId)
    .eq("to_user_id", user.id)
    .single();

  if (checkError && checkError.code !== "PGRST116") {
    throw new Error("Failed to check for match");
  }

  // If mutual like exists, create the official Match record
  if (existingLike) {
    const { error: matchTableError } = await supabase.from("matches").insert({
      user1_id: user.id,
      user2_id: toUserId,
      is_active: true
    });

    if (matchTableError) console.error("Match record creation failed:", matchTableError.message);

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