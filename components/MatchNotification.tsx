"use client";

import { UserProfile } from "@/app/profile/page";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface MatchNotificationProps {
  match: UserProfile;
  onClose: () => void;
  onStartChat: () => void;
}

export default function MatchNotification({
  match,
  onClose,
  onStartChat,
}: MatchNotificationProps) {
  const [isVisible, setIsVisible] = useState<boolean>(true);

  // Auto-close after 8 seconds (extended since it's a big event)
  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  function handleClose() {
    setIsVisible(false);
    setTimeout(onClose, 400); // Wait for exit animation
  }

  function handleStartChat() {
    onStartChat();
    handleClose();
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 pointer-events-none">
          {/* Backdrop Blur for Mobile - only shows when matched */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm md:hidden"
          />

          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            className="pointer-events-auto w-full max-w-sm bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/20 dark:border-gray-800 overflow-hidden"
          >
            {/* Top Decorative Gradient */}
            <div className="h-2 w-full bg-gradient-to-r from-pink-500 via-red-500 to-rose-500" />
            
            <div className="p-8">
              <div className="text-center">
                {/* Profile Image with Animated Rings */}
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 bg-pink-500/20 rounded-full"
                  />
                  <div className="relative w-full h-full rounded-full border-4 border-white dark:border-gray-800 overflow-hidden shadow-xl">
                    <img
                      src={match.avatar_url || "/default-avatar.png"}
                      alt={match.full_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-900 p-1.5 rounded-full shadow-lg">
                    <div className="bg-pink-500 rounded-full p-1">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
                  It's a Match! 🎉
                </h3>
                
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 leading-relaxed">
                  You and <span className="font-bold text-gray-900 dark:text-white">{match.full_name}</span> liked each other. Why not say hi?
                </p>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleStartChat}
                    className="w-full bg-gradient-to-r from-pink-500 to-red-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-pink-500/30 hover:scale-[1.02] active:scale-95 transition-all duration-200"
                  >
                    Send a Message
                  </button>
                  <button
                    onClick={handleClose}
                    className="w-full py-3 text-gray-500 dark:text-gray-400 font-bold text-sm hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    Not now
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}