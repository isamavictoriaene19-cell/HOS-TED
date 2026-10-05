// Centralized visual assets, brand constants, and layman-friendly sizing & color guides for HOS|TED
export const ASSETS = {
  tessyAvatar: '/src/assets/images/tessy_avatar_1791027072291.jpg',
  bubuGold: '/src/assets/images/collection_bubu_gold_1791027086919.jpg',
  ankaraGown: '/src/assets/images/collection_ankara_gown_1791027100541.jpg',
  chicCasual: '/src/assets/images/collection_chic_casual_1791027114692.jpg',
  ankaraCouple: '/src/assets/images/collection_ankara_couple_1791027130621.jpg',
  heroAtelier: '/src/assets/images/hero_fashion_atelier_1791027148678.jpg',
};

export const BRAND_CONTACTS = {
  name: 'HOS|TED',
  fullName: 'HOS|TED',
  slogan: 'HOS|TED Hosting Nations',
  leadDesigner: 'Theresa Isama',
  phone: '09073784461',
  phoneFormatted: '+234 907 378 4461',
  whatsappUrl: 'https://wa.me/2349073784461',
  tiktokHandle: 'theresaisama',
  tiktokUrl: 'https://www.tiktok.com/@theresaisama',
  instagramHandle: 'Tessy Isima',
  instagramUrl: 'https://instagram.com',
  facebookHandle: 'Tessy Isima',
  facebookUrl: 'https://facebook.com',
  location: 'Nationwide Delivery Across All 36 States, FCT Abuja & International',
};

export interface LaymanSizeOption {
  value: string;
  shortLabel: string;
  everydayName: string;
  ukSize: string;
  bodyDescription: string;
  approxInches: {
    bust: string;
    waist: string;
    hips: string;
    shoulder: string;
    dressLength: string;
    sleeveLength: string;
  };
}

// Easy everyday sizing guide so anyone (even without knowing UK sizes or tape measure inches) can pick accurately
export const LAYMAN_SIZE_GUIDE: LaymanSizeOption[] = [
  {
    value: 'Small (Slim / Petite Fit — UK 8)',
    shortLabel: 'Small (Slim Fit)',
    everydayName: 'Slim or Petite Body Build',
    ukSize: 'UK 6–8 (S)',
    bodyDescription: 'Fits a slim/petite frame. Choose this if you normally wear Small in everyday tops or T-shirts.',
    approxInches: { bust: '34', waist: '27', hips: '37', shoulder: '14.5', dressLength: '58', sleeveLength: '22' },
  },
  {
    value: 'Medium (Regular / Average Fit — UK 10–12)',
    shortLabel: 'Medium (Average Fit)',
    everydayName: 'Average / Regular Body Build',
    ukSize: 'UK 10–12 (M)',
    bodyDescription: 'Our most popular everyday fit—not too tight, not too loose. Great for an average build.',
    approxInches: { bust: '37', waist: '30', hips: '40', shoulder: '15.5', dressLength: '59', sleeveLength: '23' },
  },
  {
    value: 'Large (Curvy / Full Fit — UK 14)',
    shortLabel: 'Large (Curvy Fit)',
    everydayName: 'Curvy Hips or Fuller Bust',
    ukSize: 'UK 14 (L)',
    bodyDescription: 'Comfortable room around the chest and hips for a curvy, well-proportioned figure.',
    approxInches: { bust: '40', waist: '33', hips: '44', shoulder: '16', dressLength: '60', sleeveLength: '23.5' },
  },
  {
    value: 'Extra Large / XL (Plus / Voluptuous Fit — UK 16–18)',
    shortLabel: 'XL (Plus Size Fit)',
    everydayName: 'Plus-Size / Full Figure',
    ukSize: 'UK 16–18 (XL)',
    bodyDescription: 'Generous, flattering tailoring for a fuller tummy, bust, and hips without feeling tight.',
    approxInches: { bust: '44', waist: '37', hips: '48', shoulder: '17', dressLength: '60', sleeveLength: '24' },
  },
  {
    value: 'XXL / Rich Aunty Plus (Extra Roomy — UK 20+)',
    shortLabel: 'XXL (Extra Plus)',
    everydayName: 'Extra Full Figure / Maximum Comfort',
    ukSize: 'UK 20–24 (XXL+)',
    bodyDescription: 'Extra-roomy royal cut with maximum breathing space and graceful drape.',
    approxInches: { bust: '48', waist: '41', hips: '52', shoulder: '18', dressLength: '61', sleeveLength: '24.5' },
  },
  {
    value: 'Free Size / Loose Flowing Fit (Fits All Bubu)',
    shortLabel: 'Free Size (Loose & Flowing)',
    everydayName: 'Loose Bubu / Kaftan Fit (Fits Almost Everyone)',
    ukSize: 'One-Size Free Flow',
    bodyDescription: 'No tight waist—hangs loosely and flows comfortably over any body shape.',
    approxInches: { bust: '46', waist: '46', hips: '50', shoulder: '17', dressLength: '60', sleeveLength: '23' },
  },
  {
    value: 'Not Sure — Guide Me on WhatsApp / Custom Fit',
    shortLabel: 'Not Sure (Help Me Choose)',
    everydayName: 'I Don’t Know My Size — Help Me Pick!',
    ukSize: 'Guided Fit',
    bodyDescription: 'Don’t worry about numbers! Our tailor or Tessy Ai will help confirm your size using a quick photo or chat.',
    approxInches: { bust: '', waist: '', hips: '', shoulder: '', dressLength: '', sleeveLength: '' },
  },
];

