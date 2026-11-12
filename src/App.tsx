"use client";

import { useEffect, useState } from "react";
import { ForgeBackground } from "./components/background/ForgeBackground";
import { defaultLocale, dictionaries, localeLabels, locales, projectMeta, sectionIds, type Dictionary, type Locale, type RichParagraph } from "./content/dictionary";

const shell = "mx-auto w-full max-w-[88rem] px-6 sm:px-10";
const sectionHeading = "font-display text-[clamp(2.75rem,6vw,5.5rem)] font-bold leading-[0.92] tracking-[-0.01em]";

function Header({ t, locale, onLocaleChange }: { t: Dictionary; locale: Locale; onLocaleChange: (locale: Locale) => void }) {
  return (
    <header className="fixed inset-x-0 top-0 z-20 border-b border-bone/10 bg-basalt/80 backdrop-blur-md">
      <div className={`${shell} flex items-center justify-between gap-6 py-4`}>
        <a href="#main-content" className="text-sm font-semibold tracking-[0.08em] text-bone">talos<span className="text-bronze">:</span>code</a>
        <nav aria-label={t.header.navLabel} className="hidden gap-8 text-[13px] text-ash md:flex">
          {sectionIds.map((id) => <a key={id} href={`#${id}`} className="transition-colors hover:text-bone">{t.header.nav[id]}</a>)}
        </nav>
        <div className="flex items-center gap-5">
          <div role="group" aria-label={t.header.languageLabel} className="flex items-center gap-2 text-[13px]">
            {locales.map((item, index) => (
              <span key={item} className="flex items-center gap-2">
                {index > 0 && <span aria-hidden="true" className="text-ash/60">/</span>}
                <button type="button" lang={dictionaries[item].htmlLang} aria-pressed={locale === item} onClick={() => onLocaleChange(item)} className={locale === item ? "text-gold" : "text-ash transition-colors hover:text-bone"}>{localeLabels[item]}</button>
              </span>
            ))}
          </div>
          <a href="#contact" className="hidden border border-bronze/70 px-4 py-2.5 text-[13px] text-bone transition-colors hover:border-gold hover:bg-gold hover:text-basalt sm:inline-block">{t.header.cta}</a>
        </div>
      </div>
    </header>
  );
}

function Rich({ paragraph }: { paragraph: RichParagraph }) {
  return <>{paragraph.map((segment, index) => segment.strong ? <strong key={index} className="font-normal text-bone">{segment.text}</strong> : segment.text)}</>;
}

function Hero({ t }: { t: Dictionary }) {
  return (
    <section aria-labelledby="hero-heading" className={`${shell} flex min-h-svh flex-col justify-end pt-28 pb-14 sm:pb-20`}>
      <h1 id="hero-heading" className="font-display text-[clamp(3.5rem,11.5vw,11rem)] font-extrabold leading-[0.86] tracking-[-0.015em]">
        {t.hero.headline.map((line, index) => <span key={line} className="hero-rise block" style={{ "--rise-order": index } as React.CSSProperties}>{line}</span>)}
      </h1>
      <div className="hero-rise mt-8 flex flex-col gap-8 md:flex-row md:items-end md:justify-between" style={{ "--rise-order": t.hero.headline.length } as React.CSSProperties}>
        <p className="max-w-[54ch] text-sm leading-relaxed text-bone/80 sm:text-base">{t.hero.lead}</p>
        <div className="flex shrink-0 flex-wrap items-center gap-x-7 gap-y-4 text-sm">
          <a href="#contact" className="bg-gold px-6 py-3.5 font-medium text-basalt transition-colors hover:bg-bone">{t.hero.primaryCta}</a>
          <a href="#work" className="border-b border-bone/40 pb-1 text-bone transition-colors hover:border-gold hover:text-gold">{t.hero.secondaryCta}</a>
        </div>
      </div>
    </section>
  );
}

