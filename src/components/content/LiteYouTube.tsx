"use client";

import { useState } from "react";

/**
 * Lite YouTube embed — loads only a thumbnail until the user clicks play,
 * then swaps in the real iframe. Keeps the site fast and respects autoplay rules.
 */
export default function LiteYouTube({ id, title }: { id: string; title: string }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="overflow-hidden border-[1.5px] border-ink-900 bg-ink-900">
      <div className="relative aspect-video w-full">
        {playing ? (
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 h-full w-full cursor-pointer"
            aria-label={`Play video: ${title}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
              alt={`Video thumbnail — ${title}`}
              className="h-full w-full object-cover opacity-80 transition group-hover:opacity-100"
              loading="lazy"
            />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-14 w-20 items-center justify-center border-[1.5px] border-paper-100 bg-ink-900/75 transition group-hover:bg-signal">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff" aria-hidden>
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </span>
          </button>
        )}
      </div>
      <div className="flex items-center justify-between bg-paper-100 px-3 py-2">
        <span className="label">Project video</span>
        <a
          href={`https://youtu.be/${id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="readout text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-signal hover:underline"
        >
          Watch on YouTube ↗
        </a>
      </div>
    </div>
  );
}
