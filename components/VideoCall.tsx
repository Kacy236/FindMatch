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
        className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center overflow-hidden touch-none"
      >
        {loading && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center z-10 px-6"
          >
            <div className="relative mb-8 flex justify-center">
              <motion.div 
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.2, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute h-24 w-24 bg-pink-500 rounded-full blur-xl"
              />
              <div className="relative h-24 w-24 rounded-full bg-gradient-to-tr from-pink-500 to-red-500 flex items-center justify-center shadow-2xl">
                <svg className="w-10 h-10 text-white animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight mb-2">
              {isIncoming ? "Connecting..." : "Calling..."}
            </h2>
            <p className="text-gray-400 font-medium text-sm animate-pulse">Establishing secure connection</p>
          </motion.div>
        )}

        {error && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center w-[90%] max-w-sm mx-auto p-8 md:p-10 bg-gray-900/80 backdrop-blur-2xl rounded-[2.5rem] md:rounded-[3rem] border border-white/10 shadow-2xl z-10"
          >
            <div className="w-16 h-16 md:w-20 md:h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl md:text-4xl text-red-500">✕</span>
            </div>
            <h3 className="text-xl md:text-2xl font-black text-white mb-3">Call Failed</h3>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed">{error}</p>
            <button
              onClick={onCallEnd}
              className="w-full bg-white text-black font-black py-4 px-8 rounded-2xl hover:bg-gray-200 transition-all active:scale-95 shadow-xl"
            >
              Dismiss
            </button>
          </motion.div>
        )}

        {!loading && !error && client && call && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full flex flex-col"
          >
            <StreamVideo client={client}>
              <StreamCall call={call}>
                <StreamTheme className="str-video__theme--dark custom-video-theme">
                  <div className="relative w-full h-full flex flex-col">
                    {/* Top Overlay UI - Adjusted for Mobile Notches */}
                    <div className="absolute top-4 md:top-8 inset-x-0 px-4 md:px-6 flex justify-center items-center pointer-events-none z-50 pt-[env(safe-area-inset-top)]">
                      <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-white/10 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-[10px] md:text-xs font-black text-white uppercase tracking-widest">Encrypted</span>
                      </div>
                    </div>

                    {/* The main video area */}
                    <div className="flex-1 relative overflow-hidden bg-black">
                      <SpeakerLayout participantsBarPosition="bottom" />
                    </div>

                    {/* Custom Styled Controls Wrapper - Fixed at bottom for Mobile */}
                    <div className="safe-bottom pb-[env(safe-area-inset-bottom)] bg-gradient-to-t from-black via-black/80 to-transparent">
                      <div className="h-24 md:h-32 flex items-center justify-center">
                        <div className="scale-90 md:scale-125">
                          <CallControls onLeave={onCallEnd} />
                        </div>
                      </div>
                    </div>
                  </div>
                </StreamTheme>
              </StreamCall>
            </StreamVideo>
          </motion.div>
        )}
      </motion.div>
      
      {/* Global Style Override for Stream Components */}
      <style jsx global>{`
        .custom-video-theme {
          --str-video__primary-color: #ec4899; /* pink-500 */
          --str-video__background-color: #000000;
        }

        /* Mobile Optimization for Participant Views */
        .str-video__speaker-layout {
          height: 100% !important;
          padding: 0 !important;
        }

        /* Ensure the PIP (Local Video) is positioned well on mobile */
        .str-video__participant-view--pip {
          top: 20px !important;
          right: 20px !important;
          width: 100px !important;
          height: 150px !important;
          border-radius: 12px !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.5) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
        }

        @media (min-width: 768px) {
          .str-video__participant-view--pip {
            width: 180px !important;
            height: 120px !important;
          }
        }

        .str-video__call-controls {
          background: transparent !important;
          border: none !important;
          gap: 12px !important;
          padding: 0 !important;
        }

        .str-video__call-controls__button {
          background-color: rgba(255, 255, 255, 0.15) !important;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          width: 50px !important;
          height: 50px !important;
          border-radius: 50% !important;
        }

        .str-video__call-controls__button i {
          font-size: 20px !important;
        }

        .str-video__call-controls__button--leave {
          background-color: #ef4444 !important; /* red-500 */
          border: none !important;
          width: 60px !important;
          height: 60px !important;
        }

        /* Hide the Stream watermark/branding for a cleaner mobile look if needed */
        .str-video__power-by {
          display: none !important;
        }
      `}</style>
    </AnimatePresence>
  );
}