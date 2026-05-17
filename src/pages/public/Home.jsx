import { useEffect, useState } from "react";
import Header from "../../components/common/Header";
import heroImage from "../../assets/images/image.png";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import footerLogo from "../../assets/logo/teamup-logo.png";
import { useAuth } from "../../hooks/useAuth";
import { getDashboardPath } from "../../utils/authStorage";

import {
  UserPlus,
  FileText,
  Users,
  ClipboardList,
  Star,
  Sparkles,
  TrendingUp,
  MessageSquare,
  Trophy,
  CheckCircle,
  User2,
  BriefcaseBusiness,
  CodeXml,
  Building2,
  Check,
  Github,
  Linkedin,
  Mail,
} from "lucide-react";

const BASE_URL = "https://team-up-backend-production-6c43.up.railway.app";

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated, userRole } = useAuth();
  const { t } = useTranslation();

  const [stats, setStats] = useState({
    totalUsers: 50000,
    projectsCompleted: 12500,
    activeTeams: 3200,
    averageRating: 4.8,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${BASE_URL}/landing/stats`);

        if (!res.ok) {
          throw new Error("Failed to load stats");
        }

        const data = await res.json();
        const payload = data?.data || data;

        setStats({
          totalUsers: payload?.totalUsers ?? 50000,
          projectsCompleted: payload?.projectsCompleted ?? 12500,
          activeTeams: payload?.activeTeams ?? 3200,
          averageRating: payload?.averageRating ?? 4.8,
        });
      } catch (error) {
        console.error("Failed to fetch home stats:", error);
      }
    };

    fetchStats();
  }, []);

  const handleGetStarted = () => {
    if (isAuthenticated && userRole) {
      navigate(getDashboardPath(userRole));
    } else {
      navigate("/login");
    }
  };

  const handleSignUp = (role) => {
    if (isAuthenticated && userRole) {
      navigate(getDashboardPath(userRole));
    } else {
      navigate(`/register?role=${role}`);
    }
  };

  const howItWorksCards = [
    {
      icon: <UserPlus size={18} />,
      title: t("home.createAccount"),
      desc: t("home.createAccountDesc"),
      onClick: () => handleSignUp("client"),
      type: "button",
    },
    {
      icon: <FileText size={18} />,
      title: t("home.postOrApply"),
      desc: t("home.postOrApplyDesc"),
      to: "/projects",
    },
    {
      icon: <Users size={18} />,
      title: t("home.buildTeams"),
      desc: t("home.buildTeamsDesc"),
      to: "/teams",
    },
    {
      icon: <ClipboardList size={18} />,
      title: t("home.workAndTrack"),
      desc: t("home.workAndTrackDesc"),
      to: "/dashboard",
    },
    {
      icon: <Star size={18} />,
      title: t("home.rateAndGrow"),
      desc: t("home.rateAndGrowDesc"),
      to: "/profile",
    },
  ];

  const featureCards = [
    {
      icon: <Sparkles size={18} />,
      title: t("home.aiTeamBuilder"),
      desc: t("home.aiTeamBuilderDesc"),
      to: "/ai-team-builder",
    },
    {
      icon: <TrendingUp size={18} />,
      title: t("home.performanceTracking"),
      desc: t("home.performanceTrackingDesc"),
      to: "/performance-tracking",
    },
    {
      icon: <MessageSquare size={18} />,
      title: t("home.smartChatbot"),
      desc: t("home.smartChatbotDesc"),
      to: "/chatbot",
    },
    {
      icon: <Trophy size={18} />,
      title: t("home.rankingSystem"),
      desc: t("home.rankingSystemDesc"),
      to: "/ranking-system",
    },
  ];

  const statsCards = [
    {
      icon: <Users size={18} />,
      value: `${stats.totalUsers.toLocaleString()}+`,
      label: t("home.totalUsers"),
    },
    {
      icon: <CheckCircle size={18} />,
      value: `${stats.projectsCompleted.toLocaleString()}+`,
      label: t("home.projectsCompleted"),
    },
    {
      icon: <User2 size={18} />,
      value: `${stats.activeTeams.toLocaleString()}+`,
      label: t("home.activeTeams"),
    },
    {
      icon: <Star size={18} />,
      value: `${stats.averageRating}/5`,
      label: t("home.averageRating"),
    },
  ];

  const roleCards = [
    {
      icon: <BriefcaseBusiness size={18} />,
      title: t("home.clientCardTitle"),
      desc: t("home.clientCardDesc"),
      features: [
        t("home.clientFeature1"),
        t("home.clientFeature2"),
        t("home.clientFeature3"),
        t("home.clientFeature4"),
      ],
      button: isAuthenticated ? t("home.goToDashboard") : t("home.signUpAsClient"),
      role: "client",
    },
    {
      icon: <CodeXml size={18} />,
      title: t("home.developerCardTitle"),
      desc: t("home.developerCardDesc"),
      features: [
        t("home.devFeature1"),
        t("home.devFeature2"),
        t("home.devFeature3"),
        t("home.devFeature4"),
      ],
      button: isAuthenticated ? t("home.goToDashboard") : t("home.signUpAsDeveloper"),
      role: "developer",
    },
    {
      icon: <Building2 size={18} />,
      title: t("home.companyCardTitle"),
      desc: t("home.companyCardDesc"),
      features: [
        t("home.companyFeature1"),
        t("home.companyFeature2"),
        t("home.companyFeature3"),
        t("home.companyFeature4"),
      ],
      button: isAuthenticated ? t("home.goToDashboard") : t("home.signUpAsCompany"),
      role: "company",
    },
  ];

  const footerColumns = [
    {
      title: t("home.product"),
      links: [t("home.features"), t("home.pricing"), t("home.howItWorks")],
    },
    {
      title: t("home.company"),
      links: [t("home.about"), t("home.blog"), t("home.careers")],
    },
    {
      title: t("home.support"),
      links: [t("home.helpCenter"), t("home.contact"), t("home.privacy")],
    },
  ];

  return (
    <div className="bg-[#F5FAFA] min-h-screen">
      <Header />

      <section className="bg-[#F5FAFA] min-h-[calc(100vh-4rem)] w-full flex items-center overflow-hidden">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-10 lg:px-16 py-10 lg:py-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="flex flex-col justify-center order-2 lg:order-1 text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#0F172A] leading-tight">
                {t("home.heroTitle")}
              </h1>

              <p className="mt-6 text-base sm:text-lg text-[#64748B] max-w-xl leading-relaxed mx-auto lg:mx-0">
                {t("home.heroSubtitle")}
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button
                  onClick={handleGetStarted}
                  className="w-full sm:w-auto h-12 px-8 bg-[#0B6F6C] text-white rounded-md hover:bg-[#15807d] transition font-medium flex items-center justify-center"
                >
                  {isAuthenticated ? t("home.goToDashboard") : t("home.getStarted")}
                </button>

                <a
                  href="#features"
                  className="w-full sm:w-auto h-12 px-8 border border-[#0B6F6C] text-[#0B6F6C] rounded-md hover:bg-[#e6f3f2] transition font-medium flex items-center justify-center"
                >
                  {t("home.learnMore")}
                </a>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end order-1 lg:order-2">
              <img
                src={heroImage}
                alt="team illustration"
                className="w-full max-w-[280px] sm:max-w-[380px] md:max-w-[480px] lg:max-w-[600px] object-contain rounded-[80px] lg:rounded-[150px]"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="bg-[#F5FAFA]">
        <div className="bg-white px-4 sm:px-6 md:px-10 py-10">
          <h2 className="text-center text-[24px] md:text-[32px] font-bold text-[#111827] mb-12">
            {t("home.howItWorksTitle")}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {howItWorksCards.map((card, index) => {
              const content = (
                <>
                  <div className="w-10 h-10 rounded-full bg-[#D8F0EC] flex items-center justify-center mx-auto mb-4 text-[#0B6F6C]">
                    {card.icon}
                  </div>
                  <h3 className="text-[16px] font-semibold text-[#111827] mb-2">
                    {card.title}
                  </h3>
                  <p className="text-[14px] leading-7 text-[#6B7280] whitespace-pre-line">
                    {card.desc}
                  </p>
                </>
              );

              if (card.type === "button") {
                return (
                  <button
                    key={index}
                    onClick={card.onClick}
                    className="bg-white border border-[#D9E3E2] rounded-[8px] px-5 py-6 hover:shadow-md transition text-left"
                  >
                    {content}
                  </button>
                );
              }

              return (
                <Link
                  key={index}
                  to={card.to}
                  className="bg-white border border-[#D9E3E2] rounded-[8px] px-5 py-6 hover:shadow-md transition"
                >
                  {content}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="bg-[#F5FAFA] px-4 sm:px-6 md:px-10 py-12">
          <h2 className="text-center text-[24px] md:text-[32px] font-bold text-[#111827] mb-12">
            {t("home.chooseYourRole")}
          </h2>

          <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            {featureCards.map((card, index) => (
              <Link
                key={index}
                to={card.to}
                className="bg-white border border-[#D9E3E2] rounded-[8px] px-5 py-6 hover:shadow-md transition"
              >
                <div className="w-10 h-10 rounded-[8px] bg-[#D8F0EC] flex items-center justify-center mb-5 text-[#0B6F6C]">
                  {card.icon}
                </div>
                <h3 className="text-[16px] font-semibold text-[#111827] mb-3">
                  {card.title}
                </h3>
                <p className="text-[14px] leading-7 text-[#6B7280] whitespace-pre-line">
                  {card.desc}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 px-4 sm:px-6 md:px-10">
        <h2 className="text-center text-[26px] md:text-[32px] font-semibold text-[#111827] mb-12">
          {t("home.trustedByTitle")}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10 max-w-6xl mx-auto">
          {statsCards.map((card, index) => (
            <div
              key={index}
              className="bg-[#F9FBFB] border border-[#E5EDED] rounded-[10px] px-8 py-6 text-center"
            >
              <div className="w-10 h-10 mx-auto mb-4 rounded-full bg-[#D8F0EC] flex items-center justify-center text-[#0B6F6C]">
                {card.icon}
              </div>
              <h3 className="text-[20px] font-semibold text-[#111827]">
                {card.value}
              </h3>
              <p className="text-[14px] text-[#6B7280] mt-1">{card.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#F5FAFA] px-4 sm:px-5 md:px-8 py-16">
        <h2 className="text-center text-[26px] md:text-[32px] font-semibold text-[#111827] mb-12">
          {t("home.readyTitle")}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {roleCards.map((card, index) => (
            <div
              key={index}
              className="bg-white rounded-[10px] px-5 py-5 border border-[#E3ECEB]"
            >
              <div className="w-10 h-10 rounded-[8px] bg-[#D8F0EC] flex items-center justify-center text-[#0B6F6C] mb-5">
                {card.icon}
              </div>

              <h3 className="text-[18px] font-semibold text-[#111827] mb-5">
                {card.title}
              </h3>

              <p className="text-[15px] leading-8 text-[#5F6B76] mb-5 whitespace-pre-line">
                {card.desc}
              </p>

              <div className="space-y-3 mb-6">
                {card.features.map((feature, featureIndex) => (
                  <div
                    key={featureIndex}
                    className="flex items-center gap-3 text-[15px] text-[#4B5563]"
                  >
                    <Check size={16} className="text-[#0B6F6C] shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleSignUp(card.role)}
                className="block w-full text-center border border-[#0B6F6C] text-[#0B6F6C] rounded-[8px] py-3 text-[15px] font-medium hover:bg-[#EAF6F5] transition"
              >
                {card.button}
              </button>
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-white px-4 sm:px-7 md:px-10 py-10">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-8">
          <div className="max-w-sm">
            <div className="flex items-center gap-3 mb-5">
              <img
                src={footerLogo}
                alt="TeamUp logo"
                className="w-10 h-10 object-contain"
              />
              <h2 className="text-[22px] font-bold text-[#0B6F6C]">TeamUp</h2>
            </div>

            <p className="text-[15px] text-[#6B7280] leading-7 mb-8 lg:mb-14">
              {t("home.footerSlogan")}
            </p>

            <p className="text-[15px] text-[#4B5563]">
              {t("home.footerCopyright")}
            </p>
          </div>

          <div className="flex flex-col gap-8 lg:items-start w-full lg:w-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
              {footerColumns.map((column, index) => (
                <div key={index}>
                  <h3 className="text-[18px] font-bold text-[#111827] mb-5">
                    {column.title}
                  </h3>

                  <div className="flex flex-col gap-3">
                    {column.links.map((link, linkIndex) => (
                      <a
                        key={linkIndex}
                        href="#"
                        className="block text-[15px] text-[#6B7280] hover:text-[#0B6F6C] transition"
                      >
                        {link}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
              {[Mail, Github, Linkedin].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="w-full sm:w-[110px] h-[42px] rounded-[10px] border border-[#E1E7E6] flex items-center justify-center text-[#4B5563] hover:text-[#0B6F6C] hover:border-[#0B6F6C] transition"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;