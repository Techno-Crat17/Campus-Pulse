import mongoose from 'mongoose';
import { Issue } from '../models/Issue.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { isBlockedUser, BLOCKED_USER_ERROR_MESSAGE } from '../config/blockedUsers.js';

export async function createIssue(req, res, next) {
  console.log('[Issues] POST /api/issues received');
  console.log('[Issues] Request body:', JSON.stringify(req.body, null, 2));

  try {
    if (mongoose.connection.readyState !== 1) {
      console.error('[Issues] Connection Error: MongoDB is not connected (readyState !== 1).');
      return errorResponse(res, 'Database connection is not active. Unable to save issue.', 'DATABASE_DISCONNECTED', 500);
    }

    const { title, description, category, location, priority, reportedBy, imageUrl, user, reporter, username, studentId } = req.body;

    // Validate reporter / user identifier against centralized blocked list
    const identifiersToCheck = [
      reportedBy,
      user,
      reporter,
      username,
      studentId,
      req.headers['x-user-id'],
      req.headers['x-reporter-id'],
      req.headers['x-username']
    ];

    for (const id of identifiersToCheck) {
      if (isBlockedUser(id)) {
        console.warn(`[Issues] Blocked issue submission attempt for identifier: "${id}"`);
        return res.status(403).json({
          success: false,
          message: BLOCKED_USER_ERROR_MESSAGE
        });
      }
    }

    if (!title || !description || !category || !location) {
      console.warn('[Issues] Validation Error: Missing required fields.');
      return errorResponse(
        res,
        'Title, description, category, and location are required fields.',
        'VALIDATION_ERROR',
        400
      );
    }

    console.log('[Issues] Saving issue...');

    const count = await Issue.countDocuments({});
    const issueId = `iss-${Date.now().toString().slice(-4)}-${count + 1}`;

    const savedIssue = await Issue.create({
      id: issueId,
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      location: location.trim(),
      priority: priority || 'Low',
      status: 'Reported',
      reportedBy: reportedBy || 'Anonymous',
      imageUrl: imageUrl || '',
      isDemo: false,
      upvotes: 0
    });

    console.log(`[Issues] Issue saved: ${savedIssue._id} (ID: ${savedIssue.id})`);

    return res.status(201).json({
      success: true,
      issue: savedIssue,
      data: savedIssue
    });
  } catch (err) {
    console.error('[Issues] Error creating issue:', err.message);
    next(err);
  }
}

export async function getIssues(req, res, next) {
  try {
    const { status, priority, category, location } = req.query;
    const filter = {};

    if (status) filter.status = { $regex: new RegExp(`^${status}$`, 'i') };
    if (priority) filter.priority = { $regex: new RegExp(`^${priority}$`, 'i') };
    if (category) filter.category = { $regex: new RegExp(`^${category}$`, 'i') };
    if (location) filter.location = { $regex: location, $options: 'i' };

    const issues = await Issue.find(filter).sort({ createdAt: -1 }).lean();
    return successResponse(res, issues, 200, { total: issues.length });
  } catch (err) {
    next(err);
  }
}

export async function getIssueById(req, res, next) {
  try {
    const issue = await Issue.findOne({
      $or: [{ id: req.params.id }, { _id: req.params.id }]
    }).lean();

    if (!issue) {
      return errorResponse(res, `Issue report ${req.params.id} not found`, 'ISSUE_NOT_FOUND', 404);
    }

    return successResponse(res, issue);
  } catch (err) {
    next(err);
  }
}

export async function updateIssueStatus(req, res, next) {
  try {
    const { status } = req.body;
    const validStatuses = ['Reported', 'Under Review', 'In Progress', 'Resolved'];

    if (!status || !validStatuses.includes(status)) {
      return errorResponse(res, `Invalid status. Allowed values: ${validStatuses.join(', ')}`, 'INVALID_STATUS', 400);
    }

    const issue = await Issue.findOneAndUpdate(
      { $or: [{ id: req.params.id }, { _id: req.params.id }] },
      { status },
      { new: true }
    );

    if (!issue) {
      return errorResponse(res, `Issue report ${req.params.id} not found`, 'ISSUE_NOT_FOUND', 404);
    }

    return successResponse(res, issue);
  } catch (err) {
    next(err);
  }
}

export async function deleteIssue(req, res, next) {
  try {
    const issue = await Issue.findOneAndDelete({
      $or: [{ id: req.params.id }, { _id: req.params.id }]
    });

    if (!issue) {
      return errorResponse(res, `Issue report ${req.params.id} not found`, 'ISSUE_NOT_FOUND', 404);
    }

    return successResponse(res, { message: `Issue ${req.params.id} successfully deleted` });
  } catch (err) {
    next(err);
  }
}
