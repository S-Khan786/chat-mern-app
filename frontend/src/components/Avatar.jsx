import { useState } from "react";

/**
 * Shows a profile image when one is available and loads successfully,
 * otherwise falls back to a neat initials tile so the UI never shows a
 * broken-image icon (e.g. offline demo data, deleted uploads, groups
 * without a custom avatar).
 */
const Avatar = ({ src, name = "?", size = 10, online, className = "" }) => {
  const [broken, setBroken] = useState(false);
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase() || "?";
  const dimension = `${size * 0.25}rem`;

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: dimension, height: dimension }}
    >
      {src && !broken ? (
        <img
          src={src}
          alt=""
          onError={() => setBroken(true)}
          className="h-full w-full rounded-[.65rem] object-cover"
        />
      ) : (
        <span className="avatar-fallback grid h-full w-full place-items-center rounded-[.65rem] text-[0.72em] font-bold">
          {initials}
        </span>
      )}
      {online && (
        <span className="absolute -bottom-0.5 -right-0.5 h-[.6em] w-[.6em] rounded-full border-2 border-[var(--surface-canvas)] bg-emerald-400" />
      )}
    </span>
  );
};

export default Avatar;
