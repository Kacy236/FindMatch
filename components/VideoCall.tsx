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

        // 1. Initialize Client
        videoClient = new StreamVideoClient({
          apiKey: response.apiKey, 
          user: {
            id: response.userId,
            name: response.userName || "User",
            image: response.userImage,
          },
          token: response.token!,
        });

        // 2. Initialize Call
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
      // Clean up the call and client when the component unmounts
      if (videoCall) {
        videoCall.leave().catch(console.error);
      }
      if (videoClient) {
        videoClient.disconnectUser().catch(console.error);
      }
    };
  }, [callId, isIncoming]); // Only re-run if ID or direction changes

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">{isIncoming ? "Joining call..." : "Starting call..."}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="text-center text-white max-w-md mx-auto p-8 bg-gray-900 rounded-2xl shadow-2xl">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Call Error</h3>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={onCallEnd}
            className="w-full bg-gradient-to-r from-pink-500 to-red-500 text-white font-semibold py-3 px-6 rounded-full hover:scale-105 transition-transform"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!client || !call) return null;

  return (
    <div className="fixed inset-0 bg-black z-50">
      <StreamVideo client={client}>
        <StreamCall call={call}>
          <StreamTheme>
            <SpeakerLayout />
            <CallControls onLeave={onCallEnd} />
          </StreamTheme>
        </StreamCall>
      </StreamVideo>
    </div>
  );
}