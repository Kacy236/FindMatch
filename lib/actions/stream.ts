"use server";

import { StreamChat } from "stream-chat";
import { createClient } from "../supabase/server";

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

    // Validation: Ensure environment variables exist
    if (!process.env.NEXT_PUBLIC_STREAM_API_KEY || !process.env.STREAM_API_SECRET) {
      console.error("Stream API keys are missing in environment variables");
      return { success: false, error: "Server configuration error" };
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
      success: true,
      token,
      userId: user.id,
      userName: userData.full_name,
      userImage: userData.avatar_url || undefined,
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
    // Stream IDs must be alphanumeric and underscores only (no hyphens)
    const channelId = `match_${matchId.replace(/-/g, "_")}`;

    if (!process.env.NEXT_PUBLIC_STREAM_API_KEY || !process.env.STREAM_API_SECRET) {
      return { success: false, error: "Stream credentials missing" };
    }

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
      // Re-calculate channelId if it failed inside the catch for some reason
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
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Generate a standardized call ID
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

    if (!process.env.NEXT_PUBLIC_STREAM_API_KEY || !process.env.STREAM_API_SECRET) {
      return { success: false, error: "Stream credentials missing" };
    }

    const serverClient = StreamChat.getInstance(
      process.env.NEXT_PUBLIC_STREAM_API_KEY!,
      process.env.STREAM_API_SECRET!
    );

    const token = serverClient.createToken(user.id);

    return {
      success: true,
      token,
      userId: user.id,
      userName: userData.full_name,
      userImage: userData.avatar_url || undefined,
    };
  } catch (error) {
    return { success: false, error: "Internal server error" };
  }
}