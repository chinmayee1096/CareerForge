import Activity from "../models/Activity.js";

export const recordActivity = async ({
  actorId,
  studentId,
  targetUserId,
  type,
  title,
  message,
  metadata
}) => {
  try {
    if (!actorId || !type || !title) return null;
    return await Activity.create({ actorId, studentId, targetUserId, type, title, message, metadata });
  } catch {
    return null;
  }
};