function Services({ t }: { t: Dictionary }) {
  return (
    <section id="services" aria-labelledby="services-heading" className={`${shell} py-20 sm:py-28`}>
      <div className="grid gap-x-12 gap-y-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <h2 id="services-heading" className={sectionHeading}>{t.services.heading}</h2>
          <p className="mt-6 max-w-[40ch] text-sm leading-relaxed text-ash">{t.services.lead}</p>
        </div>
        <ul className="lg:col-span-8">
          {t.services.items.map((service) => (
            <li key={service.id} className="grid gap-x-10 gap-y-3 border-t border-bone/15 py-8 last:border-b sm:grid-cols-2">
              <h3 className="font-display text-3xl font-semibold leading-none tracking-[0.005em] text-bone sm:text-4xl">{service.name}</h3>
              <p className="text-sm leading-relaxed text-ash">{service.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Work({ t }: { t: Dictionary }) {
  const projects = t.work.projects.filter((project) => projectMeta[project.id].published);
  return (
    <section id="work" aria-labelledby="work-heading" className={`${shell} py-20 sm:py-28`}>
      <h2 id="work-heading" className={sectionHeading}>{t.work.heading}</h2>
      <div className="mt-12 space-y-20">
        {projects.map((project) => {
          const { url, image } = projectMeta[project.id];
          return (
            <article key={project.id} className="grid items-end gap-x-12 gap-y-8 lg:grid-cols-12">
              <div className="aspect-video overflow-hidden border border-bone/15 bg-basalt bg-cover bg-center lg:col-span-8" style={image ? { backgroundImage: `url(${image})` } : undefined} role={image ? "img" : undefined} aria-label={image ? project.name : undefined} />
              <div className="lg:col-span-4">
                <p className="text-[13px] text-bronze">{project.category}</p>
                <h3 className="mt-3 font-display text-4xl font-semibold leading-none text-bone sm:text-5xl">{project.name}</h3>
                <p className="mt-5 text-sm leading-relaxed text-ash">{project.description}</p>
                {url && <a href={url} target="_blank" rel="noopener noreferrer" className="mt-7 inline-block border-b border-bone/40 pb-1 text-sm text-bone transition-colors hover:border-gold hover:text-gold">{t.work.visit} <span aria-hidden="true">↗</span></a>}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function About({ t }: { t: Dictionary }) {
  const [first, ...rest] = t.about.paragraphs;
  return (
    <section id="about" aria-labelledby="about-heading" className={`${shell} py-20 sm:py-28`}>
      <div className="grid gap-x-12 gap-y-10 lg:grid-cols-12">
        <h2 id="about-heading" className={`${sectionHeading} lg:col-span-4`}>{t.about.heading}</h2>
        <div className="lg:col-span-8">
          {first && <p className="max-w-[58ch] text-lg leading-relaxed text-ash sm:text-xl sm:leading-relaxed"><Rich paragraph={first} /></p>}
          {rest.map((paragraph, index) => <p key={index} className="mt-8 max-w-[64ch] text-sm leading-relaxed text-ash"><Rich paragraph={paragraph} /></p>)}
        </div>
      </div>
    </section>
  );
}

function Contact({ t }: { t: Dictionary }) {
  return (
    <section id="contact" aria-labelledby="contact-heading" className={`${shell} py-20 sm:py-28`}>
      <div className="grid gap-x-12 gap-y-10 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <h2 id="contact-heading" className={sectionHeading}>{t.contact.heading}</h2>
          <p className="mt-6 max-w-[44ch] text-sm leading-relaxed text-ash">{t.contact.lead}</p>
        </div>
        <div className="self-end border border-bone/15 bg-basalt/85 p-5 sm:p-7 lg:col-span-6">
          <p className="border-b border-bone/15 pb-3 text-[13px] text-ash">{t.contact.terminalTitle}</p>
          <p className="mt-5 break-all text-[13px] leading-relaxed text-patina">{t.contact.command}</p>
          <label htmlFor="contact-email" className="mt-5 block text-[13px] leading-relaxed text-bone">{t.contact.emailLabel}</label>
          <div className="mt-3 flex items-center gap-3 text-sm">
            <span aria-hidden="true" className="text-gold">&gt;</span>
            <input id="contact-email" name="email" type="email" autoComplete="email" spellCheck={false} placeholder={t.contact.emailPlaceholder} className="min-w-0 flex-1 border-0 border-b border-bone/25 bg-transparent py-2 font-mono text-bone caret-gold outline-none placeholder:text-ash/70 focus:border-gold" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default function App() {
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const t = dictionaries[locale];
  useEffect(() => { document.documentElement.lang = t.htmlLang; }, [t.htmlLang]);
  return (
    <div className="relative isolate min-h-svh font-mono text-bone">
      <ForgeBackground />
      <Header t={t} locale={locale} onLocaleChange={setLocale} />
      <main id="main-content">
        <Hero t={t} />
        <Services t={t} />
        <Work t={t} />
        <About t={t} />
        <Contact t={t} />
      </main>
      <footer className={`${shell} flex flex-wrap items-center justify-between gap-4 border-t border-bone/15 py-8 text-[13px] text-ash`}>
        <span>{t.footer.descriptor}</span>
        <span>{t.footer.copyright}</span>
      </footer>
    </div>
  );
}
