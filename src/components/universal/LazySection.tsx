"use client";

import React, { useState, useEffect, useRef } from "react";

interface LazySectionProps {
  children: React.ReactNode;
  /**
   * Estimated height of the section to prevent layout shift before loading.
   * e.g. "min-h-[400px]" or a height in pixels.
   */
  placeholderHeight?: string;
  className?: string;
  /**
   * Margin around the root. e.g. "200px" means load 200px before the element enters the viewport.
   */
  rootMargin?: string;
}

export default function LazySection({
  children,
  placeholderHeight = "300px",
  className = "",
  rootMargin = "200px",
}: LazySectionProps) {
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isInView) return;

    // Check if IntersectionObserver is supported
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      {
        rootMargin,
      }
    );

    const currentElement = containerRef.current;
    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, [isInView, rootMargin]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={!isInView ? { minHeight: placeholderHeight } : undefined}
    >
      {isInView ? children : null}
    </div>
  );
}
