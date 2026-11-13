"use client";

import { useEffect, useRef, useState } from "react";
import { MotionConfig, motion, useScroll, useTransform } from "motion/react";
import { ParticleField } from "./components/background/ParticleField";
import { HudLayer, Telemetry } from "./components/motion/HudLayer";
import { HudFrame } from "./components/ui/HudFrame";
import { VideoFaq } from "./components/faq/VideoFaq";
import { Closing } from "./components/closing/Closing";
import { SmoothScroll } from "./components/motion/SmoothScroll";
import { Reveal, LineReveal } from "./components/motion/Reveal";
import { Magnetic } from "./components/motion/Magnetic";
import { Parallax } from "./components/motion/Parallax";
import { EASE, VIEWPORT } from "./components/motion/motion";
import { defaultLocale, dictionaries, localeLabels, locales, projectMeta, sectionIds, type Dictionary, type Locale, type RichParagraph, type SectionId } from "./content/dictionary";

const shell = "mx-auto w-full max-w-[88rem] px-6 sm:px-10";
const sectionHeading = "font-display text-[clamp(3rem,7vw,6.5rem)] font-extrabold uppercase leading-[0.86] tracking-[-0.02em] text-ivory";
const meta = "font-mono text-[11px] uppercase tracking-[0.22em]";
const pad = (n: number) => String(n).padStart(2, "0");
const idx = (id: SectionId) => pad(sectionIds.indexOf(id) + 1);

function Header({ t, locale, onLocaleChange }: { t: Dictionary; locale: Locale; onLocaleChange: (locale: Locale) => void }) {
  return (
    <header className="fixed inset-x-0 top-0 z-20 border-b border-white/10 bg-obsidian/70 backdrop-blur-xl">
      <div className={`${shell} flex items-center justify-between gap-6 py-4`}>
        <a href="#main-content" className={`${meta} font-semibold text-ivory`}>talos<span className="text-beam">{"//"}</span>code</a>
        <nav aria-label={t.header.navLabel} className="hidden gap-8 md:flex">
          {sectionIds.map((id) => (
            <a key={id} href={`#${id}`} className="group flex items-baseline gap-2 text-[13px] text-steel transition-colors hover:text-ivory">
              <span className="font-mono text-[10px] text-steel/60 transition-colors group-hover:text-beam">[{idx(id)}]</span>{t.header.nav[id]}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-5">
          <div role="group" aria-label={t.header.languageLabel} className={`${meta} flex items-center gap-2`}>
            {locales.map((item, index) => (
              <span key={item} className="flex items-center gap-2">
                {index > 0 && <span aria-hidden="true" className="text-white/20">/</span>}
                <button type="button" lang={dictionaries[item].htmlLang} aria-pressed={locale === item} onClick={() => onLocaleChange(item)} className={locale === item ? "text-beam" : "text-steel transition-colors hover:text-ivory"}>{localeLabels[item]}</button>
              </span>
            ))}
          </div>
          <a href="#contact" className="hidden border border-white/15 px-4 py-2.5 text-[13px] text-ivory transition-colors hover:border-beam hover:text-beam sm:inline-block">{t.header.cta}</a>
        </div>
      </div>
    </header>
  );
}

function Rich({ paragraph }: { paragraph: RichParagraph }) {
  return <>{paragraph.map((segment, index) => segment.strong ? <strong key={index} className="font-normal text-ivory">{segment.text}</strong> : segment.text)}</>;
}

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
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "-14%"]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const panelY = useTransform(scrollYProgress, [0, 1], ["0%", "-26%"]);
  const teleY = useTransform(scrollYProgress, [0, 1], ["0%", "45%"]);
  const lines = t.hero.headline.length;
  return (
    <section ref={ref} aria-labelledby="hero-heading" className="relative flex min-h-svh flex-col justify-end overflow-hidden pt-28 pb-12 sm:pb-16">
      <motion.div style={{ y, opacity: fade }} className={`${shell} relative`}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.1, ease: EASE }} className={`${meta} mb-8 flex items-center justify-between text-steel`}>
          <span className="flex items-center gap-3"><span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-beam opacity-60" /><span className="relative h-1.5 w-1.5 rounded-full bg-beam" /></span>talos_code</span>
          <span aria-hidden="true">[00]</span>
        </motion.div>
        <div className="relative">
        <motion.div style={{ y: teleY }} className="absolute bottom-2 right-0 hidden lg:block">
          <HudFrame tag="SYS // 01" status="NODE.ACTIVE" className="w-64 px-5 pb-8 pt-9 font-mono text-[11px] tracking-[0.12em] text-steel"><Telemetry /></HudFrame>
        </motion.div>
        <h1 id="hero-heading" className="font-display text-[clamp(3.75rem,13vw,12.5rem)] font-extrabold uppercase leading-[0.84] tracking-[-0.02em] text-ivory">
          {t.hero.headline.map((line, index) => <LineReveal key={line} onMount delay={0.2 + index * 0.14} className={index === lines - 1 ? "md:pl-[12vw]" : ""}>{line}</LineReveal>)}
        </h1>
        </div>
        <motion.div style={{ y: panelY }} className="mt-10"><motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.2 + lines * 0.14 + 0.1, ease: EASE }} ><HudFrame tag="SYS // 00" status="NODE.ACTIVE" className="grid gap-8 px-6 pb-10 pt-10 sm:px-8 md:grid-cols-12 md:items-end">
          <p className="max-w-[54ch] text-[15px] leading-relaxed text-steel md:col-span-6 md:col-start-1">{t.hero.lead}</p>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4 md:col-span-5 md:col-start-8">
            <Magnetic>
              <a href="#contact" className="group relative inline-flex items-center gap-3 bg-ivory px-7 py-4 text-sm font-medium text-obsidian transition-colors duration-300 hover:bg-beam">{t.hero.primaryCta}<span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">→</span></a>
            </Magnetic>
            <a href="#work" className="border-b border-white/30 pb-1 text-sm text-ivory transition-colors hover:border-beam hover:text-beam">{t.hero.secondaryCta}</a>
          </div>
          <div aria-hidden="true" className="hidden items-end justify-end gap-3 md:col-span-1 md:col-start-12 md:flex">
            <span className={`${meta} text-steel [writing-mode:vertical-rl]`}>scroll</span>
            <span className="relative block h-16 w-px overflow-hidden bg-white/10"><span className="scroll-cue absolute inset-0 block bg-beam" /></span>
          </div>
        </HudFrame></motion.div></motion.div>
      </motion.div>
    </section>
  );
}

