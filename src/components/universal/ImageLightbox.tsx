"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { HiXMark, HiChevronLeft, HiChevronRight } from "react-icons/hi2";

interface ImageLightboxProps {
  isOpen: boolean;
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

export default function ImageLightbox({
  isOpen,
  images,
  initialIndex = 0,
  onClose,
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, initialIndex]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && images.length > 1) {
        handlePrev();
      }
      if (e.key === "ArrowRight" && images.length > 1) {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, currentIndex, images]);

  if (!isOpen || !images || images.length === 0 || !mounted) return null;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm transition-opacity duration-300 select-none"
    >
      {/* Top Controls Bar */}
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="absolute top-0 inset-x-0 flex items-center justify-between p-4 md:p-6 bg-gradient-to-b from-black/70 to-transparent text-white z-10"
      >
        <span className="text-sm font-semibold tracking-wider font-mono bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
          {currentIndex + 1} / {images.length}
        </span>
        <button
          onClick={onClose}
          className="p-2 bg-black/50 hover:bg-black/75 rounded-full transition-all duration-200 cursor-pointer backdrop-blur-md hover:scale-105 active:scale-95 border border-white/10"
          title="Tutup (Esc)"
        >
          <HiXMark className="w-6 h-6" />
        </button>
      </div>

      {/* Main Image Container */}
      <div className="relative flex items-center justify-center w-full h-full px-4 md:px-16 py-20">
        {/* Navigation - Prev Arrow */}
        {images.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-4 md:left-6 p-2.5 bg-black/50 hover:bg-black/75 text-white rounded-full transition-all duration-200 cursor-pointer backdrop-blur-md hover:scale-105 active:scale-95 border border-white/10 z-20"
            title="Sebelumnya"
          >
            <HiChevronLeft className="w-6 h-6 md:w-7 md:h-7" />
          </button>
        )}

        {/* The Enlarge Image container */}
        <div 
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-[95vw] max-h-[85vh] md:max-h-[88vh] flex items-center justify-center transition-all duration-300 z-10"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[currentIndex]}
            alt={`Preview ${currentIndex + 1}`}
            className="max-w-full max-h-[75vh] md:max-h-[82vh] object-contain rounded-xl shadow-2xl border border-white/10 select-none bg-black/20 w-auto h-auto"
          />
        </div>

        {/* Navigation - Next Arrow */}
        {images.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-4 md:right-6 p-2.5 bg-black/50 hover:bg-black/75 text-white rounded-full transition-all duration-200 cursor-pointer backdrop-blur-md hover:scale-105 active:scale-95 border border-white/10 z-20"
            title="Berikutnya"
          >
            <HiChevronRight className="w-6 h-6 md:w-7 md:h-7" />
          </button>
        )}
      </div>

      {/* Thumbnails indicator at the bottom */}
      {images.length > 1 && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-6 flex gap-2 overflow-x-auto max-w-[85vw] px-4 py-2 bg-black/50 rounded-2xl backdrop-blur-md border border-white/10 z-10"
        >
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                currentIndex === idx
                  ? "border-primary-500 scale-105 shadow-md shadow-primary-500/20"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body
  );
}
