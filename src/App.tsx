"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { ParticleMonitor } from "./components/webgl/ParticleMonitor";
import { useHeroReveal } from "./hooks/useHeroReveal";

import { tabs, tabTarget, type Tab } from "./components/webgl/tabMorph";
const subscribeMobile = (notify: () => void) => {
  const query=window.matchMedia("(max-width: 767px)"); query.addEventListener("change",notify);
  return () => query.removeEventListener("change",notify);
};
const getMobile = () => window.matchMedia("(max-width: 767px)").matches;

const projects = [
  { name: "Nexus Systems", stack: "Next.js / Go / PostgreSQL" },
  { name: "Aether Protocol", stack: "React / TypeScript / WebGL" },
  { name: "Orbital Form", stack: "Next.js / Node.js / Redis" },
];

function Header({ onContact }: { onContact: () => void }) {
  const [language, setLanguage] = useState<"EN" | "ES-EC">("EN");
  return (
    <header className="pointer-events-auto flex items-start justify-between gap-4 border-b border-white/15 pb-5">
      <a href="#main-content" className="brand text-xs font-bold tracking-[0.12em] sm:text-sm">TALOS:CODE <span className="text-[#8A8A8A]">{"// OMARCHY PROTOCOL"}</span></a>
      <div className="flex items-center gap-4 sm:gap-8">
        <div className="flex items-center gap-2 text-[10px] tracking-wider" aria-label="Language">
          {(["EN", "ES-EC"] as const).map((item, index) => <span key={item} className="flex items-center gap-2">{index > 0 && <span className="text-[#8A8A8A]">/</span>}<button type="button" aria-pressed={language === item} onClick={() => setLanguage(item)} className={language === item ? "text-white" : "text-[#8A8A8A] hover:text-white"}>{item}</button></span>)}
        </div>
        <button type="button" onClick={onContact} className="project-cta hidden border border-white/40 px-4 py-3 text-[10px] tracking-[0.12em] transition sm:inline-block">START A PROJECT <span aria-hidden="true">↗</span></button>
      </div>
    </header>
  );
}

function Navigation({ activeTab, onChange }: { activeTab: Tab; onChange: (tab: Tab) => void }) {
  return <nav role="tablist" aria-label="Main navigation" className="pointer-events-auto flex flex-wrap gap-x-6 gap-y-3 sm:gap-x-10">{tabs.map((tab,index) => <button key={tab} id={`tab-${tab}`} role="tab" aria-controls="tab-content" aria-selected={activeTab===tab} tabIndex={activeTab===tab ? 0 : -1} type="button" onClick={() => onChange(tab)} onKeyDown={event => {
    if (!["ArrowRight","ArrowLeft","Home","End"].includes(event.key)) return;
    event.preventDefault();
    const next = event.key==="Home" ? 0 : event.key==="End" ? tabs.length-1 : (index+(event.key==="ArrowRight" ? 1 : -1)+tabs.length)%tabs.length;
    onChange(tabs[next]);document.getElementById(`tab-${tabs[next]}`)?.focus();
  }} className={`nav-tab relative pb-2 text-[11px] tracking-[0.14em] transition-colors ${activeTab === tab ? "active text-white" : "text-[#8A8A8A] hover:text-white"}`}>{tab}</button>)}</nav>;
}

