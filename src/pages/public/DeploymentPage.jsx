import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import teamupLogo from "../../assets/logo/teamup-logo.png";
import { signInWithGoogle, signInWithGitHub, signInWithLinkedIn } from "../../lib/supabaseAuth";

const MotionSpan = motion.span;

const getLaunchDate = () => {
  const now = new Date();
  let launch = new Date(now.getFullYear(), 4, 20, 0, 0, 0);
  if (launch <= now) {
    launch = new Date(now.getFullYear() + 1, 4, 20, 0, 0, 0);
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
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const closeModal = useCallback(() => setIsJoinOpen(false), []);

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
          Launching May 20th
        </p>

        {/* CTA Button */}
        <button
          type="button"
          onClick={() => setIsJoinOpen(true)}
          className="rounded-full bg-gradient-to-r from-teal-600 to-teal-500 px-10 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-900/30 transition hover:from-teal-500 hover:to-teal-400 hover:shadow-teal-800/40 active:scale-[0.97] cursor-pointer"
        >
          Join TeamUP
        </button>

        {/* Footer */}
        <p className="mt-12 text-xs text-gray-600">
          © {new Date().getFullYear()} TeamUP. All rights reserved.
        </p>
      </div>

      {/* Join Modal */}
      <AnimatePresence>
        {isJoinOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={closeModal}
            />

            {/* Card */}
            <motion.div
              className="relative z-10 w-full max-w-sm rounded-2xl border border-gray-700/50 bg-gray-900/95 p-6 shadow-2xl sm:p-8"
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close */}
              <button
                type="button"
                onClick={closeModal}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-800 hover:text-white cursor-pointer"
                aria-label="Close"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Header */}
              <div className="mb-6 text-center">
                <div className="mb-3 flex items-center justify-center gap-2">
                  <img src={teamupLogo} alt="TeamUp" className="h-8 w-8 object-contain" />
                  <h2 className="text-xl font-bold text-white">Join TeamUP</h2>
                </div>
                <p className="text-sm text-gray-400">Continue with your preferred account</p>
              </div>

              {/* OAuth Buttons */}
              <div className="space-y-3">
                {/* Google */}
                <button
                  type="button"
                  onClick={() => signInWithGoogle("client")}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-700 bg-gray-800/70 px-4 py-3 text-sm font-medium text-white transition hover:border-gray-600 hover:bg-gray-800 cursor-pointer"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                    <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.29h6.44a5.5 5.5 0 0 1-2.39 3.61v3h3.87c2.26-2.08 3.57-5.15 3.57-8.63Z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.87-3c-1.07.72-2.44 1.15-4.08 1.15-3.14 0-5.8-2.12-6.75-4.97H1.25v3.12A12 12 0 0 0 12 24Z" />
                    <path fill="#FBBC05" d="M5.25 14.28A7.2 7.2 0 0 1 4.88 12c0-.79.14-1.56.37-2.28V6.6H1.25A12 12 0 0 0 0 12c0 1.93.46 3.76 1.25 5.4l4-3.12Z" />
                    <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.61 4.58 1.8l3.43-3.43C17.95 1.11 15.23 0 12 0A12 12 0 0 0 1.25 6.6l4 3.12c.95-2.85 3.61-4.97 6.75-4.97Z" />
                  </svg>
                  Continue with Google
                </button>

                {/* GitHub */}
                <button
                  type="button"
                  onClick={() => signInWithGitHub("client")}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-700 bg-gray-800/70 px-4 py-3 text-sm font-medium text-white transition hover:border-gray-600 hover:bg-gray-800 cursor-pointer"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white" aria-hidden="true">
                    <path d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.02c-3.34.73-4.04-1.41-4.04-1.41-.55-1.38-1.33-1.74-1.33-1.74-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.23 1.84 1.23 1.08 1.83 2.83 1.3 3.52 1 .1-.77.42-1.3.76-1.6-2.67-.3-5.47-1.32-5.47-5.9 0-1.3.47-2.36 1.23-3.2-.12-.3-.53-1.5.12-3.13 0 0 1-.32 3.3 1.22A11.5 11.5 0 0 1 12 6.3c1.02 0 2.04.14 3 .4 2.29-1.54 3.29-1.22 3.29-1.22.65 1.63.24 2.83.12 3.13.77.84 1.23 1.9 1.23 3.2 0 4.6-2.8 5.6-5.48 5.9.43.37.82 1.1.82 2.22v3.3c0 .32.22.7.83.58A12 12 0 0 0 12 .5Z" />
                  </svg>
                  Continue with GitHub
                </button>

                {/* LinkedIn */}
                <button
                  type="button"
                  onClick={() => signInWithLinkedIn("client")}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-700 bg-gray-800/70 px-4 py-3 text-sm font-medium text-white transition hover:border-gray-600 hover:bg-gray-800 cursor-pointer"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                    <path fill="#0A66C2" d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43A2.06 2.06 0 1 1 5.34 3.3a2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77A1.75 1.75 0 0 0 0 1.73v20.54A1.75 1.75 0 0 0 1.77 24h20.45A1.75 1.75 0 0 0 24 22.27V1.73A1.75 1.75 0 0 0 22.22 0Z" />
                  </svg>
                  Continue with LinkedIn
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default DeploymentPage;
