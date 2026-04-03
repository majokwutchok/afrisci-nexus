import React from "react";

// Icon-only logo URL
export const LOGO_ICON_URL = "https://media.base44.com/images/public/689712620d81bb990dd76bb3/698e59606_generated_image.png";
// Full logotype URL
export const LOGO_FULL_URL = "https://media.base44.com/images/public/689712620d81bb990dd76bb3/6189be205_generated_image.png";

/**
 * AfriSciLogo - renders the AfriSci Nexus brand logo.
 * variant: "icon" | "full" | "header"
 * theme: "light" | "dark"
 */
export default function AfriSciLogo({ variant = "header", theme = "dark", className = "" }) {
  if (variant === "icon") {
    return (
      <img
        src={LOGO_ICON_URL}
        alt="AfriSci Nexus Icon"
        className={`object-contain ${className}`}
        style={{ background: "transparent" }}
      />
    );
  }

  if (variant === "full") {
    return (
      <img
        src={LOGO_FULL_URL}
        alt="AfriSci Nexus"
        className={`object-contain ${className}`}
      />
    );
  }

  // variant === "header" — custom inline layout for nav bar
  return (
    <div className={`flex items-center gap-3 group ${className}`}>
      {/* Animated icon wrapper */}
      <div className="relative flex-shrink-0">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl
                      group-hover:scale-105 transition-transform duration-300 overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #0D9488 0%, #0F766E 60%, #F59E0B 100%)",
            boxShadow: "0 8px 32px rgba(13,148,136,0.45), 0 2px 8px rgba(245,158,11,0.2)"
          }}
        >
          <img src={LOGO_ICON_URL} alt="" className="w-10 h-10 object-contain" />
        </div>
        {/* Gold glow dot */}
        <span
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shadow-lg"
          style={{ background: "linear-gradient(135deg,#F59E0B,#D97706)", color: "#fff", fontSize: 9 }}
        >
          ✦
        </span>
      </div>

      {/* Text block */}
      <div className="leading-tight">
        <div className="flex items-baseline gap-1">
          <span
            className="text-2xl font-extrabold tracking-tight"
            style={{
              background: theme === "dark"
                ? "linear-gradient(90deg,#fff 0%,#7FFFD4 100%)"
                : "linear-gradient(90deg,#0D9488 0%,#0F766E 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}
          >
            AfriSci
          </span>
          <span
            className="text-2xl font-extrabold tracking-tight"
            style={{
              background: "linear-gradient(90deg,#F59E0B,#FBBF24)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}
          >
            Nexus
          </span>
        </div>
        <p className={`text-xs font-semibold tracking-widest uppercase ${
          theme === "dark" ? "text-sky-200/80" : "text-teal-600/70"
        }`}>
          African Scientific Excellence
        </p>
      </div>
    </div>
  );
}