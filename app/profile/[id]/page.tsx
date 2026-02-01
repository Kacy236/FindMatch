"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { calculateAge } from "@/lib/helpers/calculate-age";
import { getUserProfileById } from "@/lib/actions/profile";
import { UserProfile } from "../page";

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (!params.id) return;
      setLoading(true);
      const data = await getUserProfileById(params.id as string);
      setUser(data);
      setLoading(false);
    }
    loadUser();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-gray-950">
        <div className="h-10 w-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User not found</h2>
        <button onClick={() => router.back()} className="mt-4 text-pink-500 font-bold">Go Back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFD] dark:bg-gray-950 pb-32">
      {/* Header / Back Button */}
      <div className="fixed top-0 left-0 right-0 z-50 p-4 pointer-events-none">
        <button 
          onClick={() => router.back()}
          className="p-3 bg-white/20 backdrop-blur-xl rounded-2xl text-white pointer-events-auto shadow-lg border border-white/20 active:scale-90 transition-transform"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Hero Image Section */}
      <div className="relative h-[65vh] w-full">
        <Image
          src={user.avatar_url || "/default-avatar.png"}
          alt={user.full_name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#FDFCFD] dark:from-gray-950 via-transparent to-black/20" />
      </div>

      {/* Profile Info Card */}
      <motion.div 
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 -mt-20 px-4"
      >
        <div className="bg-white dark:bg-gray-900 rounded-[3rem] p-8 shadow-2xl border border-gray-100 dark:border-gray-800 max-w-2xl mx-auto">
          
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-black text-gray-900 dark:text-white">
                {user.full_name}, {calculateAge(user.birthdate)}
              </h1>
              {user.is_verified && (
                <svg className="w-6 h-6 text-pink-500 fill-current" viewBox="0 0 20 20">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293l-4 4a1 1 0 01-1.414 0l-2-2a1 1 0 111.414-1.414L9 10.586l3.293-3.293a1 1 0 111.414 1.414z" />
                </svg>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge text={user.gender} color="pink" />
              {user.body_type && <Badge text={user.body_type} color="gray" />}
              {user.is_online && (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-[10px] font-black uppercase rounded-full border border-green-100 dark:border-green-800">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  Online
                </span>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <section>
              <SectionHeader title="About" />
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                {user.bio || `Just joined! Say hi to ${user.full_name.split(' ')[0]}.`}
              </p>
            </section>

            {/* Render Interests if they exist in your preferences object or as a separate field */}
            {user.preferences?.interests && (
              <section>
                <SectionHeader title="Interests" />
                <div className="flex flex-wrap gap-2 mt-3">
                  {user.preferences.interests.map((item: string) => (
                    <span key={item} className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-2xl text-xs font-bold text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-800">
                      {item}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </motion.div>

      {/* Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#FDFCFD] dark:from-gray-950 via-[#FDFCFD]/80 dark:via-gray-950/80 to-transparent">
        <div className="max-w-md mx-auto">
          <button className="w-full bg-gradient-to-r from-pink-500 to-red-500 text-white py-4 rounded-[2rem] font-black shadow-xl shadow-pink-500/25 active:scale-95 transition-all flex items-center justify-center gap-3">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
            </svg>
            Send Message
          </button>
        </div>
      </div>
    </div>
  );
}

// Sub-components for cleaner code
function Badge({ text, color }: { text: string; color: "pink" | "gray" }) {
  const styles = color === "pink" 
    ? "bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 border-pink-100 dark:border-pink-800"
    : "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-gray-700";
    
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${styles}`}>
      {text}
    </span>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-3">
      {title}
    </h3>
  );
}