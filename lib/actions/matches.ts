"use server";

import { UserProfile } from "@/app/profile/page";
import { createClient } from "../supabase/server";

export async function getPotentialMatches(): Promise<UserProfile[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated.");
  }

  // 1. Get the current user's preferences (Gender and Body Types)
  const { data: currentUser, error: userError } = await supabase
    .from("users")
    .select("preferences")
    .eq("id", user.id)
    .single();

  if (userError) throw new Error("Failed to get user preferences");

  const prefs = currentUser.preferences as any;
  const genderPrefs = prefs?.gender_preference || [];
  const bodyTypePrefs = prefs?.body_types || [];

  // 2. Get IDs of users we have already liked to exclude them
  const { data: alreadyLiked } = await supabase
    .from("likes")
    .select("to_user_id")
    .eq("from_user_id", user.id);

  const excludedIds = alreadyLiked?.map((l) => l.to_user_id) || [];
  excludedIds.push(user.id); // Also exclude ourselves

  // 3. Build the query
  let query = supabase
    .from("users")
    .select("*")
    .not("id", "in", `(${excludedIds.join(",")})`);

  // Filter by gender if preferences exist
  if (genderPrefs.length > 0) {
    query = query.in("gender", genderPrefs);
  }

  const { data: potentialMatches, error: fetchError } = await query.limit(50);

  if (fetchError) {
    throw new Error("failed to fetch potential matches");
  }

  // 4. Filter by Body Type (since complex JSON array matching is easier in JS than simple SQL)
  const filteredMatches = potentialMatches
    .filter((match) => {
      // If user has no body type preferences, show everyone (within gender)
      if (!bodyTypePrefs || bodyTypePrefs.length === 0) return true;
      // Otherwise, only show if the match's body type is in the preference list
      return bodyTypePrefs.includes(match.body_type);
    })
    .map((match) => ({
      id: match.id,
      full_name: match.full_name,
      username: match.username,
      email: "", // Keep email private during discovery
      gender: match.gender,
      body_type: match.body_type, // Added this field
      birthdate: match.birthdate,
      bio: match.bio,
      avatar_url: match.avatar_url,
      preferences: match.preferences,
      location_lat: undefined,
      location_lng: undefined,
      last_active: match.last_active,
      is_verified: match.is_verified,
      is_online: match.is_online,
      created_at: match.created_at,
      updated_at: match.updated_at,
    }));

  return filteredMatches;
}

export async function likeUser(toUserId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated.");
  }

  // Create the like
  const { error: likeError } = await supabase.from("likes").insert({
    from_user_id: user.id,
    to_user_id: toUserId,
  });

  if (likeError) {
    throw new Error("Failed to create like");
  }

  // Check if it's a mutual match
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
    const { data: matchedUser, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", toUserId)
      .single();

    if (userError) {
      throw new Error("Failed to fetch matched user");
    }

    return {
      success: true,
      isMatch: true,
      matchedUser: matchedUser as UserProfile,
    };
  }

  return { success: true, isMatch: false };
}

export async function getUserMatches() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated.");
  }

  // Fetch all active matches for the user
  const { data: matches, error } = await supabase
    .from("matches")
    .select("*")
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .eq("is_active", true);

  if (error) {
    throw new Error("Failed to fetch matches");
  }

  const matchedUsers: UserProfile[] = [];

  for (const match of matches || []) {
    const otherUserId =
      match.user1_id === user.id ? match.user2_id : match.user1_id;

    const { data: otherUser, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", otherUserId)
      .single();

    if (userError) continue;

    matchedUsers.push({
      ...otherUser,
      email: otherUser.email, // Can show email once matched
    });
  }

  return matchedUsers;
}