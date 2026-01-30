"use server";

import { UserProfile } from "@/app/profile/page";
import { createClient } from "../supabase/server";

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

  const filteredMatches = potentialMatches
    .filter((match) => {
      if (!bodyTypePrefs || bodyTypePrefs.length === 0) return true;
      return bodyTypePrefs.includes(match.body_type);
    })
    .map((match) => ({
      id: match.id,
      full_name: match.full_name,
      username: match.username,
      email: "", 
      gender: match.gender,
      body_type: match.body_type,
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

/**
 * 3. LIKES SENT TO ME (PENDING)
 * People who liked you, but you haven't liked back yet.
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
 * People you liked, but they haven't liked you back yet.
 */
export async function getUsersILiked(): Promise<UserProfile[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated.");

  // Get people I liked
  const { data: myLikes, error } = await supabase
    .from("likes")
    .select("to_user_id")
    .eq("from_user_id", user.id);

  if (error) throw new Error("Failed to fetch your likes");

  const myLikedIds = myLikes?.map((l) => l.to_user_id) || [];

  if (myLikedIds.length === 0) return [];

  // Get people who liked ME back
  const { data: likesToMe } = await supabase
    .from("likes")
    .select("from_user_id")
    .eq("to_user_id", user.id);

  const usersWhoLikedMeBackIds = likesToMe?.map((l) => l.from_user_id) || [];

  // Filter out the ones who liked back (because they are matches)
  const pendingIds = myLikedIds.filter(id => !usersWhoLikedMeBackIds.includes(id));

  if (pendingIds.length === 0) return [];

  const { data: profiles } = await supabase.from("users").select("*").in("id", pendingIds);
  return (profiles || []).map(p => ({ ...p, email: "" }));
}

/**
 * 5. CONFIRMED MATCHES
 * Mutual likes that are now active conversations.
 */
export async function getUserMatches(): Promise<UserProfile[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated.");

  const { data: matches, error } = await supabase
    .from("matches")
    .select("*")
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .eq("is_active", true);

  if (error) throw new Error("Failed to fetch matches");

  const matchedUsers: UserProfile[] = [];

  for (const match of matches || []) {
    const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
    const { data: otherUser } = await supabase.from("users").select("*").eq("id", otherUserId).single();

    if (otherUser) {
      matchedUsers.push({
        ...otherUser,
        id: match.id, // Using Match ID for chat routing
        email: otherUser.email,
        created_at: match.created_at,
      });
    }
  }

  return matchedUsers;
}