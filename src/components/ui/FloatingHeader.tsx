"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { sectionIds, type Dictionary, type SectionId } from "../../content/dictionary";

export function FloatingHeader({ t }: { t: Dictionary }) {
  const [active, setActive] = useState<SectionId | null>(null);
  const [hidden, setHidden] = useState(false);
  const [compact, setCompact] = useState(false);
  const nav = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    let previous = window.scrollY;
    let travel = 0;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = Math.max(0, window.scrollY);
      const delta = y - previous;
      travel = Math.sign(delta) === Math.sign(travel) ? travel + delta : delta;
      previous = y;
      setCompact(y > 64);
      if (y <= 64 || travel < -12) setHidden(false);
      else if (travel > 24) setHidden(true);
      const clearance = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) + 2;
      let current: SectionId | null = null;
      for (const id of sectionIds) {
        if ((document.getElementById(id)?.getBoundingClientRect().top ?? Infinity) <= clearance) current = id;
      }
      setActive(current);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); };
  }, []);

  const revealLink = (link: HTMLElement) => {
    const container = nav.current;
    if (!container) return;
    const box = link.getBoundingClientRect();
    const bounds = container.getBoundingClientRect();
    if (box.left < bounds.left + 8) container.scrollLeft += box.left - bounds.left - 8;
    else if (box.right > bounds.right - 8) container.scrollLeft += box.right - bounds.right + 8;
  };

  useEffect(() => {
    const link = nav.current?.querySelector<HTMLElement>(`a[href="#${active}"]`);
    if (link) revealLink(link);
  }, [active, t]);

  return (
    <motion.header layoutRoot className="floating-header" data-hidden={hidden && !reduced} data-compact={compact}>
      <div className="floating-bar">
        <motion.nav layoutScroll ref={nav} aria-label={t.header.navLabel} className="floating-links" onFocusCapture={(event) => revealLink(event.target as HTMLElement)}>
          {sectionIds.map(id => (
            <a key={id} href={`#${id}`} aria-current={active === id ? "location" : undefined}>
              {active === id && <motion.span aria-hidden="true" layoutId="nav-indicator" className="nav-indicator" transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 34 }} />}
              <span className="relative">{t.header.nav[id]}</span>
            </a>
          ))}
        </motion.nav>
        <a href="#contact" className="nav-contact rounded-full border border-white/20 px-4 py-3 text-sm hover:border-beam hover:text-beam">{t.header.cta}</a>
      </div>
    </motion.header>
  );
}
