export type IconName = 'user' | 'education' | 'experience' | 'code' | 'mail' | 'github' | 'linkedin' | 'location' | 'chess' | 'instruction' | 'audio' | 'automation' | 'folder' | 'close' | 'research' | 'experiment' | 'download' | 'back' | 'link';
export type WorkCategory = 'software' | 'research' | 'experiments';

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
  icon: IconName;
  introduction: string;
  blocks: readonly ContentBlock[];
  placeholder: boolean;
}

export interface ContactEntry {
  id: string;
  kind: 'contact';
  name: string;
  icon: IconName;
  type: 'email' | 'external' | 'location';
  value: string | null;
}

export interface ProjectEntry {
  id: string;
  kind: 'project';
  name: string;
  icon?: IconName;
  category: WorkCategory;
  description: string;
  problem: string | null;
  contributions: readonly string[];
  challenges: readonly string[];
  results: string | null;
  technologies: readonly string[];
  status: string;
  repositoryUrl: string | null;
  demoUrl: string | null;
  extendedDescription?: string;
  placeholder: boolean;
}

export interface ResumeEntry {
  id: string;
  kind: 'resume';
  name: string;
  icon: IconName;
  description: string;
  url: string | null;
  fileName: string;
}

export interface WorkEntry {
  id: WorkCategory;
  kind: 'collection';
  name: string;
  icon: IconName;
  description: string;
}

export type PortfolioEntry = AboutEntry | ContactEntry | ResumeEntry | WorkEntry;
export type SectionId = 'about' | 'work' | 'contact';
export type WheelVariant = 'left' | 'center' | 'right';

export interface PortfolioSection {
  id: SectionId;
  title: string;
  icon: IconName;
  variant: WheelVariant;
  entries: readonly PortfolioEntry[];
}

// All editable identity, profile, contact, and project content lives here.
// null means unavailable: no fabricated addresses or destination links are rendered.
export const portfolio = {
  name: 'LE TRI LAM',
  subtitle: 'Software Development · Machine Learning',
  about: [
    {
      id: 'profile',
      kind: 'about',
      name: 'Profile',
      icon: 'user',
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
      icon: 'education',
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
      icon: 'experience',
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
      icon: 'code',
      placeholder: true,
      introduction: 'A considered toolkit. Replace these examples with your own experience.',
      blocks: [
        { title: 'Languages · examples', items: ['Python', 'TypeScript', 'JavaScript'] },
        { title: 'Development · examples', items: ['React', 'Git', 'Web development', 'Automation'] },
        { title: 'Areas · examples', items: ['Machine learning', 'Data visualization', 'Audio experiments'] },
      ],
    },
    {
      id: 'resume',
      kind: 'resume',
      name: 'Résumé / CV',
      icon: 'download',
      description: 'An overview of education, experience, and selected work.',
      url: null,
      fileName: 'Le-Tri-Lam-CV.pdf',
    },
  ] satisfies (AboutEntry | ResumeEntry)[],
  contact: [
    { id: 'email', kind: 'contact', name: 'Email', icon: 'mail', type: 'email', value: null },
    { id: 'github', kind: 'contact', name: 'GitHub', icon: 'github', type: 'external', value: null },
    { id: 'linkedin', kind: 'contact', name: 'LinkedIn', icon: 'linkedin', type: 'external', value: null },
    { id: 'location', kind: 'contact', name: 'Location', icon: 'location', type: 'location', value: null },
  ] satisfies ContactEntry[],
  projects: [
    {
      id: 'chess-web-app',
      kind: 'project',
      name: 'Chess Web App',
      icon: 'chess',
      category: 'software',
      placeholder: true,
      description: 'An interactive space to play, study, and explore chess on the web.',
      problem: null,
      contributions: [],
      challenges: [],
      results: null,
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
      icon: 'instruction',
      category: 'software',
      placeholder: true,
      description: 'Exploring how visual interfaces can make complex instructions easier to understand.',
      problem: null,
      contributions: [],
      challenges: [],
      results: null,
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
      icon: 'audio',
      category: 'experiments',
      placeholder: true,
      description: 'A collection of experiments at the intersection of sound and machine learning.',
      problem: null,
      contributions: [],
      challenges: [],
      results: null,
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
      icon: 'automation',
      category: 'software',
      placeholder: true,
      description: 'Small, focused tools that turn repetitive tasks into simpler workflows.',
      problem: null,
      contributions: [],
      challenges: [],
      results: null,
      technologies: ['Python', 'JavaScript'],
      status: 'Sample project',
      repositoryUrl: null,
      demoUrl: null,
      extendedDescription: 'Introduce your tools, which workflows they support, and how they are used. Add individual repository links when ready.',
    },
  ] satisfies ProjectEntry[],
  work: [
    { id: 'software', kind: 'collection', name: 'Software Projects', icon: 'code', description: 'Applications, tools, and systems. Explore the problem, the process, and the work behind each project.' },
    { id: 'research', kind: 'collection', name: 'AI / ML Research', icon: 'research', description: 'Research questions, methods, and evidence. Research entries will appear here when added.' },
    { id: 'experiments', kind: 'collection', name: 'Experiments', icon: 'experiment', description: 'Focused explorations in code and machine learning, with space for methods, observations, and open questions.' },
  ] satisfies WorkEntry[],
};

export const sections: readonly PortfolioSection[] = [
  { id: 'about', title: 'About', icon: 'user', variant: 'left', entries: portfolio.about },
  { id: 'work', title: 'Work', icon: 'folder', variant: 'center', entries: portfolio.work },
  { id: 'contact', title: 'Contact', icon: 'mail', variant: 'right', entries: portfolio.contact },
];
