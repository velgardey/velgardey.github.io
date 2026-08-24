export interface PlanetDef {
  id: string;
  label: string;
  color: string;
  /** External URL opened when the planet is hit (resume, socials). */
  url?: string;
}

export interface ProjectInfo extends PlanetDef {
  oneLiner: string;
  description: string;
  tech: string[];
}

export const PROFILE = {
  name: 'Mriganka Dey',
  tagline: 'Welcome to my corner of the cosmos',
} as const;

export const RESUME_URL =
  'https://drive.google.com/file/d/1CXzOWOduSh0ht00PQGUxPpgxpdD6In0n/view?usp=sharing';

export const NAV_PLANETS: PlanetDef[] = [
  { id: 'projects', label: 'Projects', color: '#3A86FF' },
  { id: 'resume', label: 'Resume', color: '#8338EC', url: RESUME_URL },
  { id: 'contact', label: 'Contact', color: '#FF006E' },
];

export const BACK_PLANET: PlanetDef = { id: 'back', label: 'Back', color: '#FB5607' };

export const PROJECTS: ProjectInfo[] = [
  {
    id: 'yok',
    label: 'Yok',
    color: '#FFD166',
    url: 'https://github.com/velgardey/yok',
    oneLiner: 'Deploy web apps straight from Git',
    description:
      'A self-built deployment platform: point Yok at a Git repository and it builds, ships and runs the app. API server, ECS build runners, a Kafka event bus and a ClickHouse log store — the whole pipeline.',
    tech: ['Go', 'Node.js', 'Kafka', 'AWS ECS', 'ClickHouse'],
  },
  {
    id: 'melior',
    label: 'Melior',
    color: '#00B4D8',
    url: 'https://github.com/velgardey/melior',
    oneLiner: 'A coding agent that improves itself',
    description:
      'Skill-native coding agent harness on LangGraph. Runs a plan–validate–execute–reflect loop with typed skill contracts, a correction queue and a hermetic offline benchmark for measuring its own growth.',
    tech: ['Python', 'LangGraph', 'LLM Agents'],
  },
  {
    id: 'find-your-flick',
    label: 'Find Your Flick',
    color: '#FF6B6B',
    url: 'https://github.com/velgardey/find-your-flick',
    oneLiner: 'AI-powered social movie discovery',
    description:
      'Your personal movie companion that blends AI recommendations with a vibrant community: taste matching, friend activity feeds and suggestions from people whose taste you actually trust.',
    tech: ['Next.js', 'TypeScript', 'Firebase', 'Prisma'],
  },
  {
    id: 'chet',
    label: 'CHET',
    color: '#3A86FF',
    url: 'http://13.235.103.165/',
    oneLiner: 'Realtime multi-user chat',
    description:
      'A private chat platform supporting simultaneous multi-user sessions in realtime, deployed on AWS for scalability and reliability.',
    tech: ['TypeScript', 'WebSockets', 'AWS'],
  },
  {
    id: 'chess-rogue',
    label: 'Chess Rogue',
    color: '#75D34D',
    url: 'https://velgardey.github.io/chess-rogue/',
    oneLiner: 'Chess where every round breaks the rules',
    description:
      'A dynamic chess game that randomizes piece roles each round, turning familiar openings into ever-changing tactical puzzles. Playable in the browser.',
    tech: ['React', 'TypeScript'],
  },
];

export const CONTACT_PLANETS: PlanetDef[] = [
  {
    id: 'linkedin',
    label: 'LinkedIn',
    color: '#0077B5',
    url: 'https://www.linkedin.com/in/mrigankadey/',
  },
  { id: 'github', label: 'GitHub', color: '#6E5494', url: 'https://github.com/velgardey' },
  { id: 'twitter', label: 'Twitter', color: '#1DA1F2', url: 'https://x.com/velgardey' },
  {
    id: 'discord',
    label: 'Discord',
    color: '#7289DA',
    url: 'https://discordapp.com/users/468278174849957899',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    color: '#E1306C',
    url: 'https://www.instagram.com/velgardey/',
  },
];

export const HINT_TEXT = 'Click or tap to shoot · Tab targets · Enter fires · ? for help';