function TabContent({ activeTab, onChange }: { activeTab: Tab; onChange: (tab: Tab) => void }) {
  switch (activeTab) {
    case "SYSTEM":
      return (
        <section aria-labelledby="system-heading" className="mt-0 mb-auto w-full max-w-2xl py-2 md:my-auto md:w-1/2 md:py-6">
          <p className="mb-6 text-[10px] leading-relaxed tracking-[0.12em] text-[#8A8A8A]">
            {"TALOS CORE // OMARCHY PROTOCOL -> A.R.I.A "}
            <span className="text-[#66FFFF] [text-shadow:0_0_12px_#66FFFF]">ACTIVE</span>
          </p>
          <h1 id="system-heading" className="text-[clamp(2rem,4.6vw,5rem)] font-bold leading-[1.08] tracking-[-0.06em]">Software engineered to outlast the grid.</h1>
          <button type="button" onClick={() => onChange("TERMINAL")} className="project-cta pointer-events-auto mt-8 border border-white/50 px-6 py-4 text-xs tracking-[0.12em] transition-colors hover:border-[#66FFFF] hover:text-[#66FFFF]">[ INITIATE SEQUENCE ]</button>
        </section>
      );
    case "ARCHIVE":
      return (
        <section aria-labelledby="archive-heading" tabIndex={0} className="project-list pointer-events-auto min-h-0 w-full overflow-y-auto overscroll-contain pr-2 pb-6 md:w-1/3">
          <p className="mb-2 text-[10px] tracking-[0.2em] text-[#66FFFF]">{"// SELECTED WORK"}</p>
          <h1 id="archive-heading" className="mb-6 text-sm tracking-[0.12em]">PROJECT ARCHIVE</h1>
          {projects.map(project => (
            <article key={project.name} className="glitch-hover mb-8">
              <h2 className="glitch-title text-sm font-bold tracking-wide">{project.name}</h2>
              <p className="mt-2 mb-3 text-[11px] leading-relaxed text-[#8A8A8A]">{project.stack}</p>
              <div aria-hidden="true" className="glitch-hover project-image aspect-video w-full" style={{ height: "auto" }} />
            </article>
          ))}
        </section>
      );
    case "CORE":
      return (
        <section aria-labelledby="core-heading" className="project-list pointer-events-auto my-auto min-h-0 w-full overflow-y-auto py-6 md:ml-auto md:w-1/3">
          <p className="mb-2 text-[10px] tracking-[0.2em] text-[#FF6600]">{"// ENGINEERING PHILOSOPHY"}</p>
          <h1 id="core-heading" className="mb-6 text-sm tracking-[0.12em]">THE TALOS CORE</h1>
          <div className="space-y-6 text-justify text-sm leading-relaxed text-[#8A8A8A]">
            <p>We work with <strong className="font-normal text-white">extreme technical rigor</strong>: clear contracts, deliberate tradeoffs, and systems that can be understood from the inside out. Our approach combines <strong className="font-normal text-white">modular architecture</strong> with the focus and control of the <strong className="font-normal text-white">Omarchy ecosystem</strong>.</p>
            <p>For <strong className="font-normal text-white">founders and enterprises</strong>, we build products that can grow without becoming a maintenance burden. We favor explicit boundaries, useful documentation, and testable decisions to deliver <strong className="font-normal text-white">scalable, maintainable software</strong> that teams can confidently own and evolve.</p>
          </div>
        </section>
      );
    case "TERMINAL":
      return (
        <section aria-labelledby="terminal-heading" className="project-list pointer-events-auto fixed top-[32%] left-1/2 max-h-[18vh] w-[58vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto border border-[#1A2C4C] bg-[#0A1128]/95 p-2 md:top-1/2 md:max-h-[40vh] md:w-[70vw] md:p-5">
          <h1 id="terminal-heading" className="mb-2 border-b border-[#1A2C4C] pb-1 text-[8px] tracking-[0.15em] text-[#8A8A8A] md:mb-6 md:pb-3 md:text-[10px]">TALOS:CODE — CONTACT TERMINAL</h1>
          <p className="break-all text-[9px] leading-relaxed text-[#66FFFF] md:text-xs">{"> talos_deploy --target=production"}</p>
          <label htmlFor="contact-email" className="mt-2 block text-[9px] leading-relaxed md:mt-5 md:text-xs">{"> Enter contact protocol (email): "}</label>
          <div className="mt-2 flex items-center gap-3 text-[10px] md:mt-3 md:text-sm">
            <span aria-hidden="true" className="text-[#FF6600]">&gt;</span>
            <input id="contact-email" name="email" type="email" autoComplete="email" spellCheck={false} placeholder="you@company.com" className="min-w-0 flex-1 border-0 border-b border-transparent bg-transparent py-2 font-mono text-white caret-[#66FFFF] outline-none placeholder:text-[#8A8A8A] focus:border-[#66FFFF]" />
          </div>
        </section>
      );
  }
}

export default function App() {
  const [uiReady, setUiReady] = useState(false);
  const [titleRevealed, setTitleRevealed] = useState(false);
  const heroReady = useHeroReveal(uiReady, titleRevealed);
  const [navigation, setNavigation] = useState({ tab: "SYSTEM" as Tab, id: 0 });
  const [completedId, setCompletedId] = useState<number | null>(null);
  const mobile = useSyncExternalStore(subscribeMobile,getMobile,()=>false);
  const request = useMemo(() => ({ tab: navigation.tab, id: navigation.id*2+(mobile ? 1 : 0), target: tabTarget(navigation.tab,mobile) }),[navigation,mobile]);
  const activeTab = navigation.tab;
  const isMorphComplete = uiReady && completedId === request.id;
  const setActiveTab = (tab: Tab) => setNavigation(previous => previous.tab===tab ? previous : {tab,id:previous.id+1});
  return <main id="main-content" className="h-screen overflow-hidden bg-[#050914] font-mono text-white">
    <div id="webgl-container" className="fixed inset-x-0 top-[max(8rem,15%)] bottom-[53%] z-0 md:inset-0" aria-hidden="true"><ParticleMonitor request={request} onMorphComplete={setCompletedId} heroReady={heroReady} onReady={() => setUiReady(true)} /></div>
    <div id="ui-layer" inert={!uiReady} aria-hidden={!uiReady} onTransitionEnd={event => {
      if (event.target === event.currentTarget && event.propertyName === "opacity" && uiReady) setTitleRevealed(true);
    }} style={{ opacity: uiReady ? 1 : 0 }} className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-6 transition-opacity duration-600 motion-reduce:transition-none">
      <Header onContact={() => setActiveTab("TERMINAL")} />
      <div className="interface-body flex min-h-0 flex-1 flex-col pt-7">
        <Navigation activeTab={activeTab} onChange={setActiveTab} />
        <div id="tab-content" role="tabpanel" aria-labelledby={`tab-${activeTab}`} aria-busy={!isMorphComplete} className="project-list absolute inset-x-6 top-[50%] bottom-16 flex min-h-0 flex-col overflow-y-auto md:static md:flex-1 md:pt-8">
          {isMorphComplete && <div key={request.id} className="flex min-h-0 flex-1 flex-col"><TabContent activeTab={activeTab} onChange={setActiveTab} /></div>}
        </div>
      </div>
      <footer className="flex items-end justify-between gap-4 border-t border-white/15 pt-4 text-[9px] tracking-[0.13em] text-[#8A8A8A]"><span><span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[#66FFFF]" />SYSTEM ONLINE</span><span className="hidden sm:inline">INDEPENDENT CREATIVE TECHNOLOGY STUDIO</span><span>© TALOS:CODE</span></footer>
    </div>
  </main>;
}


