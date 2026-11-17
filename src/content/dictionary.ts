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
  divoid: { published: true, url: "https://dvoid.vercel.app/", image: "/projects/dvoid.jpg" },
  // Paused for now: the copy is ready below, flip `published` to show them.
  matambre: { published: false },
};

export interface ServiceCopy {
  readonly id: ServiceId;
  readonly name: string;
  readonly description: string;
  readonly when: string;
  readonly example: string;
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
    readonly details: { readonly includes: string; readonly when: string; readonly example: string };
    readonly items: readonly ServiceCopy[];
  };
  readonly work: {
    readonly heading: string;
    readonly visit: string;
    readonly projects: readonly ProjectCopy[];
  };
  readonly about: {
    readonly heading: string;
    readonly intro: string;
    readonly members: Readonly<Record<string, { readonly role: string; readonly bio: string } | undefined>>;
    readonly carousel: {
      readonly label: string;
      readonly roleDescription: string;
      readonly navigation: string;
      readonly previous: string;
      readonly next: string;
      readonly showProfile: string;
      readonly announcement: string;
    };
  };
  readonly contact: {
    readonly heading: string;
    readonly lead: string;
    readonly terminalTitle: string;
    readonly command: string;
    readonly emailLabel: string;
  };
  readonly faq: {
    readonly heading: string;
    readonly lead: string;
    readonly topicsLabel: string;
    readonly videoPending: string;
    readonly videoUnavailable: string;
    readonly items: readonly { readonly id: string; readonly topic: string; readonly question: string; readonly answer: string }[];
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
    lead: "We build websites, mobile apps and connected business systems. Tell us what your business needs, and we’ll help define the right first step.",
    primaryCta: "Start a project",
    secondaryCta: "See our work",
  },
  services: {
    heading: "Services",
    lead: "Choose a service to see what we build and when it may fit your business.",
    details: { includes: "What we build", when: "When it fits", example: "Example" },
    items: [
      {
        id: "web",
        name: "Web architecture",
        description: "Business websites and web platforms, from page structure and responsive interfaces to performance and deployment.",
        when: "When your business needs a website or a platform that customers can use from any browser.",
        example: "An artist’s online catalog with artwork, exhibitions and a space for sales, like the Zalvador Pineda website.",
      },
      {
        id: "mobile",
        name: "Mobile applications",
        description: "Mobile apps and installable web apps, including digital passes for Apple Wallet and Google Wallet.",
        when: "When customers return regularly to a service on their phones, or you want to offer a digital loyalty pass.",
        example: "An installable restaurant web app paired with a loyalty pass that customers keep in their phone’s wallet.",
      },
      {
        id: "integration",
        name: "Business systems integration",
        description: "Connect tools such as CRMs, booking systems, analytics and internal software to reduce duplicate data entry.",
        when: "When your team copies information between tools or needs to see data from several systems together.",
        example: "A venue’s booking system connected to its CRM and customer consumption reports.",
      },
      {
        id: "environments",
        name: "Custom technology environments",
        description: "A combination of websites, apps and business tools planned around your workflows and how your team works.",
        when: "When a project involves several connected tools and their roles, data and workflows need to be planned together.",
        example: "A venue’s operating environment combining reservations, customer analytics, team access and control of on-site screens.",
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
        name: "D-VOID",
        category: "Event portfolio",
        description:
          "A web portfolio of nightlife events in Quito. Browse the archive by month and open each event’s page from the carousel.",
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
    intro: "We are Talos Code, a technology consulting and software development team. We work with you to define the scope, build in stages and document the technical decisions.",
    members: {},
    carousel: {
      label: "Talos Code team",
      roleDescription: "carousel",
      navigation: "Choose a team member",
      previous: "Previous profile",
      next: "Next profile",
      showProfile: "View {name}’s profile",
      announcement: "{name}, {role}. Profile {current} of {total}.",
    },
  },
  contact: {
    heading: "Start with the problem.",
    lead: "Email us with a short description of what you want to build.",
    terminalTitle: "talos:code / contact",
    command: "hello@taloscode.dev",
    emailLabel: "Write to us",
  },
  faq: {
    heading: "Frequently asked questions",
    lead: "Answers to common questions about choosing a platform and planning a project.",
    topicsLabel: "Video topics",
    videoPending: "Video in preparation",
    videoUnavailable: "Video unavailable",
    items: [
      { id: "environments", topic: "What we build", question: "What does Talos Code build?", answer: "Websites, mobile apps and business tools, connected according to the needs of each project." },
      { id: "loyalty", topic: "Loyalty", question: "Can you build digital loyalty passes?", answer: "Yes. We build digital passes for Apple Wallet and Google Wallet, including mobile-first web experiences for customers." },
      { id: "platforms", topic: "Web and mobile", question: "Do I need a website, an app, or both?", answer: "A mobile-friendly website can be enough when customers mainly need information or a simple service. An installable web app or native app can make sense when people return often or need specific device features. The right choice depends on your customers and workflows." },
      { id: "delivery", topic: "Planning", question: "How is a project planned?", answer: "We start by defining the requirements and scope, then agree on stages and deliverables. The timeline depends on the features, integrations and content involved." },
      { id: "scale", topic: "Growth", question: "Can the software change as my business grows?", answer: "We can plan the architecture around the current requirements and expected changes. The right approach depends on the systems, team and scale involved." },
    ],
  },
  build: { heading: "How we build", lead: "We define the scope, make the key technical decisions and develop the software in clear stages." },
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
    headline: ["Software", "a medida"],
    lead: "Creamos sitios web, aplicaciones móviles e integramos los sistemas que usa tu negocio.",
    primaryCta: "Inicia tu proyecto",
    secondaryCta: "Ver proyectos",
  },
  services: {
    heading: "Servicios",
    lead: "Elige un servicio para ver qué construimos y en qué casos puede ayudar a tu negocio.",
    details: { includes: "Qué construimos", when: "Cuándo conviene", example: "Ejemplo" },
    items: [
      {
        id: "web",
        name: "Arquitectura web",
        description: "Sitios y plataformas web para negocios, desde la estructura y las interfaces adaptables hasta el rendimiento y el despliegue.",
        when: "Cuando tu negocio necesita un sitio o una plataforma que sus clientes puedan usar desde cualquier navegador.",
        example: "Un catálogo de arte con obras, exposiciones y un espacio de venta, como el sitio de Zalvador Pineda.",
      },
      {
        id: "mobile",
        name: "Aplicaciones móviles",
        description: "Aplicaciones móviles y web apps instalables, incluidos pases digitales para Apple Wallet y Google Wallet.",
        when: "Cuando los clientes usan un servicio con frecuencia desde el teléfono o quieres ofrecer un pase de fidelización digital.",
        example: "Una web app instalable para un restaurante, acompañada de un pase de fidelización que el cliente guarda en la billetera de su teléfono.",
      },
      {
        id: "integration",
        name: "Integración de sistemas empresariales",
        description: "Conectamos herramientas como CRM, reservas, analítica y sistemas internos para reducir el registro duplicado de datos.",
        when: "Cuando tu equipo copia información entre herramientas o necesita consultar datos de varios sistemas juntos.",
        example: "El sistema de reservas de un local conectado a su CRM y a los reportes de consumo de clientes.",
      },
      {
        id: "environments",
        name: "Entornos tecnológicos a medida",
        description: "Combinamos sitios web, aplicaciones y herramientas según los procesos y la forma de trabajo de tu equipo.",
        when: "Cuando un proyecto reúne varias herramientas conectadas y hay que planificar sus roles, datos y procesos en conjunto.",
        example: "El entorno de operación de un local con reservas, analítica de clientes, accesos del equipo y control de las pantallas del establecimiento.",
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
        name: "D-VOID",
        category: "Portafolio de eventos",
        description:
          "Portafolio web de eventos nocturnos en Quito. El archivo está organizado por mes y cada evento tiene su propia página, accesible desde el carrusel.",
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
    intro: "Somos Talos Code, un equipo de consultoría tecnológica y desarrollo de software. Trabajamos contigo para definir el alcance, construir por etapas y documentar las decisiones técnicas.",
    members: {},
    carousel: {
      label: "Equipo de Talos Code",
      roleDescription: "carrusel",
      navigation: "Elegir integrante del equipo",
      previous: "Perfil anterior",
      next: "Perfil siguiente",
      showProfile: "Ver el perfil de {name}",
      announcement: "{name}, {role}. Perfil {current} de {total}.",
    },
  },
  contact: {
    heading: "Empecemos por el problema.",
    lead: "Escríbenos con una breve descripción de lo que quieres construir.",
    terminalTitle: "talos:code / contacto",
    command: "hello@taloscode.dev",
    emailLabel: "Escríbenos",
  },
  faq: {
    heading: "Preguntas frecuentes",
    lead: "Respuestas a dudas comunes sobre la elección de una plataforma y la planificación de un proyecto.",
    topicsLabel: "Temas de video",
    videoPending: "Video en preparación",
    videoUnavailable: "Video no disponible",
    items: [
      { id: "environments", topic: "Qué construimos", question: "¿Qué construye Talos Code?", answer: "Sitios web, aplicaciones móviles y herramientas empresariales, conectados según las necesidades de cada proyecto." },
      { id: "loyalty", topic: "Fidelización", question: "¿Pueden crear pases de fidelización digitales?", answer: "Sí. Creamos pases digitales para Apple Wallet y Google Wallet, incluidas experiencias web mobile-first para clientes." },
      { id: "platforms", topic: "Web y móvil", question: "¿Necesito un sitio web, una app o ambos?", answer: "Un sitio adaptable puede ser suficiente si tus clientes necesitan información o un servicio sencillo. Una web app instalable o una aplicación nativa puede convenir si regresan con frecuencia o requieren funciones específicas del teléfono. La decisión depende de tus clientes y procesos." },
      { id: "delivery", topic: "Planificación", question: "¿Cómo se planifica un proyecto?", answer: "Primero definimos los requisitos y el alcance. Después acordamos etapas y entregables. El plazo depende de las funciones, integraciones y contenidos necesarios." },
      { id: "scale", topic: "Crecimiento", question: "¿El software puede cambiar cuando crezca mi negocio?", answer: "Podemos planificar la arquitectura según las necesidades actuales y los cambios previstos. El enfoque adecuado depende de los sistemas, el equipo y la escala del negocio." },
    ],
  },
  build: { heading: "Cómo trabajamos", lead: "Definimos el alcance, tomamos las decisiones técnicas necesarias y desarrollamos el software en etapas claras." },
  footer: {
    descriptor: "Consultoría tecnológica y desarrollo de software",
    copyright: "© Talos Code",
  },
};

export const dictionaries: Record<Locale, Dictionary> = { en, es };
