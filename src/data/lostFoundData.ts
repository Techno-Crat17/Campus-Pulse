// Central Single Source of Truth for Lost & Found Sample Data
// Realistic campus-based demo records with verified sample item photographs

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

export const SAMPLE_LOST_FOUND_ITEMS: LostFoundItem[] = [
  {
    id: 1,
    itemName: "AirPods",
    type: "lost",
    location: "LHC Block",
    date: "2026-09-26",
    description: "White AirPods charging case left on a lecture hall desk in LHC Block.",
    image: "/assets/lost-found/airpods.jpg",
    category: "Electronics",
    contactLocation: "LHC Security Desk",
    statusLabel: "REPORTED LOST"
  },
  {
    id: 2,
    itemName: "Scientific Calculator",
    type: "found",
    location: "ESB Block",
    date: "2026-09-26",
    description: "Casio scientific calculator (fx-991 style) found on 1st Floor library desk.",
    image: "/assets/lost-found/calculator.jpg",
    category: "Academic",
    contactLocation: "ESB Library Help Desk",
    statusLabel: "FOUND & SECURED"
  },
  {
    id: 3,
    itemName: "Black Water Bottle",
    type: "lost",
    location: "Apex Block",
    date: "2026-09-25",
    description: "Matte black insulated water bottle misplaced near granite corridor bench.",
    image: "/assets/lost-found/water-bottle.jpg",
    category: "Accessories",
    contactLocation: "Apex Ground Floor Enquiry",
    statusLabel: "REPORTED LOST"
  },
  {
    id: 4,
    itemName: "Wrist Watch",
    type: "found",
    location: "LHC Block",
    date: "2026-09-25",
    description: "Black sport digital wrist watch with silicone strap found on campus walkway bench.",
    image: "/assets/lost-found/watch.jpg",
    category: "Wearables",
    contactLocation: "Central Campus Security Office",
    statusLabel: "FOUND & SECURED"
  },
  {
    id: 5,
    itemName: "Backpack",
    type: "lost",
    location: "ESB Block",
    date: "2026-09-24",
    description: "Grey and black canvas student backpack left on a classroom chair.",
    image: "/assets/lost-found/backpack.jpg",
    category: "Bags",
    contactLocation: "ESB Facilities Office",
    statusLabel: "REPORTED LOST"
  },
  {
    id: 6,
    itemName: "College ID Card",
    type: "found",
    location: "Apex Block",
    date: "2026-09-26",
    description: "Student identity card with campus lanyard found on ground floor study table.",
    image: "/assets/lost-found/id-card.jpg",
    category: "Documents",
    contactLocation: "Apex Administration Desk",
    statusLabel: "FOUND & SECURED"
  },
  {
    id: 7,
    itemName: "Earphones Case",
    type: "found",
    location: "LHC Block",
    date: "2026-09-26",
    description: "Black wireless earbuds charging case found near computer science lab entrance.",
    image: "/assets/lost-found/earphones.jpg",
    category: "Electronics",
    contactLocation: "LHC Lab In-charge Room",
    statusLabel: "FOUND & SECURED"
  },
  {
    id: 8,
    itemName: "USB Drive",
    type: "found",
    location: "ESB Block",
    date: "2026-09-25",
    description: "Silver metal swivel USB flash drive left next to desktop workstation.",
    image: "/assets/lost-found/usb-drive.jpg",
    category: "Electronics",
    contactLocation: "ESB IT Lab 3",
    statusLabel: "FOUND & SECURED"
  },
  {
    id: 9,
    itemName: "Study Notebook",
    type: "lost",
    location: "Apex Block",
    date: "2026-09-26",
    description: "Blue spiral-bound lecture notes notebook with handwritten engineering notes.",
    image: "/assets/lost-found/notebook.jpg",
    category: "Academic",
    contactLocation: "Apex Library Reception",
    statusLabel: "REPORTED LOST"
  },
  {
    id: 10,
    itemName: "Leather Wallet",
    type: "found",
    location: "LHC Block",
    date: "2026-09-25",
    description: "Brown leather bifold wallet found on stairwell landing (safely deposited at office).",
    image: "/assets/lost-found/wallet.jpg",
    category: "Personal",
    contactLocation: "Chief Proctor Office",
    statusLabel: "FOUND & SECURED"
  },
  {
    id: 11,
    itemName: "Compact Umbrella",
    type: "lost",
    location: "Apex Block",
    date: "2026-09-24",
    description: "Navy blue folding umbrella left near ground floor corridor bench.",
    image: "/assets/lost-found/umbrella.jpg",
    category: "Accessories",
    contactLocation: "Apex Security Post",
    statusLabel: "REPORTED LOST"
  },
  {
    id: 12,
    itemName: "Reading Spectacles",
    type: "found",
    location: "ESB Block",
    date: "2026-09-26",
    description: "Black rectangular frame reading glasses found on reading table.",
    image: "/assets/lost-found/spectacles.jpg",
    category: "Personal",
    contactLocation: "ESB Library Reference Section",
    statusLabel: "FOUND & SECURED"
  }
];
