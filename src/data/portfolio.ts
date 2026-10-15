export interface ContentBlock {
  title: string;
  subtitle?: string;
  text?: string;
  items?: readonly string[];
}

export interface AboutEntry {
  id: string;
  kind: 'about';
  name: string;
  introduction: string;
  blocks: readonly ContentBlock[];
  placeholder: boolean;
}

export interface ContactEntry {
  id: string;
  kind: 'contact';
  name: string;
  type: 'email' | 'external' | 'location';
  value: string | null;
}

export interface ProjectEntry {
  id: string;
  kind: 'project';
  name: string;
  description: string;
  technologies: readonly string[];
  status: string;
  repositoryUrl: string | null;
  demoUrl: string | null;
  extendedDescription?: string;
  placeholder: boolean;
}

export type PortfolioEntry = AboutEntry | ContactEntry | ProjectEntry;
export type SectionId = 'about' | 'contact' | 'projects';
export type WheelVariant = 'left' | 'center' | 'right';

export interface PortfolioSection {
  id: SectionId;
  title: string;
  variant: WheelVariant;
  entries: readonly PortfolioEntry[];
}

// All editable identity, profile, contact, and project content lives here.
// null means unavailable: no fabricated addresses or destination links are rendered.
export const portfolio = {
  name: 'LE TRI LAM',
  subtitle: 'Developer · AI / ML · Graduate Student',
  about: [
    {
      id: 'about-me',
      kind: 'about',
      name: 'About Me',
      placeholder: true,
      introduction: 'Exploring the space between thoughtful software and intelligent systems.',
      blocks: [
        {
          title: 'A little introduction',
          text: 'Use this space to introduce yourself, the problems you enjoy solving, and what draws you to development and AI / ML.',
        },
        {
          title: 'Currently',
          text: 'Add your current research focus, what you are building, or what you would like to learn next.',
        },
      ],
    },
    {
      id: 'education',
      kind: 'about',
      name: 'Education',
      placeholder: true,
      introduction: 'A place for academic foundations and ongoing exploration.',
      blocks: [
        {
          title: 'Degree / program',
          subtitle: 'University · Dates',
          text: 'Add your degree, university, study period, and relevant coursework here.',
        },
        {
          title: 'Research interests',
          text: 'Describe your research area, thesis topic, or questions you are currently exploring.',
        },
      ],
    },
    {
      id: 'experience',
      kind: 'about',
      name: 'Experience',
      placeholder: true,
      introduction: 'Learning through building, collaborating, and solving practical problems.',
      blocks: [
        {
          title: 'Role / position',
          subtitle: 'Organization · Dates',
          text: 'Describe your responsibilities, the systems you worked on, and the impact of your contributions.',
        },
        {
          title: 'Research / independent work',
          text: 'Add relevant research, open-source contributions, internships, or independent development work.',
        },
      ],
    },
    {
      id: 'skills',
      kind: 'about',
      name: 'Skills',
      placeholder: true,
      introduction: 'A considered toolkit. Replace these examples with your own experience.',
      blocks: [
        { title: 'Languages · examples', items: ['Python', 'TypeScript', 'JavaScript'] },
        { title: 'Development · examples', items: ['React', 'Git', 'Web development', 'Automation'] },
        { title: 'Areas · examples', items: ['Machine learning', 'Data visualization', 'Audio experiments'] },
      ],
    },
  ] satisfies AboutEntry[],
  contact: [
    { id: 'email', kind: 'contact', name: 'Email', type: 'email', value: null },
    { id: 'github', kind: 'contact', name: 'GitHub', type: 'external', value: null },
    { id: 'linkedin', kind: 'contact', name: 'LinkedIn', type: 'external', value: null },
    { id: 'location', kind: 'contact', name: 'Location', type: 'location', value: null },
  ] satisfies ContactEntry[],
  projects: [
    {
      id: 'chess-web-app',
      kind: 'project',
      name: 'Chess Web App',
      placeholder: true,
      description: 'An interactive space to play, study, and explore chess on the web.',
      technologies: ['TypeScript', 'React'],
      status: 'Sample project',
      repositoryUrl: null,
      demoUrl: null,
      extendedDescription: 'Add the actual project overview here: its rules and features, your role, and the engineering decisions behind it.',
    },
    {
      id: 'visual-instruction-tool',
      kind: 'project',
      name: 'Visual Instruction Tool',
      placeholder: true,
      description: 'Exploring how visual interfaces can make complex instructions easier to understand.',
      technologies: ['Python', 'TypeScript', 'React'],
      status: 'Sample project',
      repositoryUrl: null,
      demoUrl: null,
      extendedDescription: 'Replace this description with the tool’s purpose, intended users, and approach to presenting information.',
    },
    {
      id: 'audio-ml-experiments',
      kind: 'project',
      name: 'Audio ML Experiments',
      placeholder: true,
      description: 'A collection of experiments at the intersection of sound and machine learning.',
      technologies: ['Python', 'PyTorch', 'Audio processing'],
      status: 'Sample project',
      repositoryUrl: null,
      demoUrl: null,
      extendedDescription: 'Describe the experiments, datasets, and methods you actually used. Add measured results only when available.',
    },
    {
      id: 'automation-tools',
      kind: 'project',
      name: 'Automation Tools',
      placeholder: true,
      description: 'Small, focused tools that turn repetitive tasks into simpler workflows.',
      technologies: ['Python', 'JavaScript'],
      status: 'Sample project',
      repositoryUrl: null,
      demoUrl: null,
      extendedDescription: 'Introduce your tools, which workflows they support, and how they are used. Add individual repository links when ready.',
    },
  ] satisfies ProjectEntry[],
};

export const sections: readonly PortfolioSection[] = [
  { id: 'about', title: 'About', variant: 'left', entries: portfolio.about },
  { id: 'contact', title: 'Contact', variant: 'center', entries: portfolio.contact },
  { id: 'projects', title: 'Projects', variant: 'right', entries: portfolio.projects },
];
