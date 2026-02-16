"use client";

import LandingScene from "@/components/LandingScene";
import { Button } from "@/components/ui/button";
import gsap from "gsap";
import Link from "next/link";
import { useEffect, useRef } from "react";

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(titleRef.current, {
        y: 50,
        opacity: 0,
        duration: 1,
        delay: 0.5,
      })
        .from(
          textRef.current,
          {
            y: 30,
            opacity: 0,
            duration: 1,
          },
          "-=0.5"
        )
        .from(
          buttonRef.current,
          {
            y: 20,
            opacity: 0,
            duration: 0.8,
            scale: 0.9,
          },
          "-=0.5"
        );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <main
      ref={containerRef}
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gray-950 text-white"
    >
      <div className="absolute inset-0 z-0">
        <LandingScene />
      </div>

      <div className="z-10 text-center px-4 max-w-4xl mx-auto">
        <h1
          ref={titleRef}
          className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-400"
        >
          Results at Light Speed
        </h1>

        <p
          ref={textRef}
          className="text-xl md:text-2xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed"
        >
          Experience the next generation of result checking.
          <br />
          Bulk processing, real-time analytics, and instant downloads.
        </p>

        <div ref={buttonRef}>
          <Link href="/bietresult2025">
            <Button
              size="lg"
              className="text-lg px-8 py-6 rounded-full bg-white text-gray-950 hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transform hover:scale-105 active:scale-95 duration-300"
            >
              Check Results Now
            </Button>
          </Link>
        </div>
      </div>

      <div className="absolute bottom-8 text-gray-600 text-sm">
        Built with Next.js 15, Three.js & GSAP
      </div>
    </main>
  );
}
