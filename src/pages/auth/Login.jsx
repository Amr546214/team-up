import Header from "../../components/common/Header";
import HeroSection from "../../components/common/HeroSection";
import LoginForm from "../../components/forms/LoginForm";
import { useAuth } from "../../hooks/useAuth";
import { Navigate } from "react-router-dom";

function getDashboardPathByRole(role) {
  switch (role) {
    case "client":
      return "/client/profile";
    case "developer":
      return "/developer/dashboard";
    case "company":
      return "/company/profile";
    case "admin":
      return "/";
    default:
      return "/";
  }
}

function Login() {
  const { isAuthenticated, session } = useAuth();

  // Redirect if already logged in
  if (isAuthenticated && session?.role) {
    return <Navigate to={getDashboardPathByRole(session.role)} replace />;
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
