"use client";

import { useEffect, useState } from "react";

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setVisible(window.scrollY > 500));
    };
    window.addEventListener("scroll", update, { passive: true });
    frame = requestAnimationFrame(update);
    return () => {
      window.removeEventListener("scroll", update);
      cancelAnimationFrame(frame);
    };
  }, []);

  return <button
    type="button"
    aria-label="Voltar ao topo"
    title="Voltar ao topo"
    tabIndex={visible ? 0 : -1}
    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    className={`fixed bottom-5 right-5 z-50 grid size-12 place-items-center rounded-full border border-[#1473f3]/40 bg-[#0d1a2d]/95 text-[#69a7ff] shadow-[0_12px_35px_rgba(0,0,0,.35)] backdrop-blur transition duration-200 hover:-translate-y-1 hover:border-[#69a7ff] hover:bg-[#1473f3] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#69a7ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08111f] motion-reduce:transition-none sm:bottom-7 sm:right-7 ${visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"}`}
  >
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-5" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 15 6-6 6 6" />
    </svg>
  </button>;
}
