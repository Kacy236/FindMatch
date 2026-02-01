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
  
  const chatId = (params.id || params.userId) as string;
  const chatInterfaceRef = useRef<{ handleVideoCall: () => void } | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadUserData() {
      if (!chatId || !user) return;

      try {
        setLoading(true);
        const userMatches = await getUserMatches();
        const matchedUser = userMatches.find((match) => match.id === chatId);

        if (isMounted) {
          if (matchedUser) {
            setOtherUser(matchedUser);
          } else {
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
  }, [chatId, router, user]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-950 flex flex-col items-center justify-center z-50">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-20 h-20 bg-pink-500/10 rounded-full flex items-center justify-center mb-4"
        >
          <div className="h-10 w-10 rounded-full border-t-2 border-pink-500 animate-spin" />
        </motion.div>
        <p className="text-xs font-black uppercase tracking-widest text-gray-400">Securing Connection</p>
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
            This conversation is no longer available or the link has expired.
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
      {/* Container limited to a readable width on Desktop, full width on Mobile */}
      <div className="mx-auto w-full max-w-2xl h-full flex flex-col shadow-2xl shadow-black/5">
        
        {/* Animated Header Component */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="z-50 border-b border-gray-100 dark:border-gray-900 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl"
        >
          <ChatHeader
            user={otherUser}
            onVideoCall={() => {
              chatInterfaceRef.current?.handleVideoCall();
            }}
          />
        </motion.div>

        {/* Chat Interface Area */}
        <main className="flex-1 relative min-h-0 bg-[#FDFCFD] dark:bg-gray-950">
          <AnimatePresence mode="wait">
            <motion.div 
              key={otherUser.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <StreamChatInterface 
                otherUser={otherUser} 
                ref={chatInterfaceRef} 
              />
            </motion.div>
          </AnimatePresence>
        </main>
        
        {/* Safe Area Spacer for iOS Home Bar */}
        <div className="h-[env(safe-area-inset-bottom)] bg-white dark:bg-gray-950" />
      </div>
    </div>
  );
}