export interface LaymanColorOption {
  value: string;
  simpleName: string;
  fashionShade: string;
  hex: string;
  borderHex?: string;
  description: string;
}

// Visual & plain-English color guide so customers don't have to guess what fashion color names mean
export const LAYMAN_COLOR_GUIDE: LaymanColorOption[] = [
  {
    value: 'Same Color as Picture (Original Photo Color)',
    simpleName: 'Same as Picture',
    fashionShade: 'Exact Photo Color',
    hex: 'linear-gradient(135deg, #F59E0B 0%, #10B981 50%, #1C1917 100%)',
    description: 'Make it in the exact same color and pattern shown in the outfit photo.',
  },
  {
    value: 'Gold / Yellow (Bright Royal Gold)',
    simpleName: 'Gold / Yellow',
    fashionShade: 'Imperial Gold / Champagne',
    hex: '#F59E0B',
    description: 'Warm, sunny yellow-gold or rich champagne gold.',
  },
  {
    value: 'Deep Green (Emerald / Bottle Green)',
    simpleName: 'Deep Green',
    fashionShade: 'Emerald / Forest Green',
    hex: '#059669',
    description: 'Rich, dark celebratory green (Emerald or Bottle Green).',
  },
  {
    value: 'Royal Blue / Navy (Rich Blue)',
    simpleName: 'Blue (Royal / Navy)',
    fashionShade: 'Cobalt / Navy Blue',
    hex: '#2563EB',
    description: 'Bold bright Royal Blue or deep classic Navy Blue.',
  },
  {
    value: 'Wine / Dark Red (Burgundy)',
    simpleName: 'Wine / Dark Red',
    fashionShade: 'Burgundy / Ruby Red',
    hex: '#9F1239',
    description: 'Deep red wine, maroon, or rich celebratory red.',
  },
  {
    value: 'Burnt Orange / Rust (Warm Orange)',
    simpleName: 'Orange / Rust',
    fashionShade: 'Terracotta / Burnt Orange',
    hex: '#EA580C',
    description: 'Warm earthy orange-brown that glows on all skin tones.',
  },
  {
    value: 'Purple / Lilac (Plum / Lavender)',
    simpleName: 'Purple / Lilac',
    fashionShade: 'Royal Purple / Plum',
    hex: '#9333EA',
    description: 'Deep royal purple or soft pastel lilac/lavender.',
  },
  {
    value: 'Pink / Rose (Soft or Bright Pink)',
    simpleName: 'Pink / Rose',
    fashionShade: 'Blush / Magenta Pink',
    hex: '#EC4899',
    description: 'Soft baby pink, dusty rose, or vibrant hot pink.',
  },
  {
    value: 'Brown / Chocolate / Nude (Earth Tones)',
    simpleName: 'Brown / Nude',
    fashionShade: 'Chocolate / Caramel / Beige',
    hex: '#78350F',
    description: 'Rich chocolate brown, caramel, or warm skin-tone beige.',
  },
  {
    value: 'White / Cream (Off-White / Ivory)',
    simpleName: 'White / Cream',
    fashionShade: 'Ivory / Off-White',
    hex: '#F5F5F4',
    borderHex: '#A8A29E',
    description: 'Clean white, soft milk/cream, or off-white.',
  },
  {
    value: 'Black & Gold (Classic Black)',
    simpleName: 'Black & Gold',
    fashionShade: 'Obsidian Black & Gold',
    hex: '#1C1917',
    borderHex: '#F59E0B',
    description: 'Timeless deep black with rich gold accents.',
  },
  {
    value: 'Colorful Mixed Ankara Print (Multi-Color)',
    simpleName: 'Mixed Multi-Color',
    fashionShade: 'Vibrant Multi-Print',
    hex: 'linear-gradient(135deg, #E11D48 0%, #F59E0B 35%, #10B981 70%, #2563EB 100%)',
    description: 'Bright mix of multiple African Ankara colors together.',
  },
];

