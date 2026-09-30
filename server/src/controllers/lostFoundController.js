import mongoose from 'mongoose';
import { LostFound } from '../models/LostFound.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { isBlockedUser, BLOCKED_USER_ERROR_MESSAGE } from '../config/blockedUsers.js';

export const USN_REGEX = /^1MS(?:23|24|25|26)(?:CS|IS|CI|CY|EC|EE|IM|ET|EI|CV|MD|ME|AS|AD|AI|AT|BT|CH)(?:00[1-9]|0[1-9][0-9]|[12][0-9][0-9]|300)(?:-[Tt])?$/;

export const INITIAL_LOST_FOUND_SEED = [
  {
    id: 'lf-seed-1',
    itemName: 'Metallic Blue Wristwatch',
    title: 'Metallic Blue Wristwatch',
    itemTitle: 'Metallic Blue Wristwatch',
    status: 'found',
    category: 'Wearables',
    foundAt: 'ISE Lab 3',
    location: 'ISE Lab 3',
    foundOn: '2026-09-30',
    date: '2026-09-30',
    description: 'Analog wristwatch with metallic blue chain strap.',
    image: '/assets/lost-found/blue-watch.jpeg',
    images: ['/assets/lost-found/blue-watch.jpeg'],
    usn: '1MS24IS094',
    contactLocation: 'Security Enquiry Desk',
    isDemo: true
  },
  {
    id: 'lf-seed-2',
    itemName: 'Wireless Bluetooth Mouse',
    title: 'Wireless Bluetooth Mouse',
    itemTitle: 'Wireless Bluetooth Mouse',
    status: 'recovered',
    category: 'Electronics',
    foundAt: 'CSE Lab 2',
    location: 'CSE Lab 2',
    foundOn: '2026-09-29',
    date: '2026-09-29',
    description: 'Black optical wireless mouse with LED illumination.',
    image: '/assets/lost-found/wireless-mouse.jpeg',
    images: ['/assets/lost-found/wireless-mouse.jpeg'],
    usn: '1MS23CS001',
    contactLocation: 'Security Enquiry Desk',
    isDemo: true
  },
  {
    id: 'lf-seed-3',
    itemName: 'Laptop Power Adapter',
    title: 'Laptop Power Adapter',
    itemTitle: 'Laptop Power Adapter',
    status: 'found',
    category: 'Electronics',
    foundAt: 'CRD 508',
    location: 'CRD 508',
    foundOn: '2026-09-30',
    date: '2026-09-30',
    description: 'White USB-C laptop power adapter with braided charging cable.',
    image: '/assets/lost-found/laptop-charger.jpeg',
    images: ['/assets/lost-found/laptop-charger.jpeg'],
    usn: '1MS25CI120',
    contactLocation: 'Security Enquiry Desk',
    isDemo: true
  },
  {
    id: 'lf-seed-4',
    itemName: 'boAt Wireless Earbuds',
    title: 'boAt Wireless Earbuds',
    itemTitle: 'boAt Wireless Earbuds',
    status: 'recovered',
    category: 'Electronics',
    foundAt: 'ISE Lab 1',
    location: 'ISE Lab 1',
    foundOn: '2026-09-28',
    date: '2026-09-28',
    description: 'boAt TWS wireless earbuds in transparent charging case.',
    image: '/assets/lost-found/boat-earbuds.jpeg',
    images: ['/assets/lost-found/boat-earbuds.jpeg'],
    usn: '1MS26CY300',
    contactLocation: 'Security Enquiry Desk',
    isDemo: true
  },
  {
    id: 'lf-seed-5',
    itemName: 'Stainless Steel Water Bottle',
    title: 'Stainless Steel Water Bottle',
    itemTitle: 'Stainless Steel Water Bottle',
    status: 'found',
    category: 'Accessories',
    foundAt: 'CSE Lab 4',
    location: 'CSE Lab 4',
    foundOn: '2026-09-30',
    date: '2026-09-30',
    description: 'Silver stainless steel water bottle with black sipper cap.',
    image: '/assets/lost-found/stainless-steel-bottle.jpeg',
    images: ['/assets/lost-found/stainless-steel-bottle.jpeg'],
    usn: '1MS24ME150',
    contactLocation: 'Security Enquiry Desk',
    isDemo: true
  },
  {
    id: 'lf-seed-6',
    itemName: 'Android Smartphone',
    title: 'Android Smartphone',
    itemTitle: 'Android Smartphone',
    status: 'recovered',
    category: 'Electronics',
    foundAt: 'ISE Lab 3',
    location: 'ISE Lab 3',
    foundOn: '2026-09-27',
    date: '2026-09-27',
    description: 'Smartphone in blue protective casing.',
    image: '/assets/lost-found/android-smartphone.jpeg',
    images: ['/assets/lost-found/android-smartphone.jpeg'],
    usn: '1MS25AI200',
    contactLocation: 'Security Enquiry Desk',
    isDemo: true
  },
  {
    id: 'lf-seed-7',
    itemName: 'Touchscreen Smartphone',
    title: 'Touchscreen Smartphone',
    itemTitle: 'Touchscreen Smartphone',
    status: 'recovered',
    category: 'Electronics',
    foundAt: 'CRD 508',
    location: 'CRD 508',
    foundOn: '2026-09-26',
    date: '2026-09-26',
    description: 'Touchscreen smartphone with active display.',
    image: '/assets/lost-found/lockscreen-smartphone.jpeg',
    images: ['/assets/lost-found/lockscreen-smartphone.jpeg'],
    usn: '1MS24IS094-T',
    contactLocation: 'Security Enquiry Desk',
    isDemo: true
  }
];

