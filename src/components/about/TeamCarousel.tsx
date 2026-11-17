"use client";

import { useId, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import type { Dictionary } from "../../content/dictionary";
import type { TeamMember } from "../../content/team";

function TeamPortrait({ member }: { member: TeamMember }) {
  const [imageFailed, setImageFailed] = useState(false);
  const initials = member.name.trim().split(/\s+/).slice(0, 2).map((part) => Array.from(part)[0]).join("");

  return (
    <div className="relative aspect-square w-full overflow-hidden border border-white/15 bg-surface md:col-span-7 md:col-start-1 md:row-start-1">
      {member.photo && !imageFailed ? (
        <Image
          src={member.photo}
          alt={member.name}
          fill
          sizes="(min-width: 1440px) 705px, (min-width: 768px) 58vw, 100vw"
          className="object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div aria-hidden="true" className="flex h-full items-center justify-center bg-gradient-to-br from-beam/10 via-surface to-violet/10">
          <span className="font-display text-[clamp(5rem,15vw,12rem)] font-bold leading-none tracking-[-0.04em] text-ivory/80">
            {initials}
          </span>
        </div>
      )}
    </div>
  );
}

export function TeamCarousel({ members, t }: { members: readonly TeamMember[]; t: Dictionary["about"] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const reducedMotion = useReducedMotion();
  const profileId = useId();
  const profiles = members.flatMap((member) => {
    const copy = Object.hasOwn(t.members, member.id) ? t.members[member.id] : undefined;
    if (!member.approved || !member.name.trim() || !copy?.role.trim() || !copy.bio.trim()) return [];
    return [{ member, copy }];
  });
  const activeIndex = Math.max(0, profiles.findIndex(({ member }) => member.id === activeId));
  const activeProfile = profiles[activeIndex];

  if (!activeProfile) {
    return <p className="max-w-[55ch] text-lg leading-relaxed text-steel sm:text-xl">{t.intro}</p>;
  }

  const { member, copy } = activeProfile;
  const links = member.links?.filter((link) => link.href.trim() && link.label.trim()) ?? [];
  const announcement = t.carousel.announcement
    .replace("{name}", member.name)
    .replace("{role}", copy.role)
    .replace("{current}", String(activeIndex + 1))
    .replace("{total}", String(profiles.length));

  return (
    <div role="group" aria-roledescription={t.carousel.roleDescription} aria-label={t.carousel.label} className="min-w-0">
      <motion.article
        id={profileId}
        key={member.id}
        aria-labelledby={`${profileId}-name`}
        initial={reducedMotion ? false : { opacity: 0.85 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reducedMotion ? 0 : 0.25 }}
        className="grid min-w-0 items-center gap-y-0 md:grid-cols-12"
      >
        <TeamPortrait key={`${member.id}-${member.photo ?? "monogram"}`} member={member} />
        <div className="relative min-w-0 border border-white/15 border-t-beam bg-surface p-6 md:col-span-6 md:col-start-7 md:row-start-1 md:p-8 lg:p-10">
          <h3 id={`${profileId}-name`} className="break-words font-display text-4xl font-bold leading-[1.05] text-ivory sm:text-5xl lg:text-6xl">
            {member.name}
          </h3>
          <p className="mt-3 text-sm font-medium leading-relaxed text-beam sm:text-base">{copy.role}</p>
          <p className="mt-6 max-w-[48ch] text-base leading-relaxed text-steel">{copy.bio}</p>
          {links.length > 0 && (
            <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-4">
              {links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${link.label} — ${member.name}`}
                    className="inline-flex min-h-11 items-center gap-2 border-b border-white/25 text-sm text-ivory hover:border-beam hover:text-beam focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-beam"
                  >
                    {link.label}<span aria-hidden="true">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </motion.article>

      <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">{announcement}</p>

      {profiles.length > 1 && (
        <div role="group" aria-label={t.carousel.navigation} className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            aria-label={t.carousel.previous}
            aria-controls={profileId}
            onClick={() => setActiveId(profiles[(activeIndex - 1 + profiles.length) % profiles.length].member.id)}
            className="flex h-12 w-12 shrink-0 items-center justify-center border border-white/20 text-2xl text-ivory hover:border-beam hover:text-beam focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-beam"
          >
            <span aria-hidden="true">←</span>
          </button>
          <div className="flex max-w-full flex-wrap justify-center">
            {profiles.map(({ member: profile }) => (
              <button
                key={profile.id}
                type="button"
                aria-label={t.carousel.showProfile.replace("{name}", profile.name)}
                aria-current={profile.id === member.id ? "true" : undefined}
                aria-controls={profileId}
                onClick={() => setActiveId(profile.id)}
                className="flex h-11 w-11 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-beam"
              >
                <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full border ${profile.id === member.id ? "border-beam bg-beam" : "border-steel bg-transparent"}`} />
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-label={t.carousel.next}
            aria-controls={profileId}
            onClick={() => setActiveId(profiles[(activeIndex + 1) % profiles.length].member.id)}
            className="flex h-12 w-12 shrink-0 items-center justify-center border border-white/20 text-2xl text-ivory hover:border-beam hover:text-beam focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-beam"
          >
            <span aria-hidden="true">→</span>
          </button>
        </div>
      )}
    </div>
  );
}
