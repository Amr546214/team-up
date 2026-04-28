import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import { ChatBubbleLeftEllipsisIcon, XMarkIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";

// Mock messages for initial display
const MOCK_MESSAGES = [
  {
    id: 1,
    role: "assistant",
    content: "Hi! How can I help you today?",
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
];

function ChatbotWidget() {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const sidebarRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages, scrollToBottom]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        // Only close if clicking outside the floating button area as well
        const button = document.querySelector("[data-chatbot-button]");
        if (!button || !button.contains(e.target)) {
          setIsOpen(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle Escape key to close
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  // Don't render for unauthenticated users - must be after all hooks
  if (!isAuthenticated) {
    return null;
  }

  // Handle opening with animation
  const handleOpen = () => {
    setIsAnimating(true);
    setIsOpen(true);
  };

  // Handle closing with animation
  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => setIsAnimating(false), 300);
  };

  // Handle sending a message (mock)
  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    // Mock assistant response
    setTimeout(() => {
      const assistantMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: "Thanks for your message! The chatbot integration is coming soon.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }, 1000);
  };

  // Handle input keydown (Enter to send)
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        type="button"
        data-chatbot-button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-gray-700/30 bg-[#111827]/80 text-white shadow-[0_8px_30px_rgba(0,0,0,0.25)] backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-[#1f2937]/90 hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)] dark:border-gray-600/50 dark:bg-gray-900/90 dark:hover:bg-gray-800/95"
        aria-label="Open AI Assistant"
      >
        <ChatBubbleLeftEllipsisIcon className="h-6 w-6" />
      </button>

      {/* Overlay Backdrop */}
      {(isOpen || isAnimating) && (
        <div
          className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
            isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={handleClose}
        />
      )}

      {/* Chat Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed top-0 right-0 z-[60] h-screen w-full transform bg-[#0f172a]/95 shadow-[-8px_0_40px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-transform duration-300 ease-out sm:w-[420px] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-700/50 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-white">AI Assistant</h2>
            <p className="text-sm text-gray-400">Ask anything about the platform</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-800 hover:text-white"
            aria-label="Close"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="h-[calc(100vh-180px)] overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                    message.role === "user"
                      ? "bg-[#0B6B63] text-white"
                      : "border border-gray-700/50 bg-gray-800/80 text-gray-100"
                  }`}
                >
                  <p>{message.content}</p>
                  <span className="mt-1 block text-[10px] opacity-60">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Footer / Input Area */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-700/50 bg-[#0f172a]/95 px-6 py-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="flex-1 rounded-xl border border-gray-700/50 bg-gray-800/80 px-4 py-3 text-sm text-white placeholder-gray-400 outline-none transition focus:border-[#0B6B63] focus:ring-1 focus:ring-[#0B6B63]/50"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0B6B63] text-white transition hover:bg-[#0d9488] disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Send message"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default ChatbotWidget;
