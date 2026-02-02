"use client";

import { UserProfile } from "@/app/profile/page";
import ChatHeader from "@/components/ChatHeader";
import StreamChatInterface from "@/components/StreamChatInterface";
import { useAuth } from "@/contexts/auth-context";
import { getUserMatches } from "@/lib/actions/matches";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ChatConversationPage() {
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  
  // The ID from the URL (could be named id or userId in your config)
  const routeUserId = (params.id || params.userId) as string;
  const chatInterfaceRef = useRef<{ handleVideoCall: () => void } | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadUserData() {
      if (!routeUserId || !user) return;

      try {
        setLoading(true);
        // Cast as any[] to handle nested 'profiles' from database joins
        const userMatches = (await getUserMatches()) as any[];
        
        // Find the match where the user's ID matches the route ID
        const matchedData = userMatches.find((m) => {
          const profileId = m.profiles?.id || m.user?.id || m.user_id || m.id;
          return profileId === routeUserId;
        });

        if (isMounted) {
          if (matchedData) {
            /**
             * FIX: Flattening the nested 'profiles' object.
             * This resolves the error: "Property 'profiles' does not exist on type 'UserProfile'"
             * by spreading the nested data into a flat structure.
             */
            const profileData: UserProfile = {
              ...matchedData, // Base match data
              ...(matchedData.profiles || {}), // Extract nested profile fields
              id: routeUserId, // Ensure the ID is the specific User ID
              full_name: matchedData.profiles?.full_name || matchedData.full_name || "User",
              avatar_url: matchedData.profiles?.avatar_url || matchedData.avatar_url || "/default-avatar.png"
            };
            
            setOtherUser(profileData);
          } else {
            console.warn("No match found for ID:", routeUserId);
            router.push("/chat");
          }
        }
      } catch (error) {
        console.error("Error loading chat user:", error);
        if (isMounted) router.push("/chat");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadUserData();
    return () => { isMounted = false; };
  }, [routeUserId, router, user]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-950 flex flex-col items-center justify-center z-[100]">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-20 h-20 bg-pink-500/10 rounded-full flex items-center justify-center mb-4"
        >
          <div className="h-10 w-10 rounded-full border-t-2 border-pink-500 animate-spin" />
        </motion.div>
      </div>
    );
  }

  if (!otherUser) {
    return (
      <div className="h-screen bg-white dark:bg-gray-950 flex items-center justify-center p-6">
        <div className="text-center max-w-xs">
          <div className="text-6xl mb-6">🔒</div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Private Room</h2>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            This conversation is no longer available or you do not have permission to view it.
          </p>
          <button
            onClick={() => router.push("/chat")}
            className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold py-4 rounded-2xl active:scale-95 transition-transform"
          >
            Return to Inbox
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-950 flex flex-col overflow-hidden">
      {/* Desktop Max-Width Container */}
      <div className="mx-auto w-full max-w-2xl h-full flex flex-col relative">
        
        {/* Header Section: flex-shrink-0 prevents the chat from squishing the header */}
        <div className="relative z-[60] flex-shrink-0 bg-white dark:bg-gray-950">
          <motion.div 
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <ChatHeader
              user={otherUser}
              onVideoCall={() => {
                chatInterfaceRef.current?.handleVideoCall();
              }}
            />
          </motion.div>
        </div>

        {/* Main Chat Interface Area */}
        <main className="flex-1 relative min-h-0 z-10 bg-[#FDFCFD] dark:bg-gray-950">
          <AnimatePresence mode="wait">
            <motion.div 
              key={otherUser.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full w-full"
            >
              <StreamChatInterface 
                otherUser={otherUser} 
                ref={chatInterfaceRef} 
              />
            </motion.div>
          </AnimatePresence>
        </main>
        
        {/* iOS Home Bar Spacer */}
        <div className="flex-shrink-0 h-[env(safe-area-inset-bottom)] bg-white dark:bg-gray-950" />
      </div>
    </div>
  );
}