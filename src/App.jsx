import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import ChatbotWidget from "./components/common/ChatbotWidget";
import { useLocation } from "react-router-dom";

function AppContent() {
  const location = useLocation();
  const isProd = import.meta.env.PROD;

  // Hide chatbot on chat-related pages
  const isChatPage = location.pathname.startsWith('/chat') || location.pathname.includes('/chat-test');

  return (
    <>
      <AppRoutes />
      {!isChatPage && <ChatbotWidget forceShow={isProd} />}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;