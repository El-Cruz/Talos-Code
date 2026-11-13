// Single source of truth for all visible site copy (EN / ES).
// Add or edit text here; components only read from this dictionary.

export const locales = ["en", "es"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

/** Label shown in the language switcher for each locale. */
export const localeLabels: Record<Locale, string> = { en: "EN", es: "ES" };

/** Page sections, in order. The ids are also the anchor targets (#services, ...). */
export const sectionIds = ["services", "work", "about", "contact", "faq"] as const;
export type SectionId = (typeof sectionIds)[number];

export const serviceIds = ["web", "mobile", "integration", "environments"] as const;
export type ServiceId = (typeof serviceIds)[number];

export const projectIds = ["zalvador", "divoid", "matambre"] as const;
export type ProjectId = (typeof projectIds)[number];

export interface ProjectMeta {
  /** Only published projects are rendered. Set to true to show a paused project again. */
  readonly published: boolean;
  /** Public URL of the project or case study. Leave undefined until it is published. */
  readonly url?: string;
  /** Thumbnail path under /public (e.g. "/projects/divoid.jpg"). */
  readonly image?: string;
}

/** Language-independent project data: fill in URLs and thumbnails here. */
export const projectMeta: Record<ProjectId, ProjectMeta> = {
  zalvador: { published: true, url: "https://www.zalvadorpineda.art/", image: "/projects/zalvador-pineda.jpg" },
  // Paused for now: the copy is ready below, flip `published` to show them.
  divoid: { published: false },
  matambre: { published: false },
};

export interface RichSegment {
  readonly text: string;
  readonly strong?: boolean;
}
export type RichParagraph = readonly RichSegment[];

/** Turns "plain **highlighted** plain" into segments rendered with the highlight style. */
function rich(source: string): RichParagraph {
  return source
    .split("**")
    .map((text, index) => (index % 2 === 1 ? { text, strong: true } : { text }))
    .filter((segment) => segment.text.length > 0);
}

export interface ServiceCopy {
  readonly id: ServiceId;
  readonly name: string;
  readonly description: string;
}

export interface ProjectCopy {
  readonly id: ProjectId;
  readonly name: string;
  readonly category: string;
  readonly description: string;
}

export interface Dictionary {
  readonly htmlLang: string;
  readonly header: {
    readonly navLabel: string;
    readonly nav: Record<SectionId, string>;
    readonly languageLabel: string;
    readonly cta: string;
  };
  readonly hero: {
    /** Each entry is one line of the headline. */
    readonly headline: readonly string[];
    readonly lead: string;
    readonly primaryCta: string;
    readonly secondaryCta: string;
  };
  readonly services: {
    readonly heading: string;
    readonly lead: string;
    readonly items: readonly ServiceCopy[];
  };
  readonly work: {
    readonly heading: string;
    readonly visit: string;
    readonly projects: readonly ProjectCopy[];
  };
  readonly about: {
    readonly heading: string;
    readonly paragraphs: readonly RichParagraph[];
  };
  readonly contact: {
    readonly heading: string;
    readonly lead: string;
    readonly terminalTitle: string;
    readonly command: string;
    readonly emailLabel: string;
    readonly emailPlaceholder: string;
  };
  readonly faq: {
    readonly heading: string;
    readonly lead: string;
    readonly clipsLabel: string;
    readonly placeholder: string;
    readonly play: string;
    readonly pause: string;
    readonly items: readonly { readonly id: string; readonly question: string; readonly answer: string; readonly clip: string; readonly duration: number }[];
  };
  readonly build: { readonly heading: string; readonly lead: string };
  readonly footer: {
    readonly descriptor: string;
    readonly copyright: string;
  };
}

const en: Dictionary = {
  htmlLang: "en",
  header: {
    navLabel: "Main navigation",
    nav: { services: "Services", work: "Work", about: "About us", contact: "Contact", faq: "FAQ" },
    languageLabel: "Language",
    cta: "Start a project",
  },
  hero: {
    headline: ["Software forged", "to last."],
    lead: "Talos Code is a technology consulting and software development agency. We build the web platforms, mobile apps and connected systems your business runs on.",
    primaryCta: "Start a project",
    secondaryCta: "See our work",
  },
  services: {
    heading: "Services",
    lead: "Four kinds of work, one team responsible from the first diagram to the production deployment.",
    items: [
      {
        id: "web",
        name: "Web architecture",
        description: "Websites and web platforms on a solid base: structure, performance, infrastructure and modern deployments.",
      },
      {
        id: "mobile",
        name: "Mobile applications",
        description: "Apps and mobile-first web apps, including installable experiences and digital passes for Apple Wallet and Google Wallet.",
      },
      {
        id: "integration",
        name: "Business systems integration",
        description: "CRM, reservations, analytics and internal tools connected to each other, so day-to-day operations need less manual work.",
      },
      {
        id: "environments",
        name: "Custom technology environments",
        description: "The whole set designed around how your business works: tools, workflows and automations that fit together.",
      },
    ],
  },
  work: {
    heading: "Work",
    visit: "Visit the site",
    projects: [
      {
        id: "zalvador",
        name: "Zalvador Pineda",
        category: "Online catalog and art sales",
        description:
          "Online catalog and virtual sales space for the works of artist Zalvador Pineda: oil paintings, charcoal drawings, and exhibitions.",
      },
      {
        id: "divoid",
        name: "DIvoid",
        category: "CRM and management systems",
        description:
          "Custom platform for a nightlife venue: table reservations, customer consumption analytics, role-based access for the team, and automated control of in-venue screens and billboards.",
      },
      {
        id: "matambre",
        name: "Matambre Encebollados",
        category: "Mobile loyalty and PWA",
        description:
          "Mobile-first web app and digital loyalty passes (.pkpass) for Apple Wallet and Google Wallet, built for a restaurant brand in Quito.",
      },
    ],
  },
  about: {
    heading: "About us",
    paragraphs: [
      rich(
        "**Talos Code** is a **technology consulting and software development** agency specialized in **web architecture**, **mobile applications**, **business systems integration**, and the creation of **custom technology environments** for businesses.",
      ),
      rich(
        "We work with **technical rigor**: clear contracts, deliberate tradeoffs, and a **modular architecture** that can be understood from the inside out. The result is **scalable, maintainable software** that your team can confidently own and evolve.",
      ),
    ],
  },
  contact: {
    heading: "Tell us what you need to build.",
    lead: "Leave your email and we will get back to you to talk about the project.",
    terminalTitle: "talos:code / contact",
    command: "> talos_deploy --target=production",
    emailLabel: "> Enter your contact email:",
    emailPlaceholder: "you@company.com",
  },
  faq: {
    heading: "Questions, answered",
    lead: "Short demos on the left, straight answers on the right. Pick a question or a clip.",
    clipsLabel: "Clips",
    placeholder: "Demo clip loading soon",
    play: "Play demo",
    pause: "Pause demo",
    items: [
      { id: "environments", clip: "Environments", duration: 20, question: "What does Talos Code actually build?", answer: "Custom technology environments for your business: the website, the apps and the internal tools, connected so your day-to-day runs on one coherent system instead of a pile of disconnected software." },
      { id: "loyalty", clip: "Loyalty", duration: 25, question: "How do loyalty programs with Apple Wallet and Google Wallet work?", answer: "Your customers add a digital pass to their phone wallet with one tap. Points, stamps and offers update on the pass itself, and you can notify them without asking them to install anything." },
      { id: "platforms", clip: "Web & mobile", duration: 20, question: "Do I need a website, a mobile app, or both?", answer: "We start from how your customers actually reach you. Often a mobile-first web platform with an installable experience covers both, and we only add a native app when it earns its cost." },
      { id: "delivery", clip: "Delivery", duration: 15, question: "How long does a project take?", answer: "It depends on scope. We split the work into phases with a defined result each, so you get a first working release early and keep building from something real." },
      { id: "scale", clip: "Scale", duration: 30, question: "Will it keep working as my business grows?", answer: "Yes. We use a modular architecture, standard infrastructure and clear documentation, so new features, locations or volume are added without rebuilding what already works." },
    ],
  },
  build: { heading: "Built live, line by line", lead: "This is how an environment comes together: structure first, then the node comes online." },
  footer: {
    descriptor: "Technology consulting and software development",
    copyright: "© Talos Code",
  },
};

const es: Dictionary = {
  htmlLang: "es-EC",
  header: {
    navLabel: "Navegación principal",
    nav: { services: "Servicios", work: "Proyectos", about: "Quiénes somos", contact: "Contacto", faq: "FAQ" },
    languageLabel: "Idioma",
    cta: "Iniciar un proyecto",
  },
  hero: {
    headline: ["Software forjado", "para durar."],
    lead: "Talos Code es una agencia de consultoría tecnológica y desarrollo de software. Construimos las plataformas web, las apps móviles y los sistemas conectados con los que opera tu negocio.",
    primaryCta: "Iniciar un proyecto",
    secondaryCta: "Ver proyectos",
  },
  services: {
    heading: "Servicios",
    lead: "Cuatro tipos de trabajo y un solo equipo responsable, desde el primer diagrama hasta el despliegue en producción.",
    items: [
      {
        id: "web",
        name: "Arquitectura web",
        description: "Sitios y plataformas web sobre una base sólida: estructura, rendimiento, infraestructura y despliegues modernos.",
      },
      {
        id: "mobile",
        name: "Aplicaciones móviles",
        description: "Apps y web apps mobile-first, incluidas experiencias instalables y pases digitales para Apple Wallet y Google Wallet.",
      },
      {
        id: "integration",
        name: "Integración de sistemas empresariales",
        description: "CRM, reservas, analítica y herramientas internas conectadas entre sí, para que la operación diaria dependa menos del trabajo manual.",
      },
      {
        id: "environments",
        name: "Entornos tecnológicos a medida",
        description: "El conjunto completo diseñado según cómo trabaja tu negocio: herramientas, flujos y automatizaciones que encajan entre sí.",
      },
    ],
  },
  work: {
    heading: "Proyectos",
    visit: "Visitar el sitio",
    projects: [
      {
        id: "zalvador",
        name: "Zalvador Pineda",
        category: "Catálogo en línea y venta de arte",
        description:
          "Catálogo en línea y espacio de venta virtual de las obras del artista Zalvador Pineda: pinturas al óleo, dibujos al carboncillo y exposiciones.",
      },
      {
        id: "divoid",
        name: "DIvoid",
        category: "Sistemas CRM y gestión",
        description:
          "Plataforma a medida para un local de entretenimiento nocturno: reservas de mesas, analítica de consumo de clientes, roles jerárquicos para el equipo y control automatizado de pantallas y carteleras.",
      },
      {
        id: "matambre",
        name: "Matambre Encebollados",
        category: "Fidelización móvil y PWA",
        description:
          "Aplicación web mobile-first y pases de lealtad digitales (.pkpass) para Apple Wallet y Google Wallet, desarrollados para una marca gastronómica en Quito.",
      },
    ],
  },
  about: {
    heading: "Quiénes somos",
    paragraphs: [
      rich(
        "**Talos Code** es una agencia de **consultoría tecnológica y desarrollo de software** especializada en **arquitectura web**, **aplicaciones móviles**, **integración de sistemas empresariales** y la creación de **entornos tecnológicos a medida** para negocios.",
      ),
      rich(
        "Trabajamos con **rigor técnico**: contratos claros, decisiones deliberadas y una **arquitectura modular** que se entiende desde adentro. El resultado es **software escalable y mantenible** que tu equipo puede asumir y hacer evolucionar con confianza.",
      ),
    ],
  },
  contact: {
    heading: "Cuéntanos qué necesitas construir.",
    lead: "Déjanos tu correo y te escribimos para conversar sobre el proyecto.",
    terminalTitle: "talos:code / contacto",
    command: "> talos_deploy --target=production",
    emailLabel: "> Ingresa tu correo de contacto:",
    emailPlaceholder: "tu@empresa.com",
  },
  faq: {
    heading: "Preguntas, respondidas",
    lead: "Demos cortas a la izquierda, respuestas directas a la derecha. Elige una pregunta o un clip.",
    clipsLabel: "Clips",
    placeholder: "Clip de demo próximamente",
    play: "Reproducir demo",
    pause: "Pausar demo",
    items: [
      { id: "environments", clip: "Entornos", duration: 20, question: "¿Qué construye exactamente Talos Code?", answer: "Entornos tecnológicos a medida para tu negocio: el sitio web, las apps y las herramientas internas, conectados para que tu operación diaria funcione sobre un sistema coherente y no sobre software suelto." },
      { id: "loyalty", clip: "Lealtad", duration: 25, question: "¿Cómo funcionan los programas de lealtad con Apple Wallet y Google Wallet?", answer: "Tus clientes agregan un pase digital a la billetera de su teléfono con un toque. Los puntos, sellos y ofertas se actualizan en el propio pase y puedes notificarlos sin pedirles instalar nada." },
      { id: "platforms", clip: "Web y móvil", duration: 20, question: "¿Necesito un sitio web, una app móvil o ambos?", answer: "Partimos de cómo te encuentran tus clientes. Muchas veces una plataforma web mobile-first con experiencia instalable cubre ambos casos, y solo sumamos una app nativa cuando justifica su costo." },
      { id: "delivery", clip: "Entrega", duration: 15, question: "¿Cuánto tarda un proyecto?", answer: "Depende del alcance. Dividimos el trabajo en fases con un resultado definido cada una, así recibes pronto una primera versión funcionando y sigues construyendo sobre algo real." },
      { id: "scale", clip: "Escala", duration: 30, question: "¿Seguirá funcionando cuando mi negocio crezca?", answer: "Sí. Usamos una arquitectura modular, infraestructura estándar y documentación clara, de modo que nuevas funciones, sucursales o volumen se suman sin reconstruir lo que ya funciona." },
    ],
  },
  build: { heading: "Construido en vivo, línea a línea", lead: "Así se arma un entorno: primero la estructura y después el nodo entra en línea." },
  footer: {
    descriptor: "Consultoría tecnológica y desarrollo de software",
    copyright: "© Talos Code",
  },
};

export const dictionaries: Record<Locale, Dictionary> = { en, es };
