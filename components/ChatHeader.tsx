"use client";

import { UserProfile } from "@/app/profile/page";
import { calculateAge } from "@/lib/helpers/calculate-age";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface ChatHeaderProps {
  user: UserProfile;
  onVideoCall?: () => void;
}

export default function ChatHeader({ user, onVideoCall }: ChatHeaderProps) {
  const router = useRouter();

  return (
    <div className="sticky top-0 z-50 w-full bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-4 py-3 md:px-6">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        
        {/* Left Section: Back Button & User Info */}
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 active:scale-90"
          >
            <svg
              className="w-6 h-6 text-gray-700 dark:text-gray-300"
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
            className="flex items-center gap-3 cursor-pointer active:opacity-70 transition-opacity"
            onClick={() => router.push(`/profile/${user.id}`)}
          >
            {/* Avatar with Status Ring */}
            <div className="relative w-10 h-10 md:w-11 md:h-11">
              <div className="relative w-full h-full rounded-full overflow-hidden border border-gray-100 dark:border-gray-800">
                <Image
                  src={user.avatar_url || "/default-avatar.png"}
                  alt={user.full_name}
                  fill
                  className="object-cover"
                />
              </div>
              {user.is_online && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-950 rounded-full shadow-sm" />
              )}
            </div>

            <div className="flex flex-col">
              <h2 className="text-sm md:text-base font-black text-gray-900 dark:text-white leading-tight">
                {user.full_name}, {calculateAge(user.birthdate)}
              </h2>
              <div className="flex items-center gap-1.5">
                {user.is_online ? (
                  <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest">
                    Online
                  </p>
                ) : (
                  <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
                    @{user.username}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Actions */}
        <div className="flex items-center gap-1">
          {onVideoCall && (
            <button
              onClick={onVideoCall}
              className="p-2.5 rounded-2xl bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-900/40 transition-all duration-200 active:scale-95"
              title="Start Video Call"
            >
              <svg
                className="w-5 h-5 md:w-6 md:h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>
          )}
          
          <button className="p-2.5 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <svg className="w-5 h-5 md:w-6 md:h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>

      </div>
    </div>
  );
}