"use client";

import { getStreamVideoToken } from "@/lib/actions/stream";
import {
  Call,
  CallControls,
  SpeakerLayout,
  StreamCall,
  StreamTheme,
  StreamVideo,
  StreamVideoClient,
} from "@stream-io/video-react-sdk";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import "@stream-io/video-react-sdk/dist/css/styles.css";

interface VideoCallProps {
  callId: string;
  onCallEnd: () => void;
  isIncoming?: boolean;
}

export default function VideoCall({
  callId,
  onCallEnd,
  isIncoming = false,
}: VideoCallProps) {
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let videoClient: StreamVideoClient | null = null;
    let videoCall: Call | null = null;

    async function initializeVideoCall() {
      try {
        setError(null);
        const response = await getStreamVideoToken();

        if (!isMounted) return;

        if (!response.success || !response.userId || !response.apiKey) {
          throw new Error(response.error || "Failed to fetch video credentials");
        }

        videoClient = new StreamVideoClient({
          apiKey: response.apiKey, 
          user: {
            id: response.userId,
            name: response.userName || "User",
            image: response.userImage,
          },
          token: response.token!,
        });

        videoCall = videoClient.call("default", callId);

        if (isIncoming) {
          await videoCall.join();
        } else {
          await videoCall.join({ create: true });
        }

        if (isMounted) {
          setClient(videoClient);
          setCall(videoCall);
          setLoading(false);
        }
      } catch (err: any) {
        console.error("Video Call Init Error:", err);
        if (isMounted) {
          setError(err.message || "Failed to initiate call");
          setLoading(false);
        }
      }
    }

    initializeVideoCall();

    return () => {
      isMounted = false;
      if (videoCall) {
        videoCall.leave().catch(console.error);
      }
      if (videoClient) {
        videoClient.disconnectUser().catch(console.error);
      }
    };
  }, [callId, isIncoming]);

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1000] bg-gray-950 flex flex-col overflow-hidden"
      >
        {/* Connection/Loading State */}
        {loading && (
          <div className="absolute inset-0 z-50 bg-gray-950 flex flex-col items-center justify-center p-6">
            <div className="relative mb-12">
              <motion.div 
                animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.1, 0.3] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="absolute inset-0 bg-pink-500 rounded-full blur-3xl"
              />
              <div className="relative w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-2xl rotate-12">
                 <svg className="w-12 h-12 text-white -rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            
            <motion.div 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-center"
            >
              <h2 className="text-3xl font-black text-white tracking-tighter mb-2">
                {isIncoming ? "Connecting..." : "Calling..."}
              </h2>
              <div className="flex items-center justify-center gap-2 text-pink-500/80 font-bold uppercase text-[10px] tracking-[0.2em]">
                <span className="w-1.5 h-1.5 bg-current rounded-full animate-ping" />
                Secure Line
              </div>
            </motion.div>

            <button 
              onClick={onCallEnd}
              className="absolute bottom-12 px-10 py-4 bg-red-500 text-white font-black rounded-3xl shadow-lg shadow-red-500/20 active:scale-95 transition-transform"
            >
              Cancel Call
            </button>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 z-50 bg-gray-950 flex items-center justify-center p-6 text-center">
            <div className="max-w-xs">
               <div className="w-20 h-20 bg-red-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-red-500">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
               </div>
               <h3 className="text-2xl font-black text-white mb-2">Call failed</h3>
               <p className="text-gray-400 text-sm mb-8 leading-relaxed">{error}</p>
               <button
                 onClick={onCallEnd}
                 className="w-full bg-white text-black font-black py-4 rounded-2xl active:scale-95 transition-transform"
               >
                 Go Back
               </button>
            </div>
          </div>
        )}

        {/* Active Call Interface */}
        {!loading && !error && client && call && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full"
          >
            <StreamVideo client={client}>
              <StreamCall call={call}>
                <StreamTheme className="str-video__theme--dark custom-video-theme">
                  <div className="relative w-full h-full flex flex-col">
                    
                    {/* Video Content */}
                    <div className="flex-1 relative">
                      <SpeakerLayout participantsBarPosition="bottom" />
                      
                      {/* Safety Overlay */}
                      <div className="absolute top-safe-top pt-8 inset-x-0 flex justify-center pointer-events-none z-50">
                        <div className="bg-black/40 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-2">
                          <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(236,72,153,0.8)]" />
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">Live Call</span>
                        </div>
                      </div>
                    </div>

                    {/* Controls Footer */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/60 to-transparent pt-20 pb-12 px-6 flex justify-center">
                      <div className="flex items-center justify-center w-full max-w-sm">
                        <CallControls onLeave={onCallEnd} />
                      </div>
                    </div>
                  </div>
                </StreamTheme>
              </StreamCall>
            </StreamVideo>
          </motion.div>
        )}
      </motion.div>
      
      <style jsx global>{`
        .custom-video-theme {
          --str-video__primary-color: #ec4899;
          --str-video__background-color: #030712;
        }
        
        /* Mobile-first Control Styling */
        .str-video__call-controls {
          gap: 1.5rem !important;
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
        }

        .str-video__call-controls__button {
          width: 56px !important;
          height: 56px !important;
          border-radius: 20px !important;
          background-color: rgba(255, 255, 255, 0.12) !important;
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          transition: all 0.2s ease;
        }

        .str-video__call-controls__button:active {
          transform: scale(0.9);
          background-color: rgba(255, 255, 255, 0.2) !important;
        }

        .str-video__call-controls__button--leave {
          background-color: #ef4444 !important;
          box-shadow: 0 8px 24px rgba(239, 68, 68, 0.3);
          border: none !important;
        }

        /* Ensure video fills the container correctly */
        .str-video__speaker-layout {
          padding: 0 !important;
          background: transparent !important;
        }

        .str-video__participant-view {
          border-radius: 0 !important;
        }
      `}</style>
    </AnimatePresence>
  );
}