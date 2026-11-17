"use client";

import { useEffect, useState } from "react";
import { MotionConfig, motion, type Variants } from "motion/react";
import { ParticleField } from "./components/background/ParticleField";
import { HudLayer } from "./components/motion/HudLayer";
import { HudFrame } from "./components/ui/HudFrame";
import { ServiceExplorer } from "./components/services/ServiceExplorer";
import { TeamCarousel } from "./components/about/TeamCarousel";
import { VideoFaq } from "./components/faq/VideoFaq";
import { Closing } from "./components/closing/Closing";
import { SmoothScroll } from "./components/motion/SmoothScroll";
import { Reveal, LineReveal } from "./components/motion/Reveal";
import { FloatingHeader } from "./components/ui/FloatingHeader";
import { Parallax } from "./components/motion/Parallax";
import { EASE, VIEWPORT } from "./components/motion/motion";
import { defaultLocale, dictionaries, localeLabels, locales, projectMeta, sectionIds, type Dictionary, type Locale, type SectionId } from "./content/dictionary";
import { teamMembers } from "./content/team";

const shell = "mx-auto w-full max-w-[88rem] px-6 sm:px-10";
const sectionHeading = "font-display text-[clamp(3rem,7vw,6.5rem)] font-extrabold uppercase leading-[0.86] tracking-[-0.02em] text-ivory";
const meta = "font-mono text-[11px] uppercase tracking-[0.22em]";
const pad = (n: number) => String(n).padStart(2, "0");
const idx = (id: SectionId) => pad(sectionIds.indexOf(id) + 1);

const projectImageMotion: Variants = {
  before: { x: "var(--project-enter-x, 0px)", y: 24, scale: 0.97 },
  visible: { x: 0, y: 0, scale: 1, transition: { duration: 0.75, ease: EASE } },
};

const projectTextMotion: Variants = {
  before: { y: 20 },
  visible: { y: 0, transition: { duration: 0.7, delay: 0.14, ease: EASE } },
};

/** Chapter frame: full-bleed hairline + index rail on the left. */
function Chapter({ id, headingId, index, children }: { id: SectionId; headingId: string; index: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={headingId} className="relative border-t border-white/10">
      <div className={`${shell} grid gap-x-10 py-24 sm:py-32 lg:grid-cols-[5rem_1fr]`}>
        <div className="mb-8 lg:mb-0">
          <div className="lg:sticky lg:top-28">
            <p className={`${meta} text-beam`}>[{index}]</p>
            <span aria-hidden="true" className="mt-3 block h-px w-10 bg-beam/60 lg:h-16 lg:w-px" />
          </div>
        </div>
        <div>{children}</div>
      </div>
    </section>
  );
}

