import Notification from "../models/Notification.js";

export const createNotification = async ({
  io,
  userId,
  title,
  message,
  type = "system",
  priority = "medium",
  link = "",
  metadata = {}
}) => {
  if (!userId || !title || !message) return null;

  const notification = await Notification.create({
    userId,
    title,
    message,
    type,
    priority,
    link,
    metadata
  });

  if (io) {
    io.to(`user:${userId}`).emit("notification", notification);
  }

  return notification;
};
