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
  const [hasJoined, setHasJoined] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function initializeVideoCall() {
      if (hasJoined) {
        return;
      }

      try {
        setError(null);
        // CRITICAL FIX: Destructure 'apiKey' from the server action response
        const { token, userId, userImage, userName, apiKey, success, error: serverError } =
          await getStreamVideoToken();

        if (!success || !userId || !apiKey) {
          throw new Error(serverError || "Failed to fetch video credentials");
        }

        if (!isMounted) return;

        // USE THE apiKey RETURNED FROM SERVER INSTEAD OF process.env
        const videoClient = new StreamVideoClient({
          apiKey: apiKey, 
          user: {
            id: userId,
            name: userName || "User",
            image: userImage,
          },
          token: token!,
        });

        if (!isMounted) return;

        const videoCall = videoClient.call("default", callId);

        if (isIncoming) {
          await videoCall.join();
        } else {
          await videoCall.join({ create: true });
        }

        if (!isMounted) return;

        setClient(videoClient);
        setCall(videoCall);
        setHasJoined(true);
      } catch (error: any) {
        console.error("Video Call Init Error:", error);
        setError(error.message || "Failed to initiate call");
      } finally {
        setLoading(false);
      }
    }

    initializeVideoCall();

    return () => {
      isMounted = false;
      // Note: we don't call leave() inside the effect cleanup if 
      // the component is unmounting to allow state persistence 
      // if needed, but for a simple modal, it's fine.
      if (client) {
        client.disconnectUser();
      }
    };
  }, [callId, isIncoming, hasJoined]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">
            {isIncoming ? "Joining call..." : "Starting call..."}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="text-center text-white max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Call Error</h3>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={onCallEnd}
            className="bg-gradient-to-r from-pink-500 to-red-500 text-white font-semibold py-3 px-6 rounded-full hover:from-pink-600 hover:to-red-600 transition-all duration-200"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!client || !call) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Setting up call...</p>
        </div>
      </div>
    );
  }

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