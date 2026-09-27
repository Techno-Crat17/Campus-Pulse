import { Issue } from '../models/Issue.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export async function createIssue(req, res, next) {
  try {
    const { title, description, category, location, priority, reportedBy, imageUrl } = req.body;

    if (!title || !description || !category || !location) {
      return errorResponse(res, 'Title, description, category, and location are required fields', 'VALIDATION_ERROR', 400);
    }

    const count = await Issue.countDocuments({});
    const issueId = `iss-${Date.now().toString().slice(-4)}-${count + 1}`;

    const newIssue = await Issue.create({
      id: issueId,
      title,
      description,
      category,
      location,
      priority: priority || 'Low',
      status: 'Reported',
      reportedBy: reportedBy || 'Campus Student',
      imageUrl: imageUrl || '',
      isDemo: false,
      upvotes: 0
    });

    return successResponse(res, newIssue, 201);
  } catch (err) {
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
