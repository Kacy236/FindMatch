"use client";

import { UserProfile } from "@/app/profile/page";
import { calculateAge } from "@/lib/helpers/calculate-age";
import Image from "next/image";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { useState } from "react";

interface MatchCardProps {
  user: UserProfile;
  onSwipe: (direction: "left" | "right") => void;
  onClick?: () => void; // Added onClick prop
}

export default function MatchCard({ user, onSwipe, onClick }: MatchCardProps) {
  const [exitX, setExitX] = useState<number>(0);
  
  // Motion values for tracking drag position
  const x = useMotionValue(0);
  
  // Map horizontal drag to rotation and opacity
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  
  // Map drag to colors for visual feedback (Red for left, Green for right)
  const overlayColor = useTransform(
    x,
    [-100, 0, 100],
    ["rgba(239, 68, 68, 0.5)", "rgba(0, 0, 0, 0)", "rgba(34, 197, 94, 0.5)"]
  );

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 120; // Distance required to trigger a swipe
    
    // Logic to distinguish between a tap and a drag
    // If the movement is very small, we consider it a click
    if (Math.abs(info.offset.x) < 5 && Math.abs(info.offset.y) < 5) {
      onClick?.();
      return;
    }

    if (info.offset.x > threshold) {
      setExitX(500);
      onSwipe("right");
    } else if (info.offset.x < -threshold) {
      setExitX(-500);
      onSwipe("left");
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto aspect-[3/4] perspective-1000 touch-pan-y">
      <motion.div
        style={{ x, rotate, opacity }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        animate={{ x: exitX }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="relative w-full h-full cursor-grab active:cursor-grabbing"
        // Secondary safety: Framer Motion's onTap specifically handles clicks vs drags
        onTap={() => {
          // Only trigger if we aren't currently exiting
          if (exitX === 0) onClick?.();
        }}
      >
        {/* Main Card Container */}
        <div className="relative w-full h-full overflow-hidden rounded-[2.5rem] shadow-2xl bg-gray-900 border border-white/10">
          
          {/* Profile Image */}
          <Image
            src={user.avatar_url || "/default-avatar.png"}
            alt={user.full_name}
            fill
            className="object-cover pointer-events-none"
            priority
          />

          {/* Dynamic Color Overlay (Feedback for dragging) */}
          <motion.div 
            style={{ backgroundColor: overlayColor }}
            className="absolute inset-0 z-10 pointer-events-none transition-colors duration-200" 
          />

          {/* Status Badges & Tap Info */}
          <div className="absolute top-5 left-5 right-5 z-20 flex justify-between items-center">
            {user.is_online ? (
              <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-xl text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/20">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Live
              </span>
            ) : <div />}

            {/* Info Icon to hint at clickability */}
            <div className="p-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          {/* Bottom Info Gradient */}
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/40 to-transparent z-20" />

          {/* Content Area */}
          <div className="absolute bottom-0 left-0 right-0 p-8 z-30">
            <div className="space-y-3">
              <div className="flex items-baseline gap-2">
                <h2 className="text-3xl font-black text-white tracking-tight">
                  {user.full_name}, {calculateAge(user.birthdate)}
                </h2>
                {user.is_verified && (
                  <svg className="w-6 h-6 text-pink-500 fill-current" viewBox="0 0 20 20">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293l-4 4a1 1 0 01-1.414 0l-2-2a1 1 0 111.414-1.414L9 10.586l3.293-3.293a1 1 0 111.414 1.414z" />
                  </svg>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-md border border-white/10 rounded-full text-[11px] font-bold text-white uppercase tracking-wider">
                  {user.gender}
                </span>
                {user.body_type && (
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-md border border-white/10 rounded-full text-[11px] font-bold text-white uppercase tracking-wider">
                    {user.body_type}
                  </span>
                )}
              </div>

              <p className="text-base text-gray-200 line-clamp-2 font-medium opacity-90 leading-snug">
                {user.bio || "Looking for someone special..."}
              </p>
              
              {/* Click Visual Hint */}
              <div className="pt-2 text-[10px] text-pink-400 font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                Tap to see full profile
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}