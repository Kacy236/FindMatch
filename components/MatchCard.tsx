"use client";

import { UserProfile } from "@/app/profile/page";
import { calculateAge } from "@/lib/helpers/calculate-age";
import Image from "next/image";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { useState } from "react";

interface MatchCardProps {
  user: UserProfile;
  onSwipe: (direction: "left" | "right") => void;
  onClick?: () => void;
}

export default function MatchCard({ user, onSwipe, onClick }: MatchCardProps) {
  const [exitX, setExitX] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  
  // Motion values for tracking drag position
  const x = useMotionValue(0);
  
  // Map horizontal drag to rotation and opacity
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  
  // Map drag to colors for visual feedback
  const overlayColor = useTransform(
    x,
    [-100, 0, 100],
    ["rgba(239, 68, 68, 0.5)", "rgba(0, 0, 0, 0)", "rgba(34, 197, 94, 0.5)"]
  );

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 120;
    
    // If the movement was significant, it was a swipe
    if (info.offset.x > threshold) {
      setExitX(600);
      onSwipe("right");
    } else if (info.offset.x < -threshold) {
      setExitX(-600);
      onSwipe("left");
    }

    // Reset dragging state after a tiny delay to prevent ghost clicks
    setTimeout(() => setIsDragging(false), 100);
  };

  return (
    <div className="relative w-full max-w-md mx-auto h-full max-h-[50vh] sm:max-h-[60vh] perspective-1000 touch-none">
      <motion.div
        style={{ x, rotate, opacity }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        animate={{ x: exitX }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="relative w-full h-full cursor-grab active:cursor-grabbing"
        // This is the key fix: onTap will only fire if a drag didn't occur
        onTap={() => {
          if (!isDragging && exitX === 0) {
            onClick?.();
          }
        }}
      >
        {/* Main Card Container */}
        <div className="relative w-full h-full overflow-hidden rounded-[2.5rem] shadow-2xl bg-gray-900 border border-white/10 select-none">
          
          {/* Profile Image */}
          <Image
            src={user.avatar_url || "/default-avatar.png"}
            alt={user.full_name}
            fill
            className="object-cover pointer-events-none select-none"
            priority
          />

          {/* Dynamic Color Overlay */}
          <motion.div 
            style={{ backgroundColor: overlayColor }}
            className="absolute inset-0 z-10 pointer-events-none transition-colors duration-200" 
          />

          {/* Status Badges */}
          <div className="absolute top-5 left-5 right-5 z-20 flex justify-between items-center pointer-events-none">
            {user.is_online ? (
              <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-xl text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/20">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Live
              </span>
            ) : <div />}

            <div className="p-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          {/* Bottom Info Gradient */}
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/40 to-transparent z-20 pointer-events-none" />

          {/* Content Area */}
          <div className="absolute bottom-0 left-0 right-0 p-6 z-30 pointer-events-none">
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <h2 className="text-2xl font-black text-white tracking-tight">
                  {user.full_name}, {calculateAge(user.birthdate)}
                </h2>
                {user.is_verified && (
                  <svg className="w-5 h-5 text-pink-500 fill-current" viewBox="0 0 20 20">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293l-4 4a1 1 0 01-1.414 0l-2-2a1 1 0 111.414-1.414L9 10.586l3.293-3.293a1 1 0 111.414 1.414z" />
                  </svg>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md border border-white/10 rounded-full text-[9px] font-bold text-white uppercase tracking-wider">
                  {user.gender}
                </span>
                {user.body_type && (
                  <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md border border-white/10 rounded-full text-[9px] font-bold text-white uppercase tracking-wider">
                    {user.body_type}
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-200 line-clamp-2 font-medium opacity-90 leading-tight">
                {user.bio || "Looking for someone special..."}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}