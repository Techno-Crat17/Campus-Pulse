// Central Single Source of Truth for Lost & Found Items
// Verified records corresponding to the 6 uploaded custom images with approved locations

export interface LostFoundItem {
  id: number | string;
  itemName: string;
  type: 'lost' | 'found';
  location: string;
  date: string;
  description: string;
  image: string;
  category: 'Electronics' | 'Academic' | 'Accessories' | 'Wearables' | 'Documents' | 'Bags' | 'Personal';
  contactLocation: string;
  statusLabel?: string;
}

const BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL)
  ? (import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`)
  : '/';

export const SAMPLE_LOST_FOUND_ITEMS: LostFoundItem[] = [
  {
    id: 1,
    itemName: "Metallic Blue Wristwatch",
    type: "found",
    location: "ISE Lab 3",
    date: "2026-09-30",
    description: "Analog wristwatch with metallic blue chain strap.",
    image: `${BASE_URL}assets/lost-found/blue-watch.jpeg`,
    category: "Wearables",
    contactLocation: "Security Enquiry Desk",
    statusLabel: "FOUND & SECURED"
  },
  {
    id: 2,
    itemName: "Wireless Bluetooth Mouse",
    type: "found",
    location: "CSE Lab 2",
    date: "2026-09-30",
    description: "Black optical wireless mouse with LED illumination.",
    image: `${BASE_URL}assets/lost-found/wireless-mouse.jpeg`,
    category: "Electronics",
    contactLocation: "Security Enquiry Desk",
    statusLabel: "FOUND & SECURED"
  },
  {
    id: 3,
    itemName: "Laptop Power Adapter",
    type: "found",
    location: "CRD 508",
    date: "2026-09-30",
    description: "White USB-C laptop power adapter with braided charging cable.",
    image: `${BASE_URL}assets/lost-found/laptop-charger.jpeg`,
    category: "Electronics",
    contactLocation: "Security Enquiry Desk",
    statusLabel: "FOUND & SECURED"
  },
  {
    id: 4,
    itemName: "boAt Wireless Earbuds",
    type: "found",
    location: "ISE Lab 1",
    date: "2026-09-30",
    description: "boAt TWS wireless earbuds in transparent charging case.",
    image: `${BASE_URL}assets/lost-found/boat-earbuds.jpeg`,
    category: "Electronics",
    contactLocation: "Security Enquiry Desk",
    statusLabel: "FOUND & SECURED"
  },
  {
    id: 5,
    itemName: "Stainless Steel Water Bottle",
    type: "found",
    location: "CSE Lab 4",
    date: "2026-09-30",
    description: "Silver stainless steel water bottle with black sipper cap.",
    image: `${BASE_URL}assets/lost-found/stainless-steel-bottle.jpeg`,
    category: "Accessories",
    contactLocation: "Security Enquiry Desk",
    statusLabel: "FOUND & SECURED"
  },
  {
    id: 6,
    itemName: "Android Smartphone",
    type: "found",
    location: "ISE Lab 3",
    date: "2026-09-30",
    description: "Smartphone in blue protective casing.",
    image: `${BASE_URL}assets/lost-found/android-smartphone.jpeg`,
    category: "Electronics",
    contactLocation: "Security Enquiry Desk",
    statusLabel: "FOUND & SECURED"
  }
];
