import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supportedLanguages, applyLanguageSettings } from "../../i18n";
import { GlobeAltIcon, XMarkIcon } from "@heroicons/react/24/outline";

function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLanguage = supportedLanguages[i18n.language]
    ? i18n.language
    : "en";

  const handleChangeLanguage = (language) => {
    i18n.changeLanguage(language);
    applyLanguageSettings(language);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100"
        aria-label="Select language"
      >
        <GlobeAltIcon className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="absolute end-0 top-full z-50 mt-3 w-[360px] overflow-hidden rounded-[14px] border border-gray-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.18)] dark:border-gray-600">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-4">
            <h3 className="text-sm font-semibold text-[#111827]">
              {t("common.language")}
            </h3>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 text-[#94A3B8] transition hover:bg-[#F1F5F9] hover:text-[#0B6B63]"
              aria-label="Close"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Language List */}
          <div>
            {Object.entries(supportedLanguages).map(([code, lang], index, arr) => (
              <button
                key={code}
                type="button"
                onClick={() => handleChangeLanguage(code)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-start transition ${
                  index !== arr.length - 1 ? "border-b border-[#EAF2F2]" : ""
                } ${
                  code === currentLanguage
                    ? "bg-[#EAF7F6]"
                    : "hover:bg-[#EAF7F6]"
                }`}
              >
                {/* Teal Circle with Language Code */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#D9EFEF] text-[#0B6B63]">
                  <span className="text-[11px] font-bold">{code.toUpperCase()}</span>
                </div>

                {/* Language Labels */}
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#111827]">
                    {lang.nativeLabel}
                  </p>
                  <p className="mt-0.5 text-xs text-[#64748B]">
                    {lang.label}
                  </p>
                </div>

                {/* Selected Indicator Dot */}
                {code === currentLanguage && (
                  <span className="ms-auto h-2 w-2 rounded-full bg-[#0B6B63]" />
                )}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="bg-[#F8FAFC] px-4 py-3 text-center text-xs text-[#94A3B8]">
            {t("common.language")}: {supportedLanguages[currentLanguage]?.nativeLabel}
          </div>
        </div>
      )}
    </div>
  );
}

export default LanguageSwitcher;
