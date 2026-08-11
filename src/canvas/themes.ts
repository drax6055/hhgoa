export interface ThemeConfig {
  id: string;
  name: string;
  gradientStart: string;
  gradientEnd: string;
  accentColor: string;
  textColor: string;
  badgeBg: string;
  badgeText: string;
  swatchGradient: string;
}

export const THEMES: Record<string, ThemeConfig> = {
  neon: {
    id: 'neon',
    name: 'Goa Neon',
    gradientStart: '#00f2fe',
    gradientEnd: '#9d4edd',
    accentColor: '#00f2fe',
    textColor: '#ffffff',
    badgeBg: 'rgba(0, 242, 254, 0.15)',
    badgeText: '#00f2fe',
    swatchGradient: 'linear-gradient(135deg, #00f2fe, #9d4edd)'
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset Code',
    gradientStart: '#ff7518',
    gradientEnd: '#ff007f',
    accentColor: '#ffd700',
    textColor: '#ffffff',
    badgeBg: 'rgba(255, 117, 24, 0.2)',
    badgeText: '#ffd700',
    swatchGradient: 'linear-gradient(135deg, #ff7518, #ff007f)'
  },
  cyber: {
    id: 'cyber',
    name: 'Cyber Minimal',
    gradientStart: '#10b981',
    gradientEnd: '#06b6d4',
    accentColor: '#10b981',
    textColor: '#ffffff',
    badgeBg: 'rgba(16, 185, 129, 0.2)',
    badgeText: '#10b981',
    swatchGradient: 'linear-gradient(135deg, #10b981, #06b6d4)'
  },
  tropical: {
    id: 'tropical',
    name: 'Tropical Byte',
    gradientStart: '#f59e0b',
    gradientEnd: '#ec4899',
    accentColor: '#38bdf8',
    textColor: '#ffffff',
    badgeBg: 'rgba(245, 158, 11, 0.2)',
    badgeText: '#f59e0b',
    swatchGradient: 'linear-gradient(135deg, #f59e0b, #ec4899)'
  }
};
