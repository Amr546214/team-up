import Header from "../../components/common/Header";
import HeroSection from "../../components/common/HeroSection";
import LoginForm from "../../components/forms/LoginForm";
import { useAuth } from "../../hooks/useAuth";
import { Navigate } from "react-router-dom";
import { getDashboardPath } from "../../utils/authStorage";

function Login() {
  const { isAuthenticated, userRole } = useAuth();

  // Redirect if already logged in
  if (isAuthenticated && userRole) {
    return <Navigate to={getDashboardPath(userRole)} replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 flex flex-col md:flex-row">
        <HeroSection />
        <LoginForm />
      </main>
    </div>
  );
}

export default Login;