const SPANS = ["lg:col-span-7", "lg:col-span-5", "lg:col-span-5", "lg:col-span-7"];

function Services({ t }: { t: Dictionary }) {
  return (
    <Chapter id="services" headingId="services-heading" index={idx("services")}>
      <div className="grid gap-x-10 gap-y-6 lg:grid-cols-12 lg:items-end">
        <Reveal className="lg:col-span-7"><h2 id="services-heading" className={sectionHeading}>{t.services.heading}</h2></Reveal>
        <Reveal delay={0.1} className="lg:col-span-4 lg:col-start-9"><p className="text-sm leading-relaxed text-steel">{t.services.lead}</p></Reveal>
      </div>
      <ul className="mt-16 grid gap-4 lg:grid-cols-12">
        {t.services.items.map((service, i) => (
          <motion.li key={service.id} initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={VIEWPORT} transition={{ duration: 0.9, delay: (i % 2) * 0.1, ease: EASE }} className={SPANS[i % SPANS.length]}>
            <HudFrame tag={`NODE // ${pad(i + 1)}`} status={i % 2 ? "STANDBY" : "ONLINE"} className="flex h-full min-h-72 flex-col justify-end gap-16 px-7 pb-12 pt-12 sm:px-9">
              <div>
                <h3 className="font-display text-4xl font-bold uppercase leading-[0.95] tracking-[-0.015em] text-ivory sm:text-5xl">{service.name}</h3>
                <p className="mt-4 max-w-[46ch] text-sm leading-relaxed text-steel">{service.description}</p>
              </div>
            </HudFrame>
          </motion.li>
        ))}
      </ul>
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
          return (
            <article key={project.id} className="grid items-end gap-x-10 gap-y-8 lg:grid-cols-12">
              <motion.div initial={{ clipPath: "inset(0 0 100% 0)" }} whileInView={{ clipPath: "inset(0 0 0% 0)" }} viewport={VIEWPORT} transition={{ duration: 1.2, ease: EASE }} className="relative aspect-video overflow-hidden border border-white/10 lg:col-span-8">
                <Parallax range={7} className="absolute inset-[-8%]">
                  <div className="h-full w-full bg-surface bg-cover bg-center" style={image ? { backgroundImage: `url(${image})` } : undefined} role={image ? "img" : undefined} aria-label={image ? project.name : undefined} />
                </Parallax>
                <span aria-hidden="true" className={`${meta} absolute bottom-4 left-6 text-beam`}>[{pad(i + 1)}]</span>
                <span aria-hidden="true" className="hud-c tl" /><span aria-hidden="true" className="hud-c br" />
              </motion.div>
              <Reveal delay={0.15} className="lg:col-span-4">
                <p className={`${meta} text-beam`}>{project.category}</p>
                <h3 className="mt-4 font-display text-5xl font-bold uppercase leading-[0.9] tracking-[-0.015em] text-ivory sm:text-6xl">{project.name}</h3>
                <p className="mt-5 text-sm leading-relaxed text-steel">{project.description}</p>
                {url && <a href={url} target="_blank" rel="noopener noreferrer" className="mt-8 inline-block border-b border-white/30 pb-1 text-sm text-ivory transition-colors hover:border-beam hover:text-beam">{t.work.visit} <span aria-hidden="true">↗</span></a>}
              </Reveal>
            </article>
          );
        })}
      </div>
    </Chapter>
  );
}

