"use client";

import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const { signOut, user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <nav className="relative z-50 bg-slate-900 border-b border-gray-200/50 dark:border-gray-700/50">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <span className="text-xl font-bold bg-gradient-to-r from-pink-400 to-red-400 bg-clip-text text-transparent">
              FindMatch
            </span>
          </Link>

          {/* Desktop Navigation */}
          {user && (
            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="/matches"
                className="text-gray-300 hover:text-pink-400 font-medium transition-colors duration-200"
              >
                Discover
              </Link>
              <Link
                href="/matches/list"
                className="text-gray-300 hover:text-blue-400 font-medium transition-colors duration-200"
              >
                Matches
              </Link>
              <Link
                href="/chat"
                className="text-gray-300 hover:text-green-400 font-medium transition-colors duration-200"
              >
                Messages
              </Link>
              <Link
                href="/profile"
                className="text-gray-300 hover:text-purple-400 font-medium transition-colors duration-200"
              >
                Profile
              </Link>
            </div>
          )}

          {/* Right Side Actions (Auth + Mobile Toggle) */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <button
                  onClick={signOut}
                  className="hidden md:inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-medium rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md"
                >
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Sign Out
                </button>

                {/* Mobile Menu Button */}
                <button
                  onClick={toggleMenu}
                  className="md:hidden p-2 rounded-lg text-gray-400 hover:bg-slate-800 focus:outline-none"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {isMenuOpen ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16m-7 6h7"
                      />
                    )}
                  </svg>
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-pink-500 to-red-500 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all duration-200"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {user && isMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-800 animate-in fade-in slide-in-from-top-2">
            <div className="flex flex-col space-y-4">
              <Link
                href="/matches"
                onClick={() => setIsMenuOpen(false)}
                className="text-gray-300 hover:text-pink-400 font-medium px-2"
              >
                Discover
              </Link>
              <Link
                href="/matches/list"
                onClick={() => setIsMenuOpen(false)}
                className="text-gray-300 hover:text-blue-400 font-medium px-2"
              >
                Matches
              </Link>
              <Link
                href="/chat"
                onClick={() => setIsMenuOpen(false)}
                className="text-gray-300 hover:text-green-400 font-medium px-2"
              >
                Messages
              </Link>
              <Link
                href="/profile"
                onClick={() => setIsMenuOpen(false)}
                className="text-gray-300 hover:text-purple-400 font-medium px-2"
              >
                Profile
              </Link>
              <div className="pt-4 border-t border-slate-800">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    signOut();
                  }}
                  className="w-full flex items-center justify-center px-4 py-3 bg-red-500/10 text-red-500 font-bold rounded-xl"
                >
                  Log Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}