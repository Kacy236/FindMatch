"use server";

import { StreamChat } from "stream-chat";
import { createClient } from "../supabase/server";

// Hardcoded for troubleshooting Vercel environment issues
const STREAM_KEY = "f46f8yjt5crk";
const STREAM_SECRET = "5wn5jheqhvu25z293kgynbgugu9rj9btubhma98vav9thszxbz5tyr7eukhd4j8q";

/**
 * Generates a Stream Chat token for the current authenticated user.
 * Also synchronizes the user's profile data (name, image) with Stream.
 */
export async function getStreamUserToken() {
  try {
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
      return { success: false, error: "Failed to fetch user data" };
    }

    // Using Hardcoded Strings directly to ensure Vercel sees them
    const serverClient = StreamChat.getInstance(
      STREAM_KEY,
      STREAM_SECRET
    );

    const token = serverClient.createToken(user.id);

    // Sync user info to Stream
    await serverClient.upsertUser({
      id: user.id,
      name: userData.full_name,
      image: userData.avatar_url || undefined,
    });

    return {
      success: true,
      token,
      userId: user.id,
      userName: userData.full_name,
      userImage: userData.avatar_url || undefined,
      apiKey: STREAM_KEY, // Sending back to client for initialization
    };
  } catch (error) {
    console.error("getStreamUserToken unexpected error:", error);
    return { success: false, error: "Internal server error" };
  }
}

/**
 * Creates or retrieves a messaging channel between two matched users.
 * Uses the Match ID to verify the relationship and generate a unique channel ID.
 */
export async function createOrGetChannel(matchId: string) {
  try {
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
      return { success: false, error: "Match not found or inactive" };
    }

    // 2. Determine the other participant in the match
    const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;

    // 3. Create a unique Stream Channel ID using the matchId
    const channelId = `match_${matchId.replace(/-/g, "_")}`;

    const serverClient = StreamChat.getInstance(
      STREAM_KEY,
      STREAM_SECRET
    );

    // 4. Get other user's profile to sync with Stream
    const { data: otherUserData, error: otherUserError } = await supabase
      .from("users")
      .select("full_name, avatar_url")
      .eq("id", otherUserId)
      .single();

    if (otherUserError) {
      console.error("Other user fetch error:", otherUserError);
      return { success: false, error: "Failed to fetch other user data" };
    }

    // Ensure the other user exists in Stream's database
    await serverClient.upsertUser({
      id: otherUserId,
      name: otherUserData.full_name,
      image: otherUserData.avatar_url || undefined,
    });

    // 5. Initialize the channel
    const channel = serverClient.channel("messaging", channelId, {
      members: [user.id, otherUserId],
      created_by_id: user.id,
      match_id: matchId, 
    } as any);

    await channel.create();
    
    return {
      success: true,
      channelType: "messaging",
      channelId,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes("already exists")) {
      const channelId = `match_${matchId.replace(/-/g, "_")}`;
      return { success: true, channelType: "messaging", channelId };
    }
    console.error("createOrGetChannel unexpected error:", error);
    return { success: false, error: "Failed to initialize channel" };
  }
}

/**
 * Generates a unique Call ID for video functionality based on the Match ID.
 */
export async function createVideoCall(matchId: string) {
  try {
    const callId = `call_${matchId.replace(/-/g, "_")}`;
    return { success: true, callId, callType: "default" };
  } catch (error) {
    return { success: false, error: "Failed to generate call ID" };
  }
}

/**
 * Generates a Stream Video token for the current user.
 */
export async function getStreamVideoToken() {
  try {
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
      return { success: false, error: "Failed to fetch user data" };
    }

    const serverClient = StreamChat.getInstance(
      STREAM_KEY,
      STREAM_SECRET
    );

    const token = serverClient.createToken(user.id);

    return {
      success: true,
      token,
      userId: user.id,
      userName: userData.full_name,
      userImage: userData.avatar_url || undefined,
      apiKey: STREAM_KEY
    };
  } catch (error) {
    return { success: false, error: "Internal server error" };
  }
}