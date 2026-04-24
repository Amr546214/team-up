import Header from "../../components/common/Header";
import HeroSection from "../../components/common/HeroSection";
import LoginForm from "../../components/forms/LoginForm";

function Login() {
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