/**
 * Normalizes status values to the new lifecycle: FOUND or RECOVERED.
 * Legacy LOST -> FOUND, legacy FOUND -> RECOVERED.
 */
function normalizeStatus(status) {
  if (!status) return 'FOUND';
  const s = String(status).trim().toUpperCase();
  if (s === 'RECOVERED' || s === 'CLAIMED' || s === 'RESOLVED') return 'RECOVERED';
  if (s === 'LOST') return 'FOUND';
  return s === 'RECOVERED' ? 'RECOVERED' : 'FOUND';
}

/**
 * POST /api/lost-found
 * Report a new Found Item
 */
export async function createLostFoundItem(req, res, next) {
  try {
    const { category, itemTitle, itemName, title, description, foundAt, location, foundOn, date, usn, image, images } = req.body;

    const finalTitle = (itemTitle || itemName || title || '').trim();
    const finalDescription = (description || '').trim();
    const finalCategory = (category || '').trim();
    const finalFoundAt = (foundAt || location || '').trim();
    const finalFoundOn = (foundOn || date || '').trim();
    const finalUsn = (usn || '').trim();
    const finalImage = (image || (Array.isArray(images) && images[0]) || '').trim();
    const finalImages = Array.isArray(images) && images.length > 0 ? images : (finalImage ? [finalImage] : []);

    // 1. Check all 6 mandatory text fields
    if (!finalCategory || !finalTitle || !finalDescription || !finalFoundAt || !finalFoundOn || !finalUsn) {
      return errorResponse(
        res,
        'Category, item title, description, found at, found on, and USN are required fields.',
        'VALIDATION_ERROR',
        400
      );
    }

    // 2. Check mandatory image
    if (!finalImage && finalImages.length === 0) {
      return errorResponse(
        res,
        'At least one image is mandatory for reporting a found item.',
        'IMAGE_REQUIRED',
        400
      );
    }

    // 3. Strict USN validation
    if (!USN_REGEX.test(finalUsn)) {
      return errorResponse(
        res,
        'Enter a valid USN. Example: 1MS24IS094',
        'INVALID_USN',
        400
      );
    }

    // 4. Centralized blocked user check
    if (isBlockedUser(finalUsn)) {
      return res.status(403).json({
        success: false,
        message: BLOCKED_USER_ERROR_MESSAGE
      });
    }

    // 5. Generate unique ID & persist with status = 'found'
    const count = await LostFound.countDocuments({});
    const customId = `lf-${Date.now().toString().slice(-4)}-${count + 1}`;

    const newRecord = await LostFound.create({
      id: customId,
      itemName: finalTitle,
      itemTitle: finalTitle,
      title: finalTitle,
      category: finalCategory,
      description: finalDescription,
      foundAt: finalFoundAt,
      location: finalFoundAt,
      foundOn: finalFoundOn,
      date: finalFoundOn,
      usn: finalUsn,
      status: 'found',
      contactLocation: 'Security Enquiry Desk',
      image: finalImage,
      images: finalImages,
      isDemo: false
    });

    return res.status(201).json({
      success: true,
      data: {
        ...newRecord.toObject(),
        status: 'FOUND'
      },
      message: 'Found item report submitted successfully.'
    });
  } catch (err) {
    console.error('[LostFound] Error creating item:', err);
    next(err);
  }
}

