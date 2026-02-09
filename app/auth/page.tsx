"use client";

import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  
  // Track if the current session was just created via Sign Up
  const [isNewRegistration, setIsNewRegistration] = useState<boolean>(false);

  const supabase = createClient();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !authLoading) {
      if (isNewRegistration) {
        // Direct to profile edit after successful signup
        router.push("/profile/edit");
      } else {
        // Direct to home after regular login
        router.push("/");
      }
    }
  }, [user, authLoading, router, isNewRegistration]);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            // This ensures they come back to the right place if using email confirmation
            emailRedirectTo: `${window.location.origin}/profile/edit`,
          },
        });

        if (error) throw error;

        if (data.user && !data.session) {
          setError("Check your inbox to verify your email!");
          return;
        }

        // If auto-login is enabled after signup, set this flag
        if (data.session) {
          setIsNewRegistration(true);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        // Ensure flag is false for standard logins
        setIsNewRegistration(false);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-white dark:bg-gray-950">
      {/* Background Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-pink-500/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-red-500/10 blur-[120px]" />

      <div className="relative w-full max-w-[400px] px-6 py-12">
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-block mb-4 p-3 bg-gradient-to-br from-pink-500 to-red-500 rounded-2xl shadow-lg shadow-pink-500/20"
          >
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </motion.div>
          <h1 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white">
            FindMatch
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">
            {isSignUp ? "Join the community today" : "Welcome back, you've been missed!"}
          </p>
        </div>

        <motion.div
          layout
          className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-2xl shadow-gray-200/50 dark:shadow-none"
        >
          <form className="space-y-5" onSubmit={handleAuth}>
            <div>
              <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-pink-500 transition-all outline-none text-sm dark:text-white"
                placeholder="name@example.com"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-pink-500 transition-all outline-none text-sm dark:text-white"
                placeholder="••••••••"
              />
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl"
                >
                  <p className="text-xs font-bold text-red-600 dark:text-red-400 leading-relaxed">
                    {error}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex items-center justify-center py-4 px-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold text-sm shadow-xl shadow-gray-900/10 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isSignUp ? "Create Account" : "Sign In"}</span>
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(""); // Clear errors when switching modes
              }}
              className="text-xs font-bold text-gray-400 hover:text-pink-500 transition-colors uppercase tracking-widest"
            >
              {isSignUp ? "Already a member? Sign In" : "New here? Create Account"}
            </button>
          </div>
        </motion.div>

        <p className="mt-8 text-center text-[10px] text-gray-400 font-medium px-6">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}