import Notification from "../models/Notification.js";

// Get all notifications for current user
export const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const [items, total, unreadCount] = await Promise.all([
      Notification.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Notification.countDocuments({ userId: req.user._id }),
      Notification.countDocuments({ userId: req.user._id, status: "unread" })
    ]);
    res.json({ success: true, data: items, meta: { total, unreadCount, page: Number(page) } });
  } catch (error) {
    next(error);
  }
};

// Mark single notification as read
export const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { status: "read", readAt: new Date() },
      { new: true }
    );
    if (!notification) {
      res.status(404);
      throw new Error("Notification not found.");
    }
    res.json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

// Mark all as read
export const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, status: "unread" },
      { status: "read", readAt: new Date() }
    );
    res.json({ success: true, message: "All notifications marked as read." });
  } catch (error) {
    next(error);
  }
};

// Delete a notification
export const deleteNotification = async (req, res, next) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ success: true, message: "Notification deleted." });
  } catch (error) {
    next(error);
  }
};

// Helper: emit notification via socket (called from other controllers)
export const emitNotification = (io, userId, notification) => {
  if (io) {
    io.to(`user:${userId}`).emit("notification", notification);
  }
};
