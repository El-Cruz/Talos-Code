"use client";

import { useState } from "react";
import { ParticleMonitor } from "./components/webgl/ParticleMonitor";

const tabs = ["LABS", "STUDIO", "OPENINGS", "SHOP"] as const;
type Tab = (typeof tabs)[number];

const projects = [
  { number: "01", name: "NEXUS SYSTEMS", type: "DIGITAL EXPERIENCE", image: "/projects/project1.jpg" },
  { number: "02", name: "AETHER PROTOCOL", type: "CREATIVE TECHNOLOGY", image: "/projects/project2.jpg" },
  { number: "03", name: "ORBITAL FORM", type: "BRAND & INTERFACE", image: "/projects/project3.jpg" },
];

function Header() {
  const [language, setLanguage] = useState<"EN" | "ES-EC">("EN");
  return (
    <header className="pointer-events-auto flex items-start justify-between gap-4 border-b border-white/15 pb-5">
      <a href="#main-content" className="brand text-xs font-bold tracking-[0.12em] sm:text-sm">TALOS:CODE <span className="text-[#8A8A8A]">{"// OMARCHY PROTOCOL"}</span></a>
      <div className="flex items-center gap-4 sm:gap-8">
        <div className="flex items-center gap-2 text-[10px] tracking-wider" aria-label="Language">
          {(["EN", "ES-EC"] as const).map((item, index) => <span key={item} className="flex items-center gap-2">{index > 0 && <span className="text-[#8A8A8A]">/</span>}<button type="button" aria-pressed={language === item} onClick={() => setLanguage(item)} className={language === item ? "text-white" : "text-[#8A8A8A] hover:text-white"}>{item}</button></span>)}
        </div>
        <a href="mailto:hello@taloscode.com" className="project-cta hidden border border-white/40 px-4 py-3 text-[10px] tracking-[0.12em] transition sm:inline-block">START A PROJECT <span aria-hidden="true">↗</span></a>
      </div>
    </header>
  );
}

function Navigation({ activeTab, onChange }: { activeTab: Tab; onChange: (tab: Tab) => void }) {
  return <nav aria-label="Main navigation" className="pointer-events-auto flex flex-wrap gap-x-6 gap-y-3 sm:gap-x-10">{tabs.map((tab) => <button key={tab} type="button" onClick={() => onChange(tab)} aria-current={activeTab === tab ? "page" : undefined} className={`nav-tab relative pb-2 text-[11px] tracking-[0.14em] transition-colors ${activeTab === tab ? "active text-white" : "text-[#8A8A8A] hover:text-white"}`}>{tab}</button>)}</nav>;
}

function ProjectCards() {
  return <div className="project-list pointer-events-auto min-h-0 overflow-y-auto pr-2" aria-label="Selected projects">{projects.map((project) => <article className="glitch-hover project-card group" key={project.number}>
    <div className="project-image" style={{ backgroundImage: `linear-gradient(0deg, rgba(5,9,20,.72), transparent 70%), url(${project.image})` }}><span className="project-index">[ {project.number} ]</span><span className="project-arrow" aria-hidden="true">↗</span></div>
    <div className="flex items-start justify-between gap-2 py-3"><div><h3 className="glitch-title text-xs font-bold tracking-[0.08em]">{project.name}</h3><p className="mt-1 text-[9px] tracking-[0.12em] text-[#8A8A8A]">{project.type}</p></div><span className="text-[9px] text-[#8A8A8A]">{project.number} / 03</span></div>
  </article>)}</div>;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("STUDIO");
  return <main id="main-content" className="h-screen overflow-hidden bg-[#050914] font-mono text-white">
    <div id="webgl-container" className="fixed inset-0 z-0" aria-hidden="true"><ParticleMonitor activeTab={activeTab} /></div>
    <div id="ui-layer" className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-6">
      <Header />
      <div className="interface-body flex min-h-0 flex-1 flex-col pt-7">
        <Navigation activeTab={activeTab} onChange={setActiveTab} />
        <div className="workspace flex min-h-0 flex-1 gap-8 pt-8">
          <section className="project-column flex min-h-0 w-full max-w-[330px] flex-col" aria-labelledby="projects-heading">
            <div className="mb-4 flex items-end justify-between border-b border-white/15 pb-3"><div><p className="mb-2 text-[9px] tracking-[0.2em] text-[#66FFFF]">{"// SELECTED WORK"}</p><h2 id="projects-heading" className="text-sm tracking-[0.08em]">PROJECT ARCHIVE</h2></div><span className="text-[9px] text-[#8A8A8A]">03 ENTRIES</span></div>
            <ProjectCards />
          </section>
          <div className="canvas-label hidden flex-1 items-center justify-center md:flex" aria-hidden="true"><div className="crosshair"><span>+</span></div></div>
        </div>
      </div>
      <footer className="flex items-end justify-between gap-4 border-t border-white/15 pt-4 text-[9px] tracking-[0.13em] text-[#8A8A8A]"><span><span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[#66FFFF]" />SYSTEM ONLINE</span><span className="hidden sm:inline">INDEPENDENT CREATIVE TECHNOLOGY STUDIO</span><span>© TALOS:CODE</span></footer>
    </div>
  </main>;
}


