import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import ChatbotWidget from "./components/common/ChatbotWidget";

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <ChatbotWidget />
    </AuthProvider>
  );
}

export default App;