function About({ t }: { t: Dictionary }) {
  const [first, ...rest] = t.about.paragraphs;
  return (
    <Chapter id="about" headingId="about-heading" index={idx("about")}>
      <div className="grid gap-x-10 gap-y-12 lg:grid-cols-12">
        <Reveal className="lg:col-span-5"><h2 id="about-heading" className={sectionHeading}>{t.about.heading}</h2></Reveal>
        <div className="lg:col-span-7">
          {first && <Reveal><p className="max-w-[40ch] text-2xl leading-snug tracking-tight text-steel sm:text-3xl sm:leading-snug"><Rich paragraph={first} /></p></Reveal>}
          <div className="mt-12 grid gap-x-10 gap-y-6 border-t border-white/10 pt-8 sm:grid-cols-2">
            {rest.map((paragraph, index) => <Reveal key={index} delay={index * 0.08}><p className="text-sm leading-relaxed text-steel"><Rich paragraph={paragraph} /></p></Reveal>)}
          </div>
        </div>
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
        <Reveal delay={0.1} className="self-end lg:col-span-5">
          <HudFrame tag="SYS // 04" status="NODE.ACTIVE" className="px-5 pb-10 pt-11 sm:px-7">
            <p className={`${meta} border-b border-white/10 pb-3 text-steel`}>{t.contact.terminalTitle}</p>
            <p className="mt-5 break-all font-mono text-[13px] leading-relaxed text-glacier">{t.contact.command}</p>
            <label htmlFor="contact-email" className="mt-5 block text-[13px] leading-relaxed text-ivory">{t.contact.emailLabel}</label>
            <div className="mt-3 flex items-center gap-3 text-sm">
              <span aria-hidden="true" className="font-mono text-beam">&gt;</span>
              <input id="contact-email" name="email" type="email" autoComplete="email" spellCheck={false} placeholder={t.contact.emailPlaceholder} className="min-w-0 flex-1 border-0 border-b border-white/20 bg-transparent py-2 font-mono text-ivory caret-beam outline-none placeholder:text-steel/60 focus:border-beam" />
            </div>
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
      <Reveal delay={0.05} className="mt-16"><VideoFaq key={t.htmlLang} t={t.faq} /></Reveal>
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
        <Header t={t} locale={locale} onLocaleChange={setLocale} />
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
            <span>{t.footer.copyright}</span>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
