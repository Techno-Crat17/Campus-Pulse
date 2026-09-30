import mongoose from 'mongoose';
import { LostFound } from '../models/LostFound.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { isBlockedUser, BLOCKED_USER_ERROR_MESSAGE } from '../config/blockedUsers.js';

export const USN_REGEX = /^1MS(?:23|24|25|26)(?:CS|IS|CI|CY|EC|EE|IM|ET|EI|CV|MD|ME|AS|AD|AI|AT|BT|CH)(?:00[1-9]|0[1-9][0-9]|[12][0-9][0-9]|300)(?:-[Tt])?$/;

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
    const { category, itemTitle, itemName, title, description, foundAt, location, foundOn, date, usn, image } = req.body;

    const finalTitle = (itemTitle || itemName || title || '').trim();
    const finalDescription = (description || '').trim();
    const finalCategory = (category || '').trim();
    const finalFoundAt = (foundAt || location || '').trim();
    const finalFoundOn = (foundOn || date || '').trim();
    const finalUsn = (usn || '').trim();

    // 1. Check all 6 mandatory fields
    if (!finalCategory || !finalTitle || !finalDescription || !finalFoundAt || !finalFoundOn || !finalUsn) {
      return errorResponse(
        res,
        'Category, item title, description, found at, found on, and USN are all required fields.',
        'VALIDATION_ERROR',
        400
      );
    }

    // 2. Strict USN validation
    if (!USN_REGEX.test(finalUsn)) {
      return errorResponse(
        res,
        'Enter a valid USN. Example: 1MS24IS094',
        'INVALID_USN',
        400
      );
    }

    // 3. Centralized blocked user check
    if (isBlockedUser(finalUsn)) {
      return res.status(403).json({
        success: false,
        message: BLOCKED_USER_ERROR_MESSAGE
      });
    }

    // 4. Generate unique ID & persist with status = 'found'
    const count = await LostFound.countDocuments({});
    const customId = `lf-${Date.now().toString().slice(-4)}-${count + 1}`;

    const newRecord = await LostFound.create({
      id: customId,
      itemName: finalTitle,
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
      image: image || '',
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
 * Retrieve lost & found items with filter support
 */
export async function getLostFoundItems(req, res, next) {
  try {
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
