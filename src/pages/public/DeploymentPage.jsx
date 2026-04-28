import { useState, useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import teamupLogo from "../../assets/logo/teamup-logo.png";

const MotionSpan = motion.span;

const getLaunchDate = () => {
  const now = new Date();
  let launch = new Date(now.getFullYear(), 7, 1, 0, 0, 0);
  if (launch <= now) {
    launch = new Date(now.getFullYear() + 1, 7, 1, 0, 0, 0);
  }
  return launch;
};

const getTimeLeft = () => {
  const difference = getLaunchDate().getTime() - new Date().getTime();
  if (difference <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
};

function RollingDigit({ digit }) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <span className="inline-block w-[0.62em] text-center tabular-nums">
        {digit}
      </span>
    );
  }

  return (
    <span className="relative inline-block h-[1em] w-[0.62em] overflow-hidden text-center tabular-nums">
      <AnimatePresence mode="wait" initial={false}>
        <MotionSpan
          key={digit}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {digit}
        </MotionSpan>
      </AnimatePresence>
    </span>
  );
}

function RollingNumber({ value, minDigits = 2 }) {
  const paddedValue = String(value).padStart(minDigits, "0");
  return (
    <span className="inline-flex items-center tabular-nums">
      {paddedValue.split("").map((digit, index) => (
        <RollingDigit key={index} digit={digit} />
      ))}
    </span>
  );
}

function CountdownUnit({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-800/80 text-3xl font-light text-white shadow-lg backdrop-blur-sm sm:h-24 sm:w-24 sm:text-4xl">
        <RollingNumber value={value} />
      </div>
      <span className="mt-2 text-xs uppercase tracking-widest text-gray-400">
        {label}
      </span>
    </div>
  );
}

function DeploymentPage() {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0f172a] px-4">
      {/* Subtle gradient background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]" />
      <div className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-900/30 via-transparent to-transparent" />

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-3">
          <img
            src={teamupLogo}
            alt="TeamUp Logo"
            className="h-12 w-12 object-contain"
          />
          <h1 className="text-4xl font-bold text-white sm:text-5xl">TeamUP</h1>
        </div>

        {/* Status */}
        <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-teal-400">
          Under Deployment
        </p>

        {/* Description */}
        <p className="mb-10 max-w-md text-gray-400">
          We're preparing something great. The platform will be available soon.
        </p>

        {/* Countdown */}
        <div className="mb-10 flex gap-3 sm:gap-4">
          <CountdownUnit value={timeLeft.days} label="Days" />
          <CountdownUnit value={timeLeft.hours} label="Hours" />
          <CountdownUnit value={timeLeft.minutes} label="Minutes" />
          <CountdownUnit value={timeLeft.seconds} label="Seconds" />
        </div>

        {/* Launch Date */}
        <p className="mb-8 text-xs uppercase tracking-widest text-gray-500">
          Launching August 1st
        </p>

        {/* CTA Button */}
        <button
          type="button"
          disabled
          className="rounded-full bg-gradient-to-r from-teal-600 to-teal-500 px-10 py-3 text-sm font-semibold text-white opacity-60 shadow-lg shadow-teal-900/20 cursor-not-allowed"
        >
          Launching Soon
        </button>

        {/* Footer */}
        <p className="mt-12 text-xs text-gray-600">
          © {new Date().getFullYear()} TeamUP. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default DeploymentPage;