function Hero({ t }: { t: Dictionary }) {
  return (
    <section aria-labelledby="hero-heading" className="relative pt-40 pb-16 sm:pt-48 sm:pb-24 lg:flex lg:min-h-[85svh] lg:items-center lg:pt-40">
      <div className={shell + " grid items-end gap-6 lg:grid-cols-[1.2fr_1fr] lg:gap-16"}>
        <h1 id="hero-heading" className="font-display text-[clamp(4rem,10vw,10rem)] font-extrabold uppercase leading-[0.88] tracking-[-0.02em] text-ivory">
          {t.hero.headline.map((line, index) => <LineReveal key={line} delay={0.1 + index * 0.12}>{line}</LineReveal>)}
        </h1>
        <motion.div initial={{ y: 18 }} animate={{ y: 0 }} transition={{ duration: 0.65, delay: 0.25, ease: EASE }} className="hero-panel max-w-lg border-l border-beam/40 py-1 pl-5 motion-reduce:transform-none! sm:pl-6">
          <p className="max-w-[40ch] text-base leading-relaxed text-steel sm:text-lg">{t.hero.lead}</p>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4">
            <a href="#contact" className="hero-cta"><span>{t.hero.primaryCta}<span aria-hidden="true">↗</span></span></a>
            <a href="#work" className="border-b border-white/30 py-2 text-sm text-ivory transition-colors hover:border-beam hover:text-beam">{t.hero.secondaryCta}</a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Services({ t }: { t: Dictionary }) {
  return (
    <Chapter id="services" headingId="services-heading" index={idx("services")}>
      <div className="grid gap-x-10 gap-y-6 lg:grid-cols-12 lg:items-end">
        <Reveal className="lg:col-span-7"><h2 id="services-heading" className={sectionHeading}>{t.services.heading}</h2></Reveal>
        <Reveal delay={0.1} className="lg:col-span-4 lg:col-start-9"><p className="text-sm leading-relaxed text-steel">{t.services.lead}</p></Reveal>
      </div>
      <ServiceExplorer t={t.services} />
    </Chapter>
  );
}

function Work({ t }: { t: Dictionary }) {
  const projects = t.work.projects.filter((project) => projectMeta[project.id].published);
  return (
    <Chapter id="work" headingId="work-heading" index={idx("work")}>
      <Reveal><h2 id="work-heading" className={sectionHeading}>{t.work.heading}</h2></Reveal>
      <div className="mt-16 space-y-24">
        {projects.map((project, i) => {
          const { url, image } = projectMeta[project.id];
          const imageOnRight = i % 2 === 1;
          return (
            <motion.article key={project.id} initial="before" whileInView="visible" viewport={VIEWPORT} className="grid items-end gap-x-10 gap-y-8 lg:grid-cols-12">
              <motion.div
                variants={projectImageMotion}
                data-side={imageOnRight ? "right" : "left"}
                className={`project-visual relative aspect-video overflow-hidden border border-white/10 motion-reduce:transform-none! lg:col-span-8 lg:row-start-1 ${imageOnRight ? "lg:col-start-5" : "lg:col-start-1"}`}
              >
                <Parallax range={7} className="absolute inset-[-8%]">
                  <div className="h-full w-full bg-surface bg-cover bg-center" style={image ? { backgroundImage: `url(${image})` } : undefined} role={image ? "img" : undefined} aria-label={image ? project.name : undefined} />
                </Parallax>
                <span aria-hidden="true" className={`${meta} absolute bottom-4 left-6 text-beam`}>[{pad(i + 1)}]</span>
                <span aria-hidden="true" className="hud-c tl" /><span aria-hidden="true" className="hud-c br" />
              </motion.div>
              <motion.div
                variants={projectTextMotion}
                className={`motion-reduce:transform-none! lg:col-span-4 lg:row-start-1 ${imageOnRight ? "lg:col-start-1" : "lg:col-start-9"}`}
              >
                <p className={`${meta} text-beam`}>{project.category}</p>
                <h3 className="mt-4 font-display text-5xl font-bold uppercase leading-[0.9] tracking-[-0.015em] text-ivory sm:text-6xl">{project.name}</h3>
                <p className="mt-5 text-sm leading-relaxed text-steel">{project.description}</p>
                {url && <a href={url} target="_blank" rel="noopener noreferrer" className="mt-8 inline-block border-b border-white/30 pb-1 text-sm text-ivory transition-colors hover:border-beam hover:text-beam">{t.work.visit} <span aria-hidden="true">↗</span></a>}
              </motion.div>
            </motion.article>
          );
        })}
      </div>
    </Chapter>
  );
}

function About({ t }: { t: Dictionary }) {
  return (
    <Chapter id="about" headingId="about-heading" index={idx("about")}>
      <Reveal><h2 id="about-heading" className={sectionHeading}>{t.about.heading}</h2></Reveal>
      <div className="relative mt-12 min-w-0 pt-6 sm:mt-16">
        <motion.span aria-hidden="true" initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={VIEWPORT} transition={{ duration: 0.75, ease: EASE }} className="absolute inset-x-0 top-0 h-px origin-left bg-gradient-to-r from-beam/60 to-transparent motion-reduce:transform-none!" />
        <TeamCarousel members={teamMembers} t={t.about} />
      </div>
    </Chapter>
  );
}

function Contact({ t }: { t: Dictionary }) {
  return (
    <Chapter id="contact" headingId="contact-heading" index={idx("contact")}>
      <div className="grid gap-x-10 gap-y-12 lg:grid-cols-12">
        <Reveal className="lg:col-span-7">
          <h2 id="contact-heading" className={sectionHeading}>{t.contact.heading}</h2>
          <p className="mt-6 max-w-[44ch] text-sm leading-relaxed text-steel">{t.contact.lead}</p>
        </Reveal>
        <Reveal distance={28} delay={0.1} className="self-end lg:col-span-5">
          <HudFrame tag="SYS // 04" className="px-5 pb-10 pt-11 sm:px-7">
            <p className={`${meta} border-b border-white/10 pb-3 text-steel`}>{t.contact.terminalTitle}</p>
            <a href="mailto:hello@taloscode.dev" className="mt-5 inline-block border-b border-white/20 pb-2 font-mono text-[13px] text-glacier transition-colors hover:border-beam hover:text-beam focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-beam">
              {t.contact.emailLabel}: {t.contact.command}
            </a>
          </HudFrame>
        </Reveal>
      </div>
    </Chapter>
  );
}

function Faq({ t }: { t: Dictionary }) {
  return (
    <Chapter id="faq" headingId="faq-heading" index={idx("faq")}>
      <div className="grid gap-x-10 gap-y-6 lg:grid-cols-12 lg:items-end">
        <Reveal className="lg:col-span-7"><h2 id="faq-heading" className={sectionHeading}>{t.faq.heading}</h2></Reveal>
        <Reveal delay={0.1} className="lg:col-span-4 lg:col-start-9"><p className="text-sm leading-relaxed text-steel">{t.faq.lead}</p></Reveal>
      </div>
      <Reveal delay={0.05} className="mt-16"><VideoFaq t={t.faq} /></Reveal>
    </Chapter>
  );
}

export default function App() {
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const t = dictionaries[locale];
  useEffect(() => { document.documentElement.lang = t.htmlLang; }, [t.htmlLang]);
  return (
    <MotionConfig reducedMotion="user">
      <div className="relative isolate min-h-svh text-ivory">
        <SmoothScroll />
        <ParticleField />
        <HudLayer />
        <FloatingHeader t={t} />
        <main id="main-content">
          <Hero t={t} />
          <Services t={t} />
          <Work t={t} />
          <About t={t} />
          <Contact t={t} />
          <Faq t={t} />
          <Closing t={t.build} />
        </main>
        <footer className="border-t border-white/10">
          <div className={`${shell} ${meta} flex flex-wrap items-center justify-between gap-4 py-8 text-steel`}>
            <span>{t.footer.descriptor}</span>
            <div role="group" aria-label={t.header.languageLabel} className="flex gap-3">{locales.map(item => <button key={item} type="button" lang={dictionaries[item].htmlLang} aria-pressed={locale === item} onClick={() => setLocale(item)} className="min-h-11 min-w-11 text-steel aria-pressed:text-beam">{localeLabels[item]}</button>)}</div>
            <span>{t.footer.copyright}</span>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
