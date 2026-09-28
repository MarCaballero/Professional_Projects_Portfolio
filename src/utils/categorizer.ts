import { CategorizationRule, Category } from '../types';

// Built-in comprehensive merchant / keyword mapping
const BUILT_IN_KEYWORD_MAP: Record<string, string[]> = {
  dining: [
    'starbucks', 'peet', 'dunkin', 'philz', 'blue bottle', 'coffee', 'cafe', 'espresso',
    'chipotle', 'sweetgreen', 'shake shack', 'mcdonald', 'burger', 'in-n-out', 'subway',
    'uber eats', 'doordash', 'grubhub', 'postmates', 'taco bell', 'panera', 'cava',
    'pizza', 'trattoria', 'sushi', 'bistro', 'bakery', 'restaurant', 'diner', 'bar & grill',
    'tasting', 'ramen', 'noodles', 'brewery', 'taproom'
  ],
  groceries: [
    'trader joe', 'kroger', 'whole foods', 'safeway', 'costco', 'aldi', 'heb', 'publix',
    'sprouts', 'wegmans', 'market', 'supermarket', 'grocery', 'produce', 'butcher',
    'ralphs', 'vons', 'winco', 'food lion', 'giant food', 'meijer', 'mart'
  ],
  transport: [
    'uber', 'lyft', 'taxi', 'cab', 'shell', 'chevron', 'bp gas', 'exxon', 'mobil', 'citgo',
    'metro', 'transit', 'subway pass', 'bart', 'mta', 'caltrain', 'bus fare', 'train',
    'parking', 'toll', 'fastrak', 'ezpass', 'fuel', 'gas station', 'valero', 'oil change'
  ],
  utilities: [
    'electric', 'power', 'edison', 'coned', 'pg&e', 'pge', 'national grid', 'water bill',
    'utilities', 'trash', 'sewer', 'internet', 'broadband', 'at&t', 'verizon', 't-mobile',
    'comcast', 'xfinity', 'spectrum', 'charter', 'mobile plan'
  ],
  entertainment: [
    'netflix', 'spotify', 'hulu', 'disney', 'max', 'hbo', 'apple tv', 'paramount', 'peacock',
    'steam', 'playstation', 'nintendo', 'xbox', 'amc', 'regal', 'cinemark', 'movie',
    'audible', 'kindle', 'patreon', 'concert', 'ticketmaster', 'live nation', 'eventbrite'
  ],
  housing: [
    'rent', 'mortgage', 'lease', 'apartment', 'hoa fee', 'property tax', 'landlord',
    'realty', 'home insurance', 'storage unit'
  ],
  health: [
    'cvs', 'walgreens', 'pharmacy', 'rite aid', 'equinox', 'gym', 'planet fitness', 'crossfit',
    'doctor', 'dentist', 'dental', 'vision', 'optometry', 'labcorp', 'quest diagnostics',
    'hospital', 'copay', 'kaiser', 'clinic', 'therapy', 'health club', 'vitamins'
  ],
  shopping: [
    'amazon', 'target', 'walmart', 'zara', 'nike', 'adidas', 'apple store', 'best buy',
    'nordstrom', 'uniqlo', 'etsy', 'ikea', 'ebay', 'clothing', 'apparel', 'shoes',
    'homedepot', 'home depot', 'lowes', 'hardware', 'marshalls', 'tj maxx'
  ],
  personal: [
    'haircut', 'salon', 'barber', 'spa', 'massage', 'nails', 'sephora', 'ulta',
    'skincare', 'cosmetics', 'grooming'
  ],
  education: [
    'coursera', 'udemy', 'tuition', 'university', 'college', 'textbook', 'notion',
    'adobe', 'chatgpt', 'github', 'masterclass', 'seminar', 'training'
  ],
  savings: [
    'vanguard', 'fidelity', 'schwab', 'roth ira', '401k', 'treasury', 'etrade',
    'wealthfront', 'betterment', 'index fund', 'emergency fund', 'high yield savings'
  ],
  income: [
    'payroll', 'salary', 'employer', 'direct deposit', 'stripe payout', 'bonus',
    'stipend', 'dividend', 'interest payment', 'cashback', 'tax refund', 'honorarium'
  ]
};

/**
 * Instant deterministic categorization based on user rules, keyword patterns, and merchant names.
 */
export function autoCategorize(
  description: string,
  userRules: CategorizationRule[] = [],
  categories: Category[] = []
): { categoryId: string; matchedBy: 'user-rule' | 'keyword' | 'fallback' } {
  if (!description || !description.trim()) {
    return { categoryId: 'misc', matchedBy: 'fallback' };
  }

  const cleanDesc = description.toLowerCase().trim();

  // 1. Check custom user-defined rules first
  for (const rule of userRules) {
    if (rule.keyword && cleanDesc.includes(rule.keyword.toLowerCase().trim())) {
      return { categoryId: rule.categoryId, matchedBy: 'user-rule' };
    }
  }

  // 2. Check built-in keyword dictionary
  for (const [catId, keywords] of Object.entries(BUILT_IN_KEYWORD_MAP)) {
    for (const kw of keywords) {
      if (cleanDesc.includes(kw)) {
        return { categoryId: catId, matchedBy: 'keyword' };
      }
    }
  }

  // Fallback to miscellaneous (or default category)
  return { categoryId: 'misc', matchedBy: 'fallback' };
}

/**
 * Optional server-assisted Gemini categorization for ambiguous or cryptic entries
 */
export async function autoCategorizeWithAI(
  description: string,
  amount?: number
): Promise<{ categoryId: string; explanation: string; confidence: number }> {
  try {
    const res = await fetch('/api/categorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, amount }),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    const catName = (data.category || '').toLowerCase();

    // Map response name to category ID
    let mappedId = 'misc';
    if (catName.includes('food') || catName.includes('grocer')) mappedId = 'groceries';
    else if (catName.includes('dining') || catName.includes('coffee')) mappedId = 'dining';
    else if (catName.includes('transport')) mappedId = 'transport';
    else if (catName.includes('housing') || catName.includes('rent')) mappedId = 'housing';
    else if (catName.includes('util')) mappedId = 'utilities';
    else if (catName.includes('entertain')) mappedId = 'entertainment';
    else if (catName.includes('health')) mappedId = 'health';
    else if (catName.includes('shop')) mappedId = 'shopping';
    else if (catName.includes('educat') || catName.includes('work')) mappedId = 'education';
    else if (catName.includes('person')) mappedId = 'personal';
    else if (catName.includes('saving') || catName.includes('invest')) mappedId = 'savings';
    else if (catName.includes('income')) mappedId = 'income';

    return {
      categoryId: mappedId,
      explanation: data.explanation || 'Categorized via intelligent statement analysis.',
      confidence: data.confidence || 0.9,
    };
  } catch (err) {
    // Graceful local fallback
    const local = autoCategorize(description);
    return {
      categoryId: local.categoryId,
      explanation: 'Locally matched keyword patterns.',
      confidence: 0.8,
    };
  }
}