export function findLaymanSizeOption(sizeStr?: string): LaymanSizeOption | undefined {
  if (!sizeStr) return undefined;
  const lower = sizeStr.toLowerCase();
  return LAYMAN_SIZE_GUIDE.find(
    (opt) =>
      opt.value.toLowerCase() === lower ||
      opt.shortLabel.toLowerCase() === lower ||
      (lower.includes('small') && opt.shortLabel.includes('Small')) ||
      (lower.includes('uk 8') && opt.shortLabel.includes('Small')) ||
      (lower.includes('medium') && opt.shortLabel.includes('Medium')) ||
      ((lower.includes('uk 10') || lower.includes('uk 12')) && opt.shortLabel.includes('Medium')) ||
      (lower.includes('large') && !lower.includes('extra') && opt.shortLabel.includes('Large')) ||
      (lower.includes('uk 14') && opt.shortLabel.includes('Large')) ||
      ((lower.includes('xl') || lower.includes('uk 16') || lower.includes('uk 18')) && !lower.includes('xxl') && opt.shortLabel.includes('XL')) ||
      ((lower.includes('xxl') || lower.includes('uk 20') || lower.includes('plus')) && opt.shortLabel.includes('XXL')) ||
      (lower.includes('free') && opt.shortLabel.includes('Free')) ||
      ((lower.includes('not sure') || lower.includes('custom')) && opt.shortLabel.includes('Not Sure'))
  );
}

export function findLaymanColorOption(colorStr?: string): LaymanColorOption | undefined {
  if (!colorStr) return undefined;
  const lower = colorStr.toLowerCase();
  return LAYMAN_COLOR_GUIDE.find(
    (c) =>
      c.value.toLowerCase() === lower ||
      c.simpleName.toLowerCase() === lower ||
      (lower.includes('same') || lower.includes('original') || lower.includes('shown')
        ? c.simpleName === 'Same as Picture'
        : false) ||
      ((lower.includes('gold') || lower.includes('yellow')) && !lower.includes('black')
        ? c.simpleName === 'Gold / Yellow'
        : false) ||
      (lower.includes('green') || lower.includes('emerald') ? c.simpleName === 'Deep Green' : false) ||
      (lower.includes('blue') || lower.includes('navy') || lower.includes('cobalt')
        ? c.simpleName === 'Blue (Royal / Navy)'
        : false) ||
      (lower.includes('wine') || lower.includes('red') || lower.includes('burgundy') || lower.includes('ruby')
        ? c.simpleName === 'Wine / Dark Red'
        : false) ||
      (lower.includes('orange') || lower.includes('rust') || lower.includes('terracotta')
        ? c.simpleName === 'Orange / Rust'
        : false) ||
      (lower.includes('purple') || lower.includes('lilac') || lower.includes('plum')
        ? c.simpleName === 'Purple / Lilac'
        : false) ||
      (lower.includes('pink') || lower.includes('rose') ? c.simpleName === 'Pink / Rose' : false) ||
      (lower.includes('brown') || lower.includes('chocolate') || lower.includes('nude')
        ? c.simpleName === 'Brown / Nude'
        : false) ||
      (lower.includes('white') || lower.includes('cream') || lower.includes('ivory')
        ? c.simpleName === 'White / Cream'
        : false) ||
      (lower.includes('black') || lower.includes('obsidian') ? c.simpleName === 'Black & Gold' : false) ||
      (lower.includes('multi') || lower.includes('mixed') ? c.simpleName === 'Mixed Multi-Color' : false)
  );
}

export const NIGERIAN_STATES = [
  'Lagos',
  'FCT - Abuja',
  'Rivers',
  'Delta',
  'Edo',
  'Oyo',
  'Ogun',
  'Anambra',
  'Enugu',
  'Imo',
  'Abia',
  'Akwa Ibom',
  'Cross River',
  'Bayelsa',
  'Kaduna',
  'Kano',
  'Plateau',
  'Kwara',
  'Osun',
  'Ondo',
  'Ekiti',
  'Benue',
  'Kogi',
  'Nasarawa',
  'Niger',
  'Adamawa',
  'Bauchi',
  'Borno',
  'Ebonyi',
  'Gombe',
  'Jigawa',
  'Katsina',
  'Kebbi',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara',
  'International Shipping',
];
