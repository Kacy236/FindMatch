"use client";

import { getUserMatches } from "@/lib/actions/matches";
import { useEffect, useState } from "react";
import { UserProfile } from "../profile/page";
import Link from "next/link";

interface ChatData {
  id: string; // This MUST be the Match/Conversation ID from the database
  user: UserProfile;
  lastMessage?: string;
  lastMessageTime: string;
  unreadCount: number;
}

export default function ChatPage() {
  const [chats, setChats] = useState<ChatData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMatches() {
      try {
        // We call the action that now returns both matchId and profile
        const userMatches = await getUserMatches();
        
        const chatData: ChatData[] = userMatches.map((match) => ({
          // IMPORTANT: Use the Match Table ID for the URL route
          id: match.id, 
          user: match,
          lastMessage: "Start your conversation!",
          lastMessageTime: match.created_at,
          unreadCount: 0,
        }));
        
        setChats(chatData);
      } catch (error) {
        console.error("Failed to load chats:", error);
      } finally {
        setLoading(false);
      }
    }

    loadMatches();
  }, []);

  function formatTime(timestamp: string) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return diffInHours < 48 ? "Yesterday" : date.toLocaleDateString();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Messages</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {chats.length} conversation{chats.length !== 1 ? "s" : ""}
          </p>
        </header>

        {chats.length === 0 ? (
          <div className="text-center max-w-md mx-auto p-8">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">💬</div>
            <h2 className="text-2xl font-bold mb-4">No conversations yet</h2>
            <Link href="/matches" className="bg-gradient-to-r from-pink-500 to-red-500 text-white font-semibold py-3 px-6 rounded-full inline-block">
              Start Swiping
            </Link>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
            {chats.map((chat) => (
              <Link key={chat.id} href={`/chat/${chat.id}`} className="block hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center p-6 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                    <img src={chat.user.avatar_url || "/default-avatar.png"} alt={chat.user.full_name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 ml-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-lg font-semibold truncate">{chat.user.full_name}</h3>
                      <span className="text-sm text-gray-500">{formatTime(chat.lastMessageTime)}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{chat.lastMessage}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}