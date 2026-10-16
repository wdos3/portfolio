export type IconName = 'user' | 'education' | 'experience' | 'code' | 'mail' | 'github' | 'linkedin' | 'location' | 'chess' | 'instruction' | 'audio' | 'automation' | 'folder' | 'close' | 'research' | 'experiment' | 'download' | 'back' | 'link';
export type WorkCategory = 'software' | 'research' | 'experiments';

export interface ContentBlock {
  title: string;
  subtitle?: string;
  text?: string;
  items?: readonly string[];
  links?: readonly { label: string; url: string }[];
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
// LinkedIn profile reviewed on 2026-10-16. Unfinished credentials remain study
// goals; the profile's unsubstantiated face-detection comparison is not a result.
export const portfolio = {
  name: 'LE TRI LAM',
  subtitle: 'Software Development · Machine Learning',
  about: [
    {
      id: 'profile',
      kind: 'about',
      name: 'Profile',
      icon: 'user',
      placeholder: false,
      introduction: 'Full stack developer focused on cloud technologies, currently pursuing a master’s in Computer Science and Engineering at Sogang University.',
      blocks: [
        {
          title: 'Development and research',
          text: 'My work spans web development, cloud technologies, and data analysis. My projects and research interests include chess applications, Minecraft modifications, face detection models, and measures against image data scraping.',
        },
        {
          title: 'Currently',
          text: 'Studying Computer Science and Engineering at Sogang University (March 2026 – expected December 2027), with skills in artificial intelligence, data analytics, and software development. My chess website is an ongoing development project.',
        },
        {
          title: 'Languages',
          items: ['English — fluent / native-level proficiency', 'Vietnamese — fluent / native-level proficiency', 'TOEFL iBT — 117'],
        },
        {
          title: 'Professional development',
          text: 'Study goals include AWS Certified Cloud Practitioner, AWS Certified Developer – Associate, AWS Certified Solutions Architect – Associate, and the Google Project Management Certificate.',
        },
      ],
    },
    {
      id: 'education',
      kind: 'about',
      name: 'Education',
      icon: 'education',
      placeholder: false,
      introduction: 'Computer science and cloud technologies, with ongoing postgraduate study at Sogang University.',
      blocks: [
        {
          title: 'Master’s in Computer Science and Engineering',
          subtitle: 'Sogang University · Mar 2026 – Dec 2027 (expected)',
          text: 'Computer Science. Associated skills: artificial intelligence, data analytics, and software development.',
        },
        {
          title: 'Bachelor of Science — Computer Science',
          subtitle: 'British University Vietnam · Oct 2020 – Oct 2023',
          text: 'Completed a BSc in Cloud Technologies. Activities and societies: Data Science Club.',
        },
        {
          title: 'High School Diploma',
          subtitle: 'St Joseph’s Institution International (SJII) · Jan 2017 – Dec 2019',
          text: 'Activities and societies: Chess Club, Food Delivery Club, and Cultural Music Club.',
        },
        {
          title: 'Google Data Analytics Specialization',
          subtitle: 'Google · Issued Jul 2024',
          text: 'Credential ID: AH2XSKS3VCMJ',
          links: [{ label: 'Verify credential', url: 'https://www.coursera.org/account/accomplishments/specialization/AH2XSKS3VCMJ' }],
        },
        {
          title: 'Google Advanced Data Analytics Specialization',
          subtitle: 'Google · Issued Sep 2024',
          text: 'Credential ID: OTQ2K5W9PEOL',
          links: [{ label: 'Verify credential', url: 'https://www.coursera.org/account/accomplishments/specialization/OTQ2K5W9PEOL' }],
        },
        {
          title: 'Google IT Automation with Python Specialization',
          subtitle: 'Google · Issued Jul 2024',
          text: 'Credential ID: HHQ3K3MRCW2V',
          links: [{ label: 'Verify credential', url: 'https://www.coursera.org/account/accomplishments/specialization/HHQ3K3MRCW2V' }],
        },
        {
          title: 'JavaScript Algorithms and Data Structures',
          subtitle: 'freeCodeCamp · Issued Sep 2021',
          links: [{ label: 'Verify credential', url: 'https://freecodecamp.org/certification/fcc3c2efd3d-1d97-4c07-9cf0-9dcdf0598861/javascript-algorithms-and-data-structures' }],
        },
      ],
    },
    {
      id: 'experience',
      kind: 'about',
      name: 'Experience',
      icon: 'experience',
      placeholder: false,
      introduction: 'Software development experience in cryptography and programming, alongside mathematics tutoring.',
      blocks: [
        {
          title: 'Software Developer — Internship',
          subtitle: 'FPT Software · Jul 2023 – Nov 2023 · Hanoi, Vietnam · On-site',
          text: 'Worked on a cryptography module to support encrypted communications between devices.',
          items: ['Amazon EC2', 'Mathematics'],
        },
        {
          title: 'Software Programmer — Part-time',
          subtitle: 'HADTech · Jun 2020 – Jun 2022 · Hanoi, Vietnam',
          items: ['Python'],
        },
        {
          title: 'Math Tutor',
          subtitle: 'Hexagon Math Center',
          text: 'Mathematics tutoring.',
        },
      ],
    },
    {
      id: 'skills',
      kind: 'about',
      name: 'Skills',
      icon: 'code',
      placeholder: false,
      introduction: 'Programming, cloud services, data analysis, and research skills developed through study and software projects.',
      blocks: [
        { title: 'Programming and web', items: ['Python', 'Java', 'JavaScript', 'HTML', 'SQL', 'R'] },
        { title: 'Cloud and databases', items: ['Amazon Web Services (AWS)', 'AWS Lambda', 'AWS Identity and Access Management (IAM)', 'Amazon EC2', 'Amazon RDS', 'Amazon DynamoDB', 'MySQL'] },
        { title: 'AI, data, and research', items: ['Artificial Intelligence (AI)', 'Data Analysis', 'Data Analytics', 'Tableau', 'Research Skills', 'Mathematics', 'Analytical Skills'] },
        { title: 'Development and collaboration', items: ['Software Development', 'Communication', 'Problem Solving', 'Adaptive Learning', 'Strategy', 'Time Management'] },
        { title: 'Developing familiarity', items: ['CSS', 'C++', 'MongoDB', 'Google Cloud Platform (GCP)'] },
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
    { id: 'email', kind: 'contact', name: 'Email', icon: 'mail', type: 'email', value: 'letrilam2001@gmail.com' },
    { id: 'github', kind: 'contact', name: 'GitHub', icon: 'github', type: 'external', value: 'https://github.com/wdos3' },
    { id: 'linkedin', kind: 'contact', name: 'LinkedIn', icon: 'linkedin', type: 'external', value: 'https://www.linkedin.com/in/le-tri-lam-638313223/' },
    { id: 'location', kind: 'contact', name: 'Location', icon: 'location', type: 'location', value: 'Hanoi Capital Region' },
  ] satisfies ContactEntry[],
  projects: [
    {
      id: 'chess-web-app',
      kind: 'project',
      name: 'Chess Web App',
      icon: 'chess',
      category: 'software',
      placeholder: false,
      description: 'A chess website in ongoing development.',
      problem: null,
      contributions: ['Developing a chess website.'],
      challenges: [],
      results: null,
      technologies: [],
      status: 'In development',
      repositoryUrl: null,
      demoUrl: null,
    },
    {
      id: 'minecraft-modifications',
      kind: 'project',
      name: 'Minecraft Modifications',
      icon: 'code',
      category: 'software',
      placeholder: false,
      description: 'Custom modifications published for multiple versions of Minecraft.',
      problem: 'Extending Minecraft through custom modifications across different game versions.',
      contributions: ['Built and published modifications for several versions of Minecraft.', 'Worked with Gradle and the Minecraft Forge API.'],
      challenges: ['Supporting multiple versions of Minecraft.'],
      results: 'Published modifications for multiple Minecraft versions.',
      technologies: ['Gradle', 'Minecraft Forge API'],
      status: 'Published',
      repositoryUrl: null,
      demoUrl: null,
    },
    {
      id: 'openlibrary-project',
      kind: 'project',
      name: 'OpenLibrary Integration',
      icon: 'instruction',
      category: 'software',
      placeholder: false,
      description: 'A library project that retrieves data through the OpenLibrary API.',
      problem: 'Integrating library data from an external API.',
      contributions: ['Built a library project with API requests to OpenLibrary.'],
      challenges: [],
      results: null,
      technologies: ['OpenLibrary API'],
      status: 'Not specified',
      repositoryUrl: null,
      demoUrl: null,
    },
    {
      id: 'face-detection-models',
      kind: 'project',
      name: 'Face Detection Models',
      icon: 'research',
      category: 'research',
      placeholder: false,
      description: 'Exploration of face detection models and the tradeoff between accuracy and runtime performance.',
      problem: 'Detecting faces while balancing accuracy and processing speed.',
      contributions: ['Developed a face detection model.'],
      challenges: ['Improving runtime performance while preserving detection accuracy.'],
      results: null,
      technologies: [],
      status: 'Experimental',
      repositoryUrl: null,
      demoUrl: null,
    },
    {
      id: 'image-data-scraping',
      kind: 'project',
      name: 'Measures Against Image Data Scraping',
      icon: 'research',
      category: 'research',
      placeholder: false,
      description: 'Research into measures against image data scraping.',
      problem: 'Protecting image data from scraping.',
      contributions: [],
      challenges: [],
      results: null,
      technologies: [],
      status: 'Not specified',
      repositoryUrl: null,
      demoUrl: null,
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
    { id: 'research', kind: 'collection', name: 'AI / ML Research', icon: 'research', description: 'Research on face detection models and measures against image data scraping.' },
    { id: 'experiments', kind: 'collection', name: 'Experiments', icon: 'experiment', description: 'Focused explorations in code and machine learning, with space for methods, observations, and open questions.' },
  ] satisfies WorkEntry[],
};

export const sections: readonly PortfolioSection[] = [
  { id: 'about', title: 'About', icon: 'user', variant: 'left', entries: portfolio.about },
  { id: 'work', title: 'Work', icon: 'folder', variant: 'center', entries: portfolio.work },
  { id: 'contact', title: 'Contact', icon: 'mail', variant: 'right', entries: portfolio.contact },
];
