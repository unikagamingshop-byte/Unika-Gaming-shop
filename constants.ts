
import { Game } from './types';

// Direct link for Google Drive image hosted at: https://drive.google.com/file/d/1xH4sDreOkgrsP5-0PZoFyRS6v6aI7pxk/view
export const LOGO_URL = "https://lh3.googleusercontent.com/d/1xH4sDreOkgrsP5-0PZoFyRS6v6aI7pxk"; 

export const GAMES: Game[] = [
  {
    id: 'pubg-mobile',
    name: 'PUBG Mobile',
    category: 'Top Up',
    image: 'https://picsum.photos/seed/pubg/600/800',
    badge: 'Instant',
    packages: [
      { id: 'uc1', amount: 60, label: '60 UC', price: 115 },
      { id: 'uc2', amount: 325, label: '325 UC', price: 580, bonus: '+25 Bonus' },
      { id: 'uc3', amount: 660, label: '660 UC', price: 1150, bonus: '+60 Bonus' },
      { id: 'uc4', amount: 1800, label: '1800 UC', price: 2850, bonus: '+200 Bonus' },
    ]
  },
  {
    id: 'valorant',
    name: 'Valorant',
    category: 'Top Up',
    image: 'https://picsum.photos/seed/valorant/600/800',
    packages: [
      { id: 'vp1', amount: 475, label: '475 VP', price: 550 },
      { id: 'vp2', amount: 1000, label: '1000 VP', price: 1100 },
      { id: 'vp3', amount: 2050, label: '2050 VP', price: 2150 },
    ]
  },
  {
    id: 'mlbb',
    name: 'Mobile Legends',
    category: 'Top Up',
    image: 'https://picsum.photos/seed/mlbb/600/800',
    badge: 'Popular',
    packages: [
      { id: 'dia1', amount: 86, label: '86 Diamonds', price: 165 },
      { id: 'dia2', amount: 172, label: '172 Diamonds', price: 330 },
      { id: 'dia3', amount: 257, label: '257 Diamonds', price: 490 },
    ]
  },
  {
    id: 'freefire',
    name: 'Free Fire',
    category: 'Top Up',
    image: 'https://picsum.photos/seed/freefire/600/800',
    packages: [
      { id: 'ff1', amount: 100, label: '100 Diamonds', price: 110 },
      { id: 'ff2', amount: 310, label: '310 Diamonds', price: 320 },
      { id: 'ff3', amount: 520, label: '520 Diamonds', price: 530 },
    ]
  },
  {
    id: 'genshin',
    name: 'Genshin Impact',
    category: 'Top Up',
    image: 'https://picsum.photos/seed/genshin/600/800',
    packages: [
      { id: 'gc1', amount: 60, label: '60 Genesis Crystals', price: 115 },
      { id: 'gc2', amount: 300, label: '300 Genesis Crystals', price: 580 },
      { id: 'gc3', amount: 980, label: '980 Genesis Crystals', price: 1650 },
    ]
  },
  {
    id: 'star-rail',
    name: 'Honkai: Star Rail',
    category: 'Top Up',
    image: 'https://picsum.photos/seed/starrail/600/800',
    packages: [
      { id: 'sr1', amount: 60, label: '60 Oneiric Shards', price: 115 },
      { id: 'sr2', amount: 300, label: '300 Oneiric Shards', price: 580 },
    ]
  },
  {
    id: 'itunes',
    name: 'iTunes Gift Card',
    category: 'Gift Card',
    image: 'https://picsum.photos/seed/itunes/600/800',
    packages: [
      { id: 'it1', amount: 10, label: '$10 Card', price: 1350 },
      { id: 'it2', amount: 25, label: '$25 Card', price: 3200 },
    ]
  },
  {
    id: 'netflix',
    name: 'Netflix',
    category: 'Subscription',
    image: 'https://picsum.photos/seed/netflix/600/800',
    packages: [
      { id: 'nx1', amount: 1, label: '1 Month Basic', price: 1100 },
      { id: 'nx2', amount: 1, label: '1 Month Premium', price: 1750 },
    ]
  }
];
