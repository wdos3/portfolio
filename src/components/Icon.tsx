import type { ReactNode } from 'react';
import type { IconName } from '../data/portfolio';

const shapes: Record<IconName, ReactNode> = {
  user: <><circle cx="12" cy="8" r="3.2" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></>,
  education: <><path d="m2 8 10-5 10 5-10 5L2 8Zm4 2v6c4 3 8 3 12 0v-6M22 8v8" /></>,
  experience: <><rect x="3" y="7" width="18" height="14" rx="1" /><path d="M8 7V3h8v4M3 12c6 4 12 4 18 0M10 13v3h4v-3" /></>,
  code: <><path d="m7 6-5 6 5 6m10-12 5 6-5 6M14 3l-4 18" /></>,
  mail: <><rect x="2" y="4" width="20" height="16" rx="1" /><path d="m2 5 10 8L22 5" /></>,
  github: <><path d="M9 20c-5 1.5-5-2.5-7-3m14 5v-3.9c0-1.1-.3-1.8-.8-2.3 2.7-.3 5.5-1.3 5.5-6A4.7 4.7 0 0 0 19.4 6c.1-.4.6-1.9-.1-3.7 0 0-1.1-.3-3.8 1.4a13 13 0 0 0-7 0C5.8 2 4.7 2.3 4.7 2.3 4 4.1 4.5 5.6 4.6 6a4.7 4.7 0 0 0-1.3 3.8c0 4.7 2.8 5.7 5.5 6-.4.4-.8 1.1-.8 2.2v4" /></>,
  linkedin: <><rect x="2" y="2" width="20" height="20" rx="1" /><path d="M7 10v7m4-7v7m0-4a3 3 0 0 1 6 0v4" /><circle cx="7" cy="7" r=".6" fill="currentColor" /></>,
  location: <><path d="M19 10c0 5-7 12-7 12S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  chess: <><path d="M5 21h14l-2-4h-2c-1-4 3-6 2-11l-4-4-1 4-5 3-2 4 5 1 2-2M8 17h9" /><circle cx="13" cy="8" r=".55" fill="currentColor" /></>,
  instruction: <><rect x="2" y="3" width="20" height="18" rx="1" /><path d="M2 8h20M8 8v13m4-9h6m-6 4h4" /></>,
  audio: <><path d="M2 10v4m4-8v12m4-16v20m4-15v10m4-13v16m4-10v4" /></>,
  automation: <><path d="m7 4 2 3-2 3M13 10h4M3 14h18M5 22l3-4m11 4-3-4" /><rect x="2" y="1" width="20" height="17" rx="1" /></>,
  folder: <path d="M2 6V4h7l2 3h11v13H2V6Z" />,
  close: <path d="m5 5 14 14M19 5 5 19" />,
  research: <><circle cx="12" cy="12" r="3" /><circle cx="4" cy="5" r="2" /><circle cx="20" cy="5" r="2" /><circle cx="4" cy="20" r="2" /><circle cx="20" cy="20" r="2" /><path d="m6 7 4 3m4 0 4-3M6 18l4-4m4 0 4 4" /></>,
  experiment: <><path d="M8 2h8m-6 0v7L3 21h18L14 9V2M7 15h10" /><circle cx="11" cy="18" r=".5" fill="currentColor" /></>,
  download: <><path d="M12 2v13m-5-5 5 5 5-5M4 17v5h16v-5" /></>,
  back: <path d="m10 5-7 7 7 7M3 12h18" />,
  link: <><path d="m10 7 2-2a5 5 0 0 1 7 7l-2 2m-3 3-2 2a5 5 0 0 1-7-7l2-2m1 6 8-8" /></>,
};

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {shapes[name]}
    </svg>
  );
}
