"use client";

import { UserProfile } from "@/app/profile/page";
import {
  createOrGetChannel,
  createVideoCall,
  getStreamUserToken,
} from "@/lib/actions/stream";
import { useRouter } from "next/navigation";
import {
  RefObject,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Channel, Event, StreamChat } from "stream-chat";
import { motion, AnimatePresence } from "framer-motion";
import VideoCall from "./VideoCall";

interface Message {
  id: string;
  text: string;
  sender: "me" | "other";
  timestamp: Date;
  user_id: string;
}

export default function StreamChatInterface({
  otherUser,
  ref,
}: {
  otherUser: UserProfile;
  ref: RefObject<{ handleVideoCall: () => void } | null>;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);

  const [client, setClient] = useState<StreamChat | null>(null);
  const [channel, setChannel] = useState<Channel | null>(null);

  const [showScrollButton, setShowScrollButton] = useState<boolean>(false);

  const [videoCallId, setVideoCallId] = useState<string>("");
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [isCallInitiator, setIsCallInitiator] = useState(false);

  const [incomingCallId, setIncomingCallId] = useState<string>("");
  const [callerName, setCallerName] = useState<string>("");
  const [showIncomingCall, setIncomingCall] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const router = useRouter();

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollButton(false);
  }

  function handleScroll() {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    }
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    const container = messagesContainerRef.current;

    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, []);

  useEffect(() => {
    setShowVideoCall(false);
    setVideoCallId("");
    setIncomingCall(false);
    setIncomingCallId("");
    setCallerName("");
    setIsCallInitiator(false);

    async function initializeChat() {
      try {
        setError(null);

        const response = await getStreamUserToken();
        
        // CRITICAL FIX: Verify the response and the ID before connecting
        if (!response.success || !response.userId) {
          console.error("Token generation failed:", response.error);
          setError(response.error || "Authentication failed. Please try logging in again.");
          return;
        }

        // We extract the apiKey sent from the server to bypass process.env issues
        const { token, userId, userName, userImage, apiKey } = response;
        setCurrentUserId(userId);

        // USE THE API KEY FROM THE SERVER RESPONSE
        const chatClient = StreamChat.getInstance(apiKey!);

        // Ensure we don't call connectUser if it's already connected to this user
        if (chatClient.userID !== userId) {
          await chatClient.connectUser(
            {
              id: userId,
              name: userName || "User",
              image: userImage,
            },
            token!
          );
        }

        const channelResponse = await createOrGetChannel(otherUser.id);
        
        if (!channelResponse.success || !channelResponse.channelId) {
          console.error("Channel error:", channelResponse.error);
          setError("Could not open conversation.");
          return;
        }

        const { channelType, channelId } = channelResponse;

        // Get the channel
        const chatChannel = chatClient.channel(channelType!, channelId!);
        await chatChannel.watch();

        // Load existing messages
        const state = await chatChannel.query({ messages: { limit: 50 } });

        // Convert stream messages to our format
        const convertedMessages: Message[] = state.messages.map((msg) => ({
          id: msg.id,
          text: msg.text || "",
          sender: msg.user?.id === userId ? "me" : "other",
          timestamp: new Date(msg.created_at || new Date()),
          user_id: msg.user?.id || "",
        }));

        setMessages(convertedMessages);

        chatChannel.on("message.new", (event: Event) => {
          if (event.message) {
            if (event.message.text?.includes(`📹 Video call invitation`)) {
              const customData = event.message as any;

              if (customData.caller_id !== userId) {
                setIncomingCallId(customData.call_id);
                setCallerName(customData.caller_name || "Someone");
                setIncomingCall(true);
              }
              return;
            }

            if (event.message.user?.id !== userId) {
              const newMsg: Message = {
                id: event.message.id,
                text: event.message.text || "",
                sender: "other",
                timestamp: new Date(event.message.created_at || new Date()),
                user_id: event.message.user?.id || "",
              };

              setMessages((prev) => {
                const messageExists = prev.some((msg) => msg.id === newMsg.id);
                if (!messageExists) {
                  return [...prev, newMsg];
                }

                return prev;
              });
            }
          }
        });

        chatChannel.on("typing.start", (event: Event) => {
          if (event.user?.id !== userId) {
            setIsTyping(true);
          }
        });

        chatChannel.on("typing.stop", (event: Event) => {
          if (event.user?.id !== userId) {
            setIsTyping(false);
          }
        });

        setClient(chatClient);
        setChannel(chatChannel);
      } catch (error) {
        console.error("Chat initialization catch-all error:", error);
        setError("An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    }

    if (otherUser) {
      initializeChat();
    }

    return () => {
      if (client) {
        client.disconnectUser();
      }
    };
  }, [otherUser]);

  async function handleVideoCall() {
    try {
      const response = await createVideoCall(otherUser.id);
      if (!response.success) throw new Error(response.error as string);

      const { callId } = response;
      setVideoCallId(callId!);
      setShowVideoCall(true);
      setIsCallInitiator(true);

      if (channel) {
        const messageData = {
          text: `📹 Video call invitation`,
          call_id: callId,
          caller_id: currentUserId,
          caller_name: otherUser.full_name || "Someone",
        };

        await channel.sendMessage(messageData as any);
      }
    } catch (error) {
      console.error("Video call initiation error:", error);
    }
  }

  useImperativeHandle(ref, () => ({
    handleVideoCall,
  }));

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (newMessage.trim() && channel) {
      try {
        const response = await channel.sendMessage({
          text: newMessage.trim(),
        });

        const message: Message = {
          id: response.message.id,
          text: newMessage.trim(),
          sender: "me",
          timestamp: new Date(),
          user_id: currentUserId,
        };

        setMessages((prev) => {
          const messageExists = prev.some((msg) => msg.id === message.id);
          if (!messageExists) {
            return [...prev, message];
          }

          return prev;
        });

        setNewMessage("");
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  }

  function handleCallEnd() {
    setShowVideoCall(false);
    setVideoCallId("");
    setIsCallInitiator(false);

    // Clear any pending incoming call state when call ends
    setIncomingCall(false);
    setIncomingCallId("");
    setCallerName("");
  }

  function handleDeclineCall() {
    setIncomingCall(false);
    setIncomingCallId("");
    setCallerName("");
  }

  function handleAcceptCall() {
    setVideoCallId(incomingCallId);
    setShowVideoCall(true);
    setIncomingCall(false);
    setIncomingCallId("");
    setIsCallInitiator(false);
  }

  function formatTime(date: Date) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-950 p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-red-500">⚠️</span>
          </div>
          <p className="text-gray-900 dark:text-white font-bold text-lg mb-2">Connection Error</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-2xl transition-all active:scale-95"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!client || !channel) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-pink-100 dark:border-pink-900/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-pink-500 rounded-full border-t-transparent animate-spin"></div>
          </div>
          
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-950 relative overflow-hidden">
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-4 scroll-smooth hide-scrollbar"
      >
        {messages.map((message, idx) => {
          const isMe = message.sender === "me";
          const isLastInGroup = idx === messages.length - 1 || messages[idx + 1].sender !== message.sender;

          return (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              key={message.id || idx}
              className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}
            >
              {!isMe && (
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden flex-shrink-0 mb-1">
                  {isLastInGroup && (
                    <img src={otherUser.avatar_url} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
              )}
              
              <div className="flex flex-col group max-w-[75%] lg:max-w-[60%]">
                <div 
                  className={`px-4 py-2.5 rounded-[20px] shadow-sm text-[15px] leading-relaxed ${
                    isMe 
                      ? "bg-gradient-to-br from-pink-500 to-red-600 text-white rounded-br-none" 
                      : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-none border border-gray-100 dark:border-gray-700"
                  }`}
                >
                  <p>{message.text}</p>
                </div>
                <span className={`text-[10px] mt-1 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                  isMe ? "text-right mr-1" : "text-left ml-1"
                } text-gray-400 dark:text-gray-500`}>
                  {formatTime(message.timestamp)}
                </span>
              </div>
            </motion.div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-2 ml-10">
            <div className="bg-white dark:bg-gray-800 px-3 py-2 rounded-2xl border border-gray-100 dark:border-gray-700 flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                  className="w-1.5 h-1.5 bg-pink-400 rounded-full"
                />
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onClick={scrollToBottom}
            className="absolute bottom-24 right-6 p-3 bg-white dark:bg-gray-800 text-pink-500 rounded-full shadow-xl border border-gray-100 dark:border-gray-700 z-20 hover:scale-110 active:scale-95 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Message Input Area */}
      <div className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 p-4 pb-8 md:pb-4">
        <form className="max-w-4xl mx-auto flex items-end gap-2" onSubmit={handleSendMessage}>
          <div className="flex-1 relative bg-gray-100 dark:bg-gray-800 rounded-[24px] focus-within:ring-2 focus-within:ring-pink-500/20 transition-all">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                if (channel && e.target.value.length > 0) {
                  channel.keystroke();
                }
              }}
              onFocus={() => {
                if (channel) channel.keystroke();
              }}
              placeholder="Type a message..."
              className="w-full px-5 py-3 bg-transparent border-none focus:ring-0 text-[15px] dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              disabled={!channel}
            />
          </div>

          <button
            type="submit"
            disabled={!newMessage.trim() || !channel}
            className="w-12 h-12 flex items-center justify-center bg-gradient-to-tr from-pink-500 to-red-500 text-white rounded-full shadow-lg shadow-pink-500/30 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:grayscale transition-all duration-200"
          >
            <svg className="w-5 h-5 rotate-45 -translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>

      {/* Incoming Call Overlay */}
      <AnimatePresence>
        {showIncomingCall && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[1100] p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl text-center border border-white/10"
            >
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 bg-pink-500 rounded-full animate-ping opacity-20" />
                <img 
                  src={otherUser.avatar_url} 
                  alt={otherUser.full_name} 
                  className="relative w-full h-full rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-xl" 
                />
              </div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-1">
                {callerName}
              </h3>
              <p className="text-pink-500 font-bold text-xs uppercase tracking-widest mb-8">
                Incoming Video Call
              </p>
              
              <div className="flex gap-4">
                <button 
                  onClick={handleDeclineCall} 
                  className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-2xl font-bold hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all"
                >
                  Decline
                </button>
                <button 
                  onClick={handleAcceptCall} 
                  className="flex-1 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-green-500/30 hover:scale-105 active:scale-95 transition-all"
                >
                  Accept
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Call Modal Container */}
      {showVideoCall && videoCallId && (
        <VideoCall
          onCallEnd={handleCallEnd}
          callId={videoCallId}
          isIncoming={!isCallInitiator}
        />
      )}
    </div>
  );
}