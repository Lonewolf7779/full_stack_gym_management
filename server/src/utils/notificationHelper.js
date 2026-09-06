const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Safely create a persisted in-app notification
 * @param {Object} options
 * @param {string|ObjectId} options.recipient - User ID recipient
 * @param {string} options.type - Controlled notification type enum
 * @param {string} options.title - Short header (max 120 chars)
 * @param {string} options.message - Descriptive text (max 500 chars)
 * @param {string} [options.relatedEntityType] - Optional entity type
 * @param {string|ObjectId} [options.relatedEntityId] - Optional entity ID
 * @param {string} [options.idempotencyKey] - Optional unique key for deduplication
 * @param {Object} [options.metadata] - Extra metadata payload
 * @returns {Promise<Notification|null>}
 */
const createNotification = async ({
  recipient,
  type,
  title,
  message,
  relatedEntityType = null,
  relatedEntityId = null,
  idempotencyKey = null,
  metadata = {},
}) => {
  try {
    if (!recipient) {
      console.warn('[NotificationHelper] Cannot create notification: Missing recipient');
      return null;
    }

    // Verify recipient user exists and is active (or valid)
    const user = await User.findById(recipient).select('_id status');
    if (!user) {
      console.warn(`[NotificationHelper] Recipient user ${recipient} not found`);
      return null;
    }

    // Check idempotency if key is specified
    if (idempotencyKey) {
      const existing = await Notification.findOne({ idempotencyKey });
      if (existing) {
        return existing;
      }
    }

    const notification = await Notification.create({
      recipient,
      type,
      title: title.substring(0, 120),
      message: message.substring(0, 500),
      relatedEntityType,
      relatedEntityId,
      idempotencyKey: idempotencyKey || null,
      metadata,
    });

    return notification;
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate idempotencyKey ignored safely
      return null;
    }
    console.error('[NotificationHelper] Error creating notification:', error.message);
    return null;
  }
};

module.exports = {
  createNotification,
};