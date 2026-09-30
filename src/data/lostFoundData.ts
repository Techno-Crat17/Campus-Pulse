// Central Single Source of Truth for Lost & Found Items
// Dynamic data-driven status model: FOUND -> RECOVERED

export interface LostFoundItem {
  id: number | string;
  itemName: string;
  itemTitle?: string;
  status: 'FOUND' | 'RECOVERED';
  foundAt: string;
  location?: string;
  foundOn?: string;
  date: string;
  description: string;
  image?: string;
  category: 'Electronics' | 'Academic' | 'Accessories' | 'Wearables' | 'Documents' | 'Bags' | 'Personal' | 'Other';
  usn?: string;
  contactLocation: string;
  statusLabel?: string;
  type?: 'found' | 'recovered';
  isDemo?: boolean;
}

export const LOST_FOUND_CATEGORIES: LostFoundItem['category'][] = [
  'Electronics',
  'Academic',
  'Accessories',
  'Wearables',
  'Documents',
  'Bags',
  'Personal',
  'Other'
];

export const USN_REGEX = /^1MS(?:23|24|25|26)(?:CS|IS|CI|CY|EC|EE|IM|ET|EI|CV|MD|ME|AS|AD|AI|AT|BT|CH)(?:00[1-9]|0[1-9][0-9]|[12][0-9][0-9]|300)(?:-[Tt])?$/;

export function isValidUSN(usn: string): boolean {
  if (!usn || typeof usn !== 'string') return false;
  return USN_REGEX.test(usn.trim());
}

const BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL)
  ? (import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`)
  : '/';

export const SAMPLE_LOST_FOUND_ITEMS: LostFoundItem[] = [
  {
    id: 1,
    itemName: "Metallic Blue Wristwatch",
    status: "FOUND",
    foundAt: "ISE Lab 3",
    location: "ISE Lab 3",
    foundOn: "2026-09-30",
    date: "2026-09-30",
    description: "Analog wristwatch with metallic blue chain strap.",
    image: `${BASE_URL}assets/lost-found/blue-watch.jpeg`,
    category: "Wearables",
    contactLocation: "Security Enquiry Desk",
    statusLabel: "FOUND & SECURED",
    type: "found",
    isDemo: true
  },
  {
    id: 2,
    itemName: "Wireless Bluetooth Mouse",
    status: "RECOVERED",
    foundAt: "CSE Lab 2",
    location: "CSE Lab 2",
    foundOn: "2026-09-29",
    date: "2026-09-29",
    description: "Black optical wireless mouse with LED illumination.",
    image: `${BASE_URL}assets/lost-found/wireless-mouse.jpeg`,
    category: "Electronics",
    contactLocation: "Security Enquiry Desk",
    statusLabel: "RECOVERED & CLAIMED",
    type: "recovered",
    isDemo: true
  },
  {
    id: 3,
    itemName: "Laptop Power Adapter",
    status: "FOUND",
    foundAt: "CRD 508",
    location: "CRD 508",
    foundOn: "2026-09-30",
    date: "2026-09-30",
    description: "White USB-C laptop power adapter with braided charging cable.",
    image: `${BASE_URL}assets/lost-found/laptop-charger.jpeg`,
    category: "Electronics",
    contactLocation: "Security Enquiry Desk",
    statusLabel: "FOUND & SECURED",
    type: "found",
    isDemo: true
  },
  {
    id: 4,
    itemName: "boAt Wireless Earbuds",
    status: "RECOVERED",
    foundAt: "ISE Lab 1",
    location: "ISE Lab 1",
    foundOn: "2026-09-28",
    date: "2026-09-28",
    description: "boAt TWS wireless earbuds in transparent charging case.",
    image: `${BASE_URL}assets/lost-found/boat-earbuds.jpeg`,
    category: "Electronics",
    contactLocation: "Security Enquiry Desk",
    statusLabel: "RECOVERED & CLAIMED",
    type: "recovered",
    isDemo: true
  },
  {
    id: 5,
    itemName: "Stainless Steel Water Bottle",
    status: "FOUND",
    foundAt: "CSE Lab 4",
    location: "CSE Lab 4",
    foundOn: "2026-09-30",
    date: "2026-09-30",
    description: "Silver stainless steel water bottle with black sipper cap.",
    image: `${BASE_URL}assets/lost-found/stainless-steel-bottle.jpeg`,
    category: "Accessories",
    contactLocation: "Security Enquiry Desk",
    statusLabel: "FOUND & SECURED",
    type: "found",
    isDemo: true
  },
  {
    id: 6,
    itemName: "Android Smartphone",
    status: "RECOVERED",
    foundAt: "ISE Lab 3",
    location: "ISE Lab 3",
    foundOn: "2026-09-27",
    date: "2026-09-27",
    description: "Smartphone in blue protective casing.",
    image: `${BASE_URL}assets/lost-found/android-smartphone.jpeg`,
    category: "Electronics",
    contactLocation: "Security Enquiry Desk",
    statusLabel: "RECOVERED & CLAIMED",
    type: "recovered",
    isDemo: true
  },
  {
    id: 7,
    itemName: "Touchscreen Smartphone",
    status: "RECOVERED",
    foundAt: "CRD 508",
    location: "CRD 508",
    foundOn: "2026-09-26",
    date: "2026-09-26",
    description: "Touchscreen smartphone with active display.",
    image: `${BASE_URL}assets/lost-found/lockscreen-smartphone.jpeg`,
    category: "Electronics",
    contactLocation: "Security Enquiry Desk",
    statusLabel: "RECOVERED & CLAIMED",
    type: "recovered",
    isDemo: true
  }
];

const STORAGE_KEY = 'campus_pulse_lost_found_items_v2';

export function getStoredLostFoundItems(): LostFoundItem[] {
  if (typeof window === 'undefined') return SAMPLE_LOST_FOUND_ITEMS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_LOST_FOUND_ITEMS));
      return SAMPLE_LOST_FOUND_ITEMS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((item: any) => ({
        ...item,
        status: (item.status === 'RECOVERED' || item.status === 'recovered') ? 'RECOVERED' : 'FOUND'
      }));
    }
  } catch (err) {
    console.warn('[LostFoundData] Failed to read from localStorage:', err);
  }
  return SAMPLE_LOST_FOUND_ITEMS;
}

export function saveLostFoundItem(newItem: LostFoundItem): LostFoundItem[] {
  const current = getStoredLostFoundItems();
  const exists = current.some((i) => String(i.id) === String(newItem.id));
  const updated = exists
    ? current.map((i) => (String(i.id) === String(newItem.id) ? newItem : i))
    : [newItem, ...current];

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('campus_pulse_lost_found_updated'));
    } catch (err) {
      console.warn('[LostFoundData] Failed to save to localStorage:', err);
    }
  }
  return updated;
}
