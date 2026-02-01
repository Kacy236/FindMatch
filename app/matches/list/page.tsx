"use client";

import { UserProfile } from "@/app/profile/page";
import { getUserMatches } from "@/lib/actions/matches";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function MatchesListPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // --- LOGIC FUNCTIONS ---

  function handleProfileClick(userId: string) {
    if (!userId) return;
    router.push(`/profile/${userId}`);
  }

  function handleChatClick(userId: string) {
    if (!userId) return;
    router.push(`/chat/${userId}`);
  }

  // --- EFFECTS ---

  useEffect(() => {
    async function loadMatches() {
      try {
        const userMatches = await getUserMatches();
        
        // Ensure we always have the REAL User ID extracted correctly
        const flattenedMatches = userMatches.map((m: any) => ({
          ...m,
          // Checks nested profile data first, then falls back to top level
          displayId: m.profiles?.id || m.user?.id || m.user_id || m.id
        }));

        setMatches(flattenedMatches);
      } catch (error) {
        setError("Failed to load matches.");
      } finally {
        setLoading(false);
      }
    }
    loadMatches();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col items-center justify-center">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-pink-100 dark:border-pink-900"></div>
          <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-pink-500 border-t-transparent animate-spin"></div>
        </div>
        <p className="mt-4 font-bold text-gray-400 uppercase tracking-widest text-xs">Loading Connections</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
        <div className="container mx-auto max-w-2xl px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
              Messages
            </h1>
            <p className="text-xs font-bold text-pink-500 uppercase tracking-wider">
              {matches.length} Mutual Match{matches.length !== 1 ? "es" : ""}
            </p>
          </div>
          <div className="h-10 w-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-2xl px-4 py-6">
        {matches.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 px-6"
          >
            <div className="w-24 h-24 bg-pink-50 dark:bg-pink-900/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <span className="text-4xl">💬</span>
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">No conversations yet</h2>
            <Link
              href="/matches"
              className="inline-block bg-gradient-to-r from-pink-500 to-red-500 text-white font-bold py-4 px-10 rounded-2xl shadow-lg shadow-pink-500/25 active:scale-95 transition-transform"
            >
              Discover People
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-1">
            {matches.map((match, index) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                key={match.id || index}
              >
                <div 
                  className="flex items-center gap-4 p-4 rounded-[2rem] bg-transparent hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-all cursor-pointer group"
                  onClick={() => handleChatClick(match.displayId)}
                >
                  {/* Avatar Container */}
                  <div 
                    className="relative flex-shrink-0 z-20"
                    onClick={(e) => {
                      e.stopPropagation(); 
                      handleProfileClick(match.displayId);
                    }}
                  >
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white dark:border-gray-800 shadow-sm group-hover:border-pink-500 transition-all hover:scale-105 active:scale-95">
                      <Image
                        src={match.avatar_url || match.profiles?.avatar_url || "/default-avatar.png"}
                        alt={match.full_name || "User"}
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-gray-950 rounded-full shadow-sm"></div>
                  </div>

                  {/* Info Section */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[17px] font-bold text-gray-900 dark:text-white truncate">
                        {match.full_name || match.profiles?.full_name}
                      </h3>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                        Match
                      </span>
                    </div>
                    <p className="text-sm text-pink-500 font-medium">
                      Tap to message
                    </p>
                  </div>

                  {/* Icon */}
                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0 transition-all">
                    <svg className="w-5 h-5 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                <div className="h-[1px] bg-gray-50 dark:bg-gray-900/50 mx-16" />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}