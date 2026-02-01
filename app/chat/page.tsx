"use client";

import { getUserMatches } from "@/lib/actions/matches";
import { useEffect, useState } from "react";
import { UserProfile } from "../profile/page";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

interface ChatData {
  id: string; 
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
        const userMatches = await getUserMatches();
        const chatData: ChatData[] = userMatches.map((match) => ({
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
      return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    }
    return diffInHours < 48 ? "Yesterday" : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-4 border-pink-100 dark:border-pink-900" />
          <div className="absolute inset-0 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 pb-20">
      {/* Mobile-Optimized Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-50 dark:border-gray-900">
        <div className="max-w-2xl mx-auto px-6 py-5 flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Messages</h1>
          <button className="p-2 bg-gray-50 dark:bg-gray-900 rounded-full">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 px-6 text-center">
            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-3xl flex items-center justify-center mb-6">
              <span className="text-4xl grayscale">💬</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Your inbox is empty</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 max-w-[240px]">
              Don't be shy! Swipe right on people you like to start a conversation.
            </p>
            <Link href="/matches" className="px-8 py-3 bg-pink-500 text-white font-bold rounded-2xl shadow-lg shadow-pink-500/20 active:scale-95 transition-transform">
              Start Matching
            </Link>
          </div>
        ) : (
          <div className="mt-4">
            {/* New Matches Scroller (Top Section) */}
            <section className="px-6 mb-8">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">New Matches</h3>
              <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                {chats.map((chat) => (
                  <Link key={`new-${chat.id}`} href={`/chat/${chat.id}`} className="flex-shrink-0 flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-full p-[2px] border-2 border-pink-500">
                      <div className="w-full h-full rounded-full overflow-hidden border-2 border-white dark:border-gray-950">
                        <img src={chat.user.avatar_url || "/default-avatar.png"} alt="" className="w-full h-full object-cover" />
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 w-16 truncate text-center">
                      {chat.user.full_name.split(' ')[0]}
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            {/* Conversation List */}
            <section>
              <h3 className="px-6 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Conversations</h3>
              <div className="divide-y divide-gray-50 dark:divide-gray-900">
                {chats.map((chat, idx) => (
                  <motion.div
                    key={chat.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Link href={`/chat/${chat.id}`} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors group">
                      <div className="relative flex-shrink-0">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-sm">
                          <img 
                            src={chat.user.avatar_url || "/default-avatar.png"} 
                            alt={chat.user.full_name} 
                            className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                          />
                        </div>
                        {chat.unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 border-2 border-white dark:border-gray-950 rounded-full flex items-center justify-center">
                            <span className="text-[10px] font-bold text-white">{chat.unreadCount}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-[15px] font-bold text-gray-900 dark:text-white truncate group-hover:text-pink-500 transition-colors">
                            {chat.user.full_name}
                          </h4>
                          <span className="text-[11px] font-medium text-gray-400">
                            {formatTime(chat.lastMessageTime)}
                          </span>
                        </div>
                        <p className={`text-[13px] truncate ${chat.unreadCount > 0 ? "text-gray-900 dark:text-white font-bold" : "text-gray-500 dark:text-gray-400 font-medium"}`}>
                          {chat.lastMessage}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}