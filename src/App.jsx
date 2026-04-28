import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import ChatbotWidget from "./components/common/ChatbotWidget";

function App() {
  const isProd = import.meta.env.PROD;

  return (
    <AuthProvider>
      <AppRoutes />
      <ChatbotWidget forceShow={isProd} />
    </AuthProvider>
  );
}

export default App;