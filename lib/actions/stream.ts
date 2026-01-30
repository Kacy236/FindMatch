"use server";

import { StreamChat } from "stream-chat";
import { createClient } from "../supabase/server";

/**
 * Generates a Stream Chat token for the current authenticated user.
 * Also synchronizes the user's profile data (name, image) with Stream.
 */
export async function getStreamUserToken() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .single();

  if (userError) {
    console.error("Error fetching user data:", userError);
    throw new Error("Failed to fetch user data");
  }

  const serverClient = StreamChat.getInstance(
    process.env.NEXT_PUBLIC_STREAM_API_KEY!,
    process.env.STREAM_API_SECRET!
  );

  const token = serverClient.createToken(user.id);

  // Sync user info to Stream
  await serverClient.upsertUser({
    id: user.id,
    name: userData.full_name,
    image: userData.avatar_url || undefined,
  });

  return {
    token,
    userId: user.id,
    userName: userData.full_name,
    userImage: userData.avatar_url || undefined,
  };
}

/**
 * Creates or retrieves a messaging channel between two matched users.
 * Uses the Match ID to verify the relationship and generate a unique channel ID.
 */
export async function createOrGetChannel(matchId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  // 1. Fetch the match directly from Supabase to verify it exists and is active
  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .eq("is_active", true)
    .single();

  if (matchError || !match) {
    console.error("Match verification failed:", matchError);
    throw new Error("Match not found or inactive. Access denied.");
  }

  // 2. Determine the other participant in the match
  const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;

  // 3. Create a unique Stream Channel ID using the matchId
  // Stream IDs must be alphanumeric and underscores only (no hyphens)
  const channelId = `match_${matchId.replace(/-/g, "_")}`;

  const serverClient = StreamChat.getInstance(
    process.env.NEXT_PUBLIC_STREAM_API_KEY!,
    process.env.STREAM_API_SECRET!
  );

  // 4. Get other user's profile to sync with Stream
  const { data: otherUserData, error: otherUserError } = await supabase
    .from("users")
    .select("full_name, avatar_url")
    .eq("id", otherUserId)
    .single();

  if (otherUserError) {
    throw new Error("Failed to fetch other user data");
  }

  // Ensure the other user exists in Stream's database
  await serverClient.upsertUser({
    id: otherUserId,
    name: otherUserData.full_name,
    image: otherUserData.avatar_url || undefined,
  });

  // 5. Initialize the channel
  // We use 'as any' to allow the custom 'match_id' property in the channel metadata
  const channel = serverClient.channel("messaging", channelId, {
    members: [user.id, otherUserId],
    created_by_id: user.id,
    match_id: matchId, 
  } as any);

  try {
    await channel.create();
    console.log("Stream Channel initialized:", channelId);
  } catch (error) {
    // If the channel already exists, that's fine—just log and move on
    if (error instanceof Error && !error.message.includes("already exists")) {
      console.error("Stream Channel Creation Error:", error);
      throw error;
    }
  }

  return {
    channelType: "messaging",
    channelId,
  };
}

/**
 * Generates a unique Call ID for video functionality based on the Match ID.
 */
export async function createVideoCall(matchId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  // Generate a standardized call ID
  const callId = `call_${matchId.replace(/-/g, "_")}`;

  return { callId, callType: "default" };
}

/**
 * Generates a Stream Video token for the current user.
 */
export async function getStreamVideoToken() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .single();

  if (userError) {
    throw new Error("Failed to fetch user data for video token");
  }

  const serverClient = StreamChat.getInstance(
    process.env.NEXT_PUBLIC_STREAM_API_KEY!,
    process.env.STREAM_API_SECRET!
  );

  // Tokens for Stream Video and Chat use the same secret and user ID
  const token = serverClient.createToken(user.id);

  return {
    token,
    userId: user.id,
    userName: userData.full_name,
    userImage: userData.avatar_url || undefined,
  };
}