/**
 * GET /api/lost-found
 * Retrieve all lost & found items with filter support
 */
export async function getLostFoundItems(req, res, next) {
  try {
    if (mongoose.connection.readyState === 1) {
      const totalCount = await LostFound.countDocuments({});
      if (totalCount === 0) {
        try {
          await LostFound.insertMany(INITIAL_LOST_FOUND_SEED);
          console.log('[LostFound] Seeded initial verified Lost & Found items into MongoDB.');
        } catch (seedErr) {
          console.warn('[LostFound] Error seeding initial items:', seedErr.message);
        }
      }
    }

    const { status, category, q, search } = req.query;
    const filter = {};

    if (status) {
      const s = status.toLowerCase();
      if (s === 'recovered') {
        filter.status = { $in: ['recovered', 'RECOVERED'] };
      } else if (s === 'found') {
        filter.status = { $in: ['found', 'FOUND', 'lost', 'LOST'] };
      }
    }

    if (category && category !== 'all' && category !== 'ALL') {
      filter.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    const searchQuery = (q || search || '').trim();
    if (searchQuery) {
      filter.$or = [
        { itemName: { $regex: searchQuery, $options: 'i' } },
        { title: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } },
        { foundAt: { $regex: searchQuery, $options: 'i' } },
        { location: { $regex: searchQuery, $options: 'i' } },
        { category: { $regex: searchQuery, $options: 'i' } },
        { usn: { $regex: searchQuery, $options: 'i' } }
      ];
    }

    const items = await LostFound.find(filter).sort({ createdAt: -1 }).lean();

    const normalized = items.map((item) => ({
      ...item,
      status: normalizeStatus(item.status)
    }));

    return successResponse(res, normalized, 200, { total: normalized.length });
  } catch (err) {
    console.error('[LostFound] Error fetching items:', err);
    next(err);
  }
}

/**
 * PATCH /api/lost-found/:id/status
 * Update status between FOUND and RECOVERED
 */
export async function updateLostFoundStatus(req, res, next) {
  try {
    const { status } = req.body;
    const normalized = (status || '').toLowerCase();

    if (!['found', 'recovered'].includes(normalized)) {
      return errorResponse(
        res,
        'Invalid status. Allowed values: found, recovered',
        'INVALID_STATUS',
        400
      );
    }

    const updated = await LostFound.findOneAndUpdate(
      { $or: [{ id: req.params.id }, { _id: req.params.id }] },
      { status: normalized },
      { new: true }
    ).lean();

    if (!updated) {
      return errorResponse(res, `Item ${req.params.id} not found`, 'ITEM_NOT_FOUND', 404);
    }

    return successResponse(res, {
      ...updated,
      status: normalizeStatus(updated.status)
    });
  } catch (err) {
    console.error('[LostFound] Error updating status:', err);
    next(err);
  }
}
