import { Particle } from '../types';

export function calculateNodeSize(liquidity: number, viewportWidth: number = 1280, isHub: boolean = false): number {
  // Logarithmic scaling for better visual distribution
  const isMobile = viewportWidth <= 480;
  const isTablet = viewportWidth > 480 && viewportWidth <= 1024;

  const minSize = isMobile ? 8 : isTablet ? 10 : 12;
  const maxSize = isMobile ? 24 : isTablet ? 36 : 48;
  const logLiquidity = Math.log10(Math.max(1, liquidity));
  const normalizedSize = (logLiquidity - 6) / (12 - 6); // Normalize between 1M and 1T
  const baseSize = Math.max(minSize, Math.min(maxSize, minSize + normalizedSize * (maxSize - minSize)));

  // Dynamic scale factor based on screen height and width to prevent clutter and ensure precise fit
  const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 600;
  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 800;
  const scaleFactor = Math.max(0.55, Math.min(1.1, Math.min(screenWidth / 1100, screenHeight / 750)));

  const finalSize = baseSize * scaleFactor;

  if (!isHub) return finalSize;
  return Math.min(maxSize * 1.25, finalSize * (isMobile ? 1.1 : 1.2));
}

export function getNodeColor(change24h: number, change7d: number): string {
  if (Math.abs(change24h) > 15 || Math.abs(change7d) > 30) {
    return '#eab308'; // Yellow for high volatility
  }
  if (change24h > 3) {
    return '#22c55e'; // Green for growth
  }
  if (change24h < -3) {
    return '#ef4444'; // Red for decline
  }
  return '#6b7280'; // Gray for stable
}

export function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `particle-${i}-${Math.random().toString(36).substr(2, 9)}`,
    progress: Math.random(),
    speed: 0.008 + Math.random() * 0.015,
    size: 3 + Math.random() * 3
  }));
}
