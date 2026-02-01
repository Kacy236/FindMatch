"use client";

import { 
  getPotentialMatches, 
  likeUser, 
  getUsersWhoLikedMe, 
  getUsersILiked 
} from "@/lib/actions/matches";
import { useEffect, useState } from "react";
import { UserProfile } from "../profile/page";
import { useRouter } from "next/navigation";
import MatchCard from "@/components/MatchCard";
import MatchButtons from "@/components/MatchButtons";
import MatchNotification from "@/components/MatchNotification";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

type ViewMode = "discover" | "whoLikedMe" | "iLiked";

export default function MatchesPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("discover");
  const [potentialMatches, setPotentialMatches] = useState<UserProfile[]>([]);
  const [secondaryProfiles, setSecondaryProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [showMatchNotification, setShowMatchNotification] = useState(false);
  const [matchedUser, setMatchedUser] = useState<UserProfile | null>(null);

  const router = useRouter();

  // --- LOGIC FUNCTIONS ---

  // Navigates to the individual user's profile page
  function handleProfileClick(userId: string) {
    router.push(`/profile/${userId}`);
  }

  async function handleLike() {
    if (currentIndex < potentialMatches.length) {
      const likedUser = potentialMatches[currentIndex];
      try {
        const result = await likeUser(likedUser.id);
        if (result.isMatch) {
          setMatchedUser(result.matchedUser!);
          setShowMatchNotification(true);
        }
        setCurrentIndex((prev) => prev + 1);
      } catch (err) {
        console.error(err);
      }
    }
  }

  function handlePass() {
    if (currentIndex < potentialMatches.length) {
      setCurrentIndex((prev) => prev + 1);
    }
  }

  function handleSwipe(direction: "left" | "right") {
    if (direction === "right") {
      handleLike();
    } else {
      handlePass();
    }
  }

  function handleCloseMatchNotification() {
    setShowMatchNotification(false);
    setMatchedUser(null);
  }

  function handleStartChat() {
    if (matchedUser) {
      router.push(`/messages/${matchedUser.id}`);
    }
  }

  async function handleLikeBack(userId: string) {
    try {
      const result = await likeUser(userId);
      if (result.isMatch) {
        setMatchedUser(result.matchedUser!);
        setShowMatchNotification(true);
      }
      const data = await getUsersWhoLikedMe();
      setSecondaryProfiles(data);
    } catch (err) {
      console.error(err);
    }
  }

  // --- EFFECTS ---

  useEffect(() => {
    async function loadUsers() {
      setLoading(true);
      try {
        const potentialMatchesData = await getPotentialMatches();
        setPotentialMatches(potentialMatchesData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  useEffect(() => {
    if (viewMode === "discover") return;

    async function loadSecondary() {
      setLoading(true);
      try {
        const data = viewMode === "whoLikedMe" 
          ? await getUsersWhoLikedMe() 
          : await getUsersILiked();
        setSecondaryProfiles(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadSecondary();
  }, [viewMode]);

  // --- RENDERING HELPERS ---

  const renderDiscover = () => {
    if (currentIndex >= potentialMatches.length) {
      return (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm mx-auto p-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-[2.5rem] shadow-xl border border-white/20"
        >
          <div className="w-24 h-24 bg-gradient-to-tr from-pink-100 to-red-100 dark:from-pink-900/30 dark:to-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">✨</span>
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3">All caught up!</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">No more new profiles nearby.</p>
          <button
            onClick={() => setViewMode("whoLikedMe")}
            className="w-full bg-gradient-to-r from-pink-500 to-red-500 text-white py-4 rounded-2xl font-bold"
          >
            See Who Liked You
          </button>
        </motion.div>
      );
    }

    const currentMatch = potentialMatches[currentIndex];
    return (
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="w-full max-w-md relative h-[60vh] sm:h-[70vh]">
          <AnimatePresence mode="popLayout">
            <MatchCard 
              key={currentMatch.id} 
              user={currentMatch} 
              onSwipe={handleSwipe}
              onClick={() => handleProfileClick(currentMatch.id)} 
            />
          </AnimatePresence>
        </div>
        <div className="w-full max-w-sm px-4">
          <MatchButtons onLike={handleLike} onPass={handlePass} />
        </div>
      </div>
    );
  };

  const renderSecondaryList = () => {
    if (secondaryProfiles.length === 0) {
      return (
        <div className="text-center py-32 text-gray-400 font-medium italic">
          Nothing to see here yet...
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-2 pb-10">
        {secondaryProfiles.map((profile) => (
          <motion.div 
            layout
            key={profile.id} 
            className="group relative bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 hover:ring-2 hover:ring-pink-500 transition-all cursor-pointer"
          >
            {/* Clickable Area for Profile */}
            <div 
              onClick={() => handleProfileClick(profile.id)}
              className="relative aspect-[3/4] w-full overflow-hidden"
            >
              <Image 
                src={profile.avatar_url || "/default-avatar.png"} 
                alt={profile.full_name} 
                fill 
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
              <div className="absolute bottom-3 left-3 right-3">
                <p className="font-bold text-white text-sm truncate">{profile.full_name}</p>
              </div>
            </div>
            
            <div className="p-3">
              {viewMode === "whoLikedMe" ? (
                <button 
                  onClick={(e) => {
                    e.stopPropagation(); // Prevents clicking the profile when clicking the button
                    handleLikeBack(profile.id);
                  }}
                  className="w-full bg-pink-500 text-white text-xs py-2.5 rounded-xl font-bold hover:bg-pink-600 transition-colors"
                >
                  Like Back
                </button>
              ) : (
                <div className="flex items-center justify-center py-2 text-xs font-semibold text-gray-400 uppercase tracking-widest">
                  Pending
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FDFCFD] dark:bg-gray-950 transition-colors">
      <div className="container mx-auto max-w-5xl px-4 py-6 md:py-10">
        
        {/* HEADER */}
        <header className="mb-8 sticky top-0 z-40 bg-[#FDFCFD]/80 dark:bg-gray-950/80 backdrop-blur-md pt-2">
          <div className="flex items-center justify-between mb-8">
            <button onClick={() => router.back()} className="p-3 bg-gray-100 dark:bg-gray-800 rounded-2xl">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-black tracking-tighter text-gray-900 dark:text-white">
              {viewMode === "discover" ? "Discover" : viewMode === "whoLikedMe" ? "Interested" : "Sent"}
            </h1>
            <div className="w-11" />
          </div>

          <div className="flex bg-gray-100 dark:bg-gray-900 p-1.5 rounded-[1.25rem] max-w-sm mx-auto shadow-inner">
            {[
              { id: "discover", label: "Discover" },
              { id: "whoLikedMe", label: "Likes You" },
              { id: "iLiked", label: "Sent" }
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setViewMode(tab.id as ViewMode)}
                className={`flex-1 py-2.5 text-xs font-bold rounded-2xl transition-all duration-300 ${
                  viewMode === tab.id 
                    ? "bg-white dark:bg-gray-800 shadow-md text-pink-600 dark:text-pink-400" 
                    : "text-gray-400"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="h-16 w-16 rounded-full border-4 border-pink-500 border-t-transparent animate-spin"></div>
              <p className="mt-6 text-sm font-bold text-gray-400 uppercase tracking-widest">Searching...</p>
            </div>
          ) : (
            <div className="min-h-[60vh]">
              {viewMode === "discover" ? renderDiscover() : renderSecondaryList()}
            </div>
          )}
        </main>

        {/* MATCH POPUP */}
        <AnimatePresence>
          {showMatchNotification && matchedUser && (
            <MatchNotification
              match={matchedUser}
              onClose={handleCloseMatchNotification}
              onStartChat={handleStartChat}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}