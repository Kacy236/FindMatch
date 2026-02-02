"use client";

import { UserProfile } from "@/app/profile/page";
import { calculateAge } from "@/lib/helpers/calculate-age";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";

interface ChatHeaderProps {
  user: UserProfile;
  onVideoCall?: () => void;
}

export default function ChatHeader({ user, onVideoCall }: ChatHeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-[70] w-full bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl border-b border-gray-100 dark:border-gray-900/50">
      {/* Safe area for mobile notches */}
      <div className="h-[env(safe-area-inset-top)] w-full" />
      
      <div className="flex items-center justify-between px-3 py-2 md:px-6 md:py-3 max-w-7xl mx-auto">
        
        {/* Left Section: Navigation & Identity */}
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-90 flex-shrink-0"
            aria-label="Go back"
          >
            <svg
              className="w-6 h-6 text-gray-900 dark:text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <div 
            className="flex items-center gap-3 p-1 pr-3 rounded-full hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer group min-w-0"
            onClick={() => router.push(`/profile/${user.id}`)}
          >
            {/* Avatar with Squircle Mask and Status */}
            <div className="relative w-10 h-10 md:w-12 md:h-12 flex-shrink-0">
              <div className="relative w-full h-full rounded-[14px] md:rounded-[18px] overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700">
                <Image
                  src={user.avatar_url || "/default-avatar.png"}
                  alt={user.full_name || "User"}
                  fill
                  sizes="(max-width: 768px) 40px, 48px"
                  className="object-cover transition-transform group-hover:scale-110 duration-500"
                  priority
                />
              </div>
              {user.is_online && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-[3px] border-white dark:border-gray-950 rounded-full shadow-sm" />
              )}
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-[15px] md:text-lg font-black text-gray-900 dark:text-white leading-tight truncate">
                  {user.full_name?.split(' ')[0] || "User"}
                  {user.birthdate && (
                    <span className="ml-1 opacity-60 font-medium">
                      {calculateAge(user.birthdate)}
                    </span>
                  )}
                </h2>
                <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.64.304 1.24.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                </svg>
              </div>
              <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">
                {user.is_online ? (
                  <span className="text-green-500">Active now</span>
                ) : (
                  `@${user.username || 'member'}`
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Right Section: Action Buttons */}
        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
          {onVideoCall && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onVideoCall}
              className="p-2.5 md:p-3 rounded-2xl bg-pink-500 text-white hover:bg-pink-600 shadow-md shadow-pink-500/20 transition-all flex items-center justify-center"
              title="Start Video Call"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </motion.button>
          )}
          
          <button className="p-2.5 md:p-3 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>

      </div>
    </header>
  );
}