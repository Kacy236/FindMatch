"use client";

import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const { signOut, user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { name: "Discover", href: "/matches", color: "hover:text-pink-400" },
    { name: "Matches", href: "/matches/list", color: "hover:text-blue-400" },
    { name: "Messages", href: "/chat", color: "hover:text-green-400" },
    { name: "Profile", href: "/profile", color: "hover:text-purple-400" },
  ];

  return (
    <nav className="sticky top-0 z-[100] w-full bg-slate-900/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo Section */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="group flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-tr from-pink-500 to-red-500 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                <span className="text-white font-black text-xs">FM</span>
              </div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                FindMatch
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {user && navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-full text-sm font-medium text-gray-400 transition-all duration-200 ${link.color} hover:bg-white/5`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                <button
                  onClick={signOut}
                  className="hidden md:flex items-center px-4 py-2 text-sm font-semibold text-gray-300 hover:text-white transition-colors"
                >
                  Sign Out
                </button>
                
                {/* Mobile Menu Toggle */}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="md:hidden relative z-50 p-2 text-gray-400 hover:text-white focus:outline-none"
                  aria-label="Toggle menu"
                >
                  <div className="w-6 h-6 flex flex-col justify-center items-center">
                    <span className={`block w-5 h-0.5 bg-current transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-0.5' : '-translate-y-1'}`}></span>
                    <span className={`block w-5 h-0.5 bg-current transition-all duration-300 ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
                    <span className={`block w-5 h-0.5 bg-current transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-0.5' : 'translate-y-1'}`}></span>
                  </div>
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-red-500 text-white text-sm font-bold rounded-full hover:shadow-[0_0_20px_rgba(236,72,153,0.3)] transition-all duration-300 active:scale-95"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Full-screen Mobile Menu Overlay */}
      <div 
        className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${
          isMenuOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"
        }`}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-slate-950/98 backdrop-blur-2xl" />
        
        {/* Menu Content */}
        <div className="relative h-full flex flex-col justify-center items-center p-8">
          <div className="w-full max-w-xs space-y-8 text-center">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="block text-4xl font-bold text-white active:text-pink-500 transition-colors"
              >
                {link.name}
              </Link>
            ))}
            
            <div className="pt-8 mt-8 border-t border-white/10">
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  signOut();
                }}
                className="w-full py-4 rounded-2xl bg-red-500/10 text-red-500 text-xl font-bold active:bg-red-500 active:text-white transition-all"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}