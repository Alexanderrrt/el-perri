"use client";
import { useEffect } from "react";

const IconPlay = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <polygon points="6 4 20 12 6 20 6 4" />
  </svg>
);
const IconInstagram = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export function InstagramReels({ reels = [], profile, handle = "@elperri.food" }) {
  const hasReels = reels.length > 0;

  // Load Instagram's official embed script and (re)process embeds.
  useEffect(() => {
    if (!hasReels) return;
    const process = () => window.instgrm?.Embeds?.process();
    if (window.instgrm?.Embeds) {
      process();
      return;
    }
    const existing = document.getElementById("ig-embed-js");
    if (existing) {
      existing.addEventListener("load", process);
      return () => existing.removeEventListener("load", process);
    }
    const s = document.createElement("script");
    s.id = "ig-embed-js";
    s.src = "https://www.instagram.com/embed.js";
    s.async = true;
    s.onload = process;
    document.body.appendChild(s);
  }, [hasReels, reels]);

  if (hasReels) {
    return (
      <div className="reels-embeds">
        {reels.map((url) => (
          <blockquote
            key={url}
            className="instagram-media"
            data-instgrm-permalink={url}
            data-instgrm-version="14"
          />
        ))}
      </div>
    );
  }

  // Fallback preview — shows until real reel permalinks are added to REELS.
  return (
    <div className="reels-grid">
      {[0, 1, 2, 3].map((i) => (
        <a
          key={i}
          className="reel-tile"
          href={profile}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Ver reels de ${handle} en Instagram`}
        >
          <span className="reel-play"><IconPlay /></span>
          <span className="reel-tag"><IconInstagram /> {handle}</span>
        </a>
      ))}
    </div>
  );
}
