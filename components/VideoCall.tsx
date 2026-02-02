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
        className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center overflow-hidden"
      >
        {loading && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center z-10"
          >
            <div className="relative mb-8">
              <motion.div 
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.2, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 bg-pink-500 rounded-full blur-xl"
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
            className="text-center max-w-sm mx-auto p-10 bg-gray-900/80 backdrop-blur-2xl rounded-[3rem] border border-white/10 shadow-2xl z-10"
          >
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl text-red-500">✕</span>
            </div>
            <h3 className="text-2xl font-black text-white mb-3">Call Failed</h3>
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
            className="w-full h-full"
          >
            <StreamVideo client={client}>
              <StreamCall call={call}>
                <StreamTheme className="str-video__theme--dark custom-video-theme">
                  <div className="relative w-full h-full flex flex-col">
                    {/* The main video area */}
                    <div className="flex-1 relative overflow-hidden">
                      <SpeakerLayout participantsBarPosition="bottom" />
                      
                      {/* Top Overlay UI (Room ID/Safety) */}
                      <div className="absolute top-8 inset-x-0 px-6 flex justify-between items-center pointer-events-none z-50">
                        <div className="bg-black/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <span className="text-xs font-black text-white uppercase tracking-widest">End-to-End Encrypted</span>
                        </div>
                      </div>
                    </div>

                    {/* Custom Styled Controls Wrapper */}
                    <div className="h-32 bg-gradient-to-t from-black via-black/80 to-transparent flex items-center justify-center pb-8">
                      <div className="scale-110 md:scale-125">
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
      
      {/* Global Style Override for Stream Components */}
      <style jsx global>{`
        .custom-video-theme {
          --str-video__primary-color: #ec4899; /* pink-500 */
          --str-video__background-color: #000000;
        }
        .str-video__call-controls {
          background: transparent !important;
          border: none !important;
        }
        .str-video__call-controls__button {
          background-color: rgba(255, 255, 255, 0.1) !important;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        .str-video__call-controls__button--leave {
          background-color: #ef4444 !important; /* red-500 */
          border: none !important;
        }
      `}</style>
    </AnimatePresence>
  );
}