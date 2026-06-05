"use client";
// components/public/TourGallery.tsx
// Responsive image gallery with lightbox for tour detail page.

import { useState } from "react";

type Props = { images: string[]; title: string };

export default function TourGallery({ images, title }: Props) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  const valid = images.filter(Boolean);
  if (valid.length === 0) return null;

  return (
    <>
      {/* Grid */}
      <div className={`grid gap-3 ${
        valid.length === 1 ? "grid-cols-1" :
        valid.length === 2 ? "grid-cols-2" :
        "grid-cols-2 sm:grid-cols-3"
      }`}>
        {valid.slice(0, 6).map((src, i) => (
          <button
            key={i}
            onClick={() => setLightbox(i)}
            className={`relative overflow-hidden rounded-xl group ${
              i === 0 && valid.length >= 3 ? "sm:col-span-2 sm:row-span-2" : ""
            }`}
            style={{ aspectRatio: i === 0 && valid.length >= 3 ? "16/9" : "4/3" }}
          >
            <img
              src={src}
              alt={`${title} — photo ${i + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {/* More overlay on last visible */}
            {i === 5 && valid.length > 6 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  +{valid.length - 6} more
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl leading-none"
            onClick={() => setLightbox(null)}
          >
            ×
          </button>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-4xl leading-none px-2"
            onClick={(e) => { e.stopPropagation(); setLightbox((lightbox - 1 + valid.length) % valid.length); }}
          >
            ‹
          </button>
          <img
            src={valid[lightbox]}
            alt={`${title} — photo ${lightbox + 1}`}
            className="max-w-full max-h-full object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-4xl leading-none px-2"
            onClick={(e) => { e.stopPropagation(); setLightbox((lightbox + 1) % valid.length); }}
          >
            ›
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {valid.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setLightbox(i); }}
                className={`rounded-full transition-all ${
                  i === lightbox ? "w-5 h-2 bg-amber-400" : "w-2 h-2 bg-white/30 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
          <p className="absolute bottom-4 right-6 text-white/40 text-xs">
            {lightbox + 1} / {valid.length}
          </p>
        </div>
      )}
    </>
  );
}