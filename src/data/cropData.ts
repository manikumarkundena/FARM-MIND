import { CropSpec } from '../types';

export const CROP_DATA: Record<string, CropSpec> = {
  WHEAT: {
    name: 'WHEAT',
    seedCost: 10,
    firstHarvestDay: 2,
    maxYieldDay: 4,
    ongoing: false,
    interval: 0,
    maxYield: 6,
    basePrice: 35,
    color: 'text-amber-400',
    badgeBg: 'bg-amber-950/40',
    badgeBorder: 'border-amber-800/60'
  },
  CARROT: {
    name: 'CARROT',
    seedCost: 20,
    firstHarvestDay: 2,
    maxYieldDay: 3,
    ongoing: false,
    interval: 0,
    maxYield: 4,
    basePrice: 45,
    color: 'text-orange-400',
    badgeBg: 'bg-orange-950/40',
    badgeBorder: 'border-orange-800/60'
  },
  TOMATO: {
    name: 'TOMATO',
    seedCost: 50,
    firstHarvestDay: 8,
    maxYieldDay: 8,
    ongoing: true,
    interval: 1,
    maxYield: 4,
    basePrice: 90,
    color: 'text-rose-400',
    badgeBg: 'bg-rose-950/40',
    badgeBorder: 'border-rose-800/60'
  },
  STRAWBERRY: {
    name: 'STRAWBERRY',
    seedCost: 100,
    firstHarvestDay: 10,
    maxYieldDay: 10,
    ongoing: true,
    interval: 2,
    maxYield: 3,
    basePrice: 280,
    color: 'text-pink-400',
    badgeBg: 'bg-pink-950/40',
    badgeBorder: 'border-pink-800/60'
  },
  MELON: {
    name: 'MELON',
    seedCost: 80,
    firstHarvestDay: 10,
    maxYieldDay: 12,
    ongoing: false,
    interval: 0,
    maxYield: 6,
    basePrice: 280,
    color: 'text-emerald-400',
    badgeBg: 'bg-emerald-950/40',
    badgeBorder: 'border-emerald-800/60'
  }
};

export const ENVIRONMENT_SPECS = {
  boardSize: 10,
  totalDays: 30,
  turnsPerDay: 24,
  totalTurns: 720,
  startingCash: 3000,
  shedAccessTiles: ['(4,4)', '(4,5)', '(5,4)', '(5,5)'],
  unlockedQuadrantStart: 'NW (0..4, 0..4)',
  maxMarketOrdersPerTurn: 10,
  maxCarriedCapacity: 6,
  shedCapacity: 100
};
