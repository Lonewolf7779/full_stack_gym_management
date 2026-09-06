const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @desc    Get notifications for the logged in user
 * @route   GET /api/notifications
 * @access  Private (All authenticated users)
 */
const getMyNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter = { recipient: req.user._id };

    if (req.query.isRead !== undefined && req.query.isRead !== '') {
      filter.isRead = req.query.isRead === 'true';
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipient: req.user._id, isRead: false }),
    ]);

    return successResponse(res, 'Notifications retrieved successfully.', {
      notifications,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get unread notification count
 * @route   GET /api/notifications/unread-count
 * @access  Private (All authenticated users)
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    return successResponse(res, 'Unread count retrieved.', { count });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark a single notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Private (Recipient only)
 */
const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid notification ID', null, 400);
    }

    const notification = await Notification.findOne({
      _id: id,
      recipient: req.user._id,
    });

    if (!notification) {
      return errorResponse(res, 'Notification not found or unauthorized', null, 404);
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();
    }

    return successResponse(res, 'Notification marked as read.', { notification });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark all notifications for logged in user as read
 * @route   PATCH /api/notifications/read-all
 * @access  Private (All authenticated users)
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const now = new Date();
    const result = await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true, readAt: now } }
    );

    return successResponse(res, 'All notifications marked as read.', {
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a notification
 * @route   DELETE /api/notifications/:id
 * @access  Private (Recipient only)
 */
const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid notification ID', null, 400);
    }

    const notification = await Notification.findOneAndDelete({
      _id: id,
      recipient: req.user._id,
    });

    if (!notification) {
      return errorResponse(res, 'Notification not found or unauthorized', null, 404);
    }

    return successResponse(res, 'Notification removed successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
