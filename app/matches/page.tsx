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

  // Load Main Discovery Profiles
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

  // Load Secondary Lists (Who Liked Me / I Liked) when switching tabs
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

  // Used for "Like Back" from the "Who Liked Me" list
  async function handleLikeBack(userId: string) {
    try {
      const result = await likeUser(userId);
      if (result.isMatch) {
        setMatchedUser(result.matchedUser!);
        setShowMatchNotification(true);
      }
      // Refresh the specific list
      const data = await getUsersWhoLikedMe();
      setSecondaryProfiles(data);
    } catch (err) {
      console.error(err);
    }
  }

  function handlePass() {
    if (currentIndex < potentialMatches.length) {
      setCurrentIndex((prev) => prev + 1);
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

  // --- RENDERING HELPERS ---

  const renderDiscover = () => {
    if (currentIndex >= potentialMatches.length) {
      return (
        <div className="text-center max-w-md mx-auto p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-xl">
          <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✨</span>
          </div>
          <h2 className="text-xl font-bold mb-2">All caught up!</h2>
          <p className="text-gray-500 mb-6">No more new profiles nearby. Try checking who liked you!</p>
          <button
            onClick={() => setViewMode("whoLikedMe")}
            className="bg-pink-500 text-white px-6 py-2 rounded-full font-semibold"
          >
            See Who Liked You
          </button>
        </div>
      );
    }

    const currentMatch = potentialMatches[currentIndex];
    return (
      <div className="max-w-md mx-auto">
        <MatchCard user={currentMatch} />
        <div className="mt-8">
          <MatchButtons onLike={handleLike} onPass={handlePass} />
        </div>
      </div>
    );
  };

  const renderSecondaryList = () => {
    if (secondaryProfiles.length === 0) {
      return (
        <div className="text-center py-20 text-gray-500">
          <p className="text-lg">No profiles to show here yet.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {secondaryProfiles.map((profile) => (
          <div key={profile.id} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-md flex flex-col">
            <div className="relative aspect-[3/4] w-full">
              <Image 
                src={profile.avatar_url || "/default-avatar.png"} 
                alt={profile.full_name} 
                fill 
                className="object-cover"
              />
            </div>
            <div className="p-3">
              <p className="font-bold text-sm truncate">{profile.full_name}</p>
              {viewMode === "whoLikedMe" && (
                <button 
                  onClick={() => handleLikeBack(profile.id)}
                  className="w-full mt-2 bg-pink-500 text-white text-xs py-2 rounded-lg font-bold hover:bg-pink-600"
                >
                  Like Back
                </button>
              )}
              {viewMode === "iLiked" && (
                <p className="text-xs text-gray-400 mt-2 italic">Pending...</p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 dark:from-gray-900 dark:to-gray-800 pb-20">
      <div className="container mx-auto px-4 py-8">
        
        {/* HEADER & TABS */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-red-500">
              {viewMode === "discover" ? "Discover" : viewMode === "whoLikedMe" ? "Interested" : "Sent"}
            </h1>
            <div className="w-10" />
          </div>

          <div className="flex bg-gray-200/50 dark:bg-gray-800/50 p-1 rounded-xl max-w-sm mx-auto">
            <button 
              onClick={() => setViewMode("discover")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${viewMode === "discover" ? "bg-white dark:bg-gray-700 shadow-sm text-pink-500" : "text-gray-500"}`}
            >
              Discover
            </button>
            <button 
              onClick={() => setViewMode("whoLikedMe")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${viewMode === "whoLikedMe" ? "bg-white dark:bg-gray-700 shadow-sm text-pink-500" : "text-gray-500"}`}
            >
              Likes You
            </button>
            <button 
              onClick={() => setViewMode("iLiked")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${viewMode === "iLiked" ? "bg-white dark:bg-gray-700 shadow-sm text-pink-500" : "text-gray-500"}`}
            >
              Sent
            </button>
          </div>
        </header>

        {/* CONTENT AREA */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500"></div>
            <p className="mt-4 text-sm text-gray-500">Loading profiles...</p>
          </div>
        ) : (
          viewMode === "discover" ? renderDiscover() : renderSecondaryList()
        )}

        {/* MATCH POPUP */}
        {showMatchNotification && matchedUser && (
          <MatchNotification
            match={matchedUser}
            onClose={handleCloseMatchNotification}
            onStartChat={handleStartChat}
          />
        )}
      </div>
    </div>
  );
}