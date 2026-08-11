export const BUILDER_TITLES = [
  'Fullstack Alchemist',
  'Wasm Wizard',
  'Solana Scholar',
  'Chaos Architect',
  'Rust Evangelist',
  'AI Prompt Whisperer',
  'Goa Hackathon Veteran',
  'Zero-Knowledge Ninja',
  'Pixel Perfectionist',
  'Frontend Sorcerer',
  'Backend Warlock',
  'Smart Contract Surgeon',
  'Latency Destroyer',
  'System Design Guru',
  'Cyberpunk Hacker',
  'Goa Beach Coder'
];

export function getRandomTitle(): string {
  const index = Math.floor(Math.random() * BUILDER_TITLES.length);
  return BUILDER_TITLES[index];
}
