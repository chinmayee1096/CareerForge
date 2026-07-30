import Task from "../models/Task.js";
import StudentProfile from "../models/StudentProfile.js";
import { createNotification } from "../services/notificationService.js";
import { recordActivity } from "../services/activityService.js";

const buildQuery = (req) => {
  const query = req.user.role === "student" ? { userId: req.user._id } : {};
  if (req.user.role !== "student" && req.query.studentId) query.studentId = req.query.studentId;
  if (req.query.status) query.status = req.query.status;
  if (req.query.priority) query.priority = req.query.priority;
  if (req.query.search) query.$text = { $search: req.query.search };
  return query;
};

const taskAccessFilter = (req) =>
  req.user.role === "student"
    ? { userId: req.user._id }
    : { $or: [{ assignedBy: req.user._id }, { userId: req.user._id }] };

export const getTasks = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sort = "-createdAt" } = req.query;
    const query = buildQuery(req);
    const [items, total] = await Promise.all([
      Task.find(query).sort(sort).skip((page - 1) * limit).limit(Number(limit)),
      Task.countDocuments(query)
    ]);
    res.json({ success: true, data: items, meta: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req, res, next) => {
  try {
    let profile = await StudentProfile.findOne({ userId: req.user._id });
    let ownerUserId = req.user._id;
    let assignedBy = undefined;
    let source = "self";

    if (req.user.role !== "student" && req.body.studentId) {
      profile = await StudentProfile.findById(req.body.studentId).populate("userId", "_id name");
      if (!profile) {
        res.status(404);
        throw new Error("Student profile not found.");
      }
      ownerUserId = profile.userId?._id;
      assignedBy = req.user._id;
      source = "mentor";
    }

    const task = await Task.create({
      ...req.body,
      userId: ownerUserId,
      studentId: profile?._id,
      assignedBy,
      source
    });

    if (assignedBy && ownerUserId) {
      await createNotification({
        io: req.io,
        userId: ownerUserId,
        title: "Mentor assigned a task",
        message: `${task.title} was added to your preparation plan.`,
        type: "task",
        priority: task.priority === "high" ? "high" : "medium",
        link: "/tasks"
      });
    }

    await recordActivity({
      actorId: req.user._id,
      studentId: profile?._id,
      type: "task_created",
      title: `Task added: ${task.title}`,
      message: task.deadline ? `Due ${task.deadline.toLocaleDateString("en-IN")}` : task.description,
      metadata: { taskId: task._id, priority: task.priority, category: task.category }
    });
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const update = { ...req.body };
    if (update.status === "completed") update.completedAt = new Date();
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, ...taskAccessFilter(req) },
      update,
      { new: true, runValidators: true }
    );
    if (!task) {
      res.status(404);
      throw new Error("Task not found.");
    }
    if (update.status === "completed") {
      await recordActivity({
        actorId: req.user._id,
        studentId: task.studentId,
        type: "task_completed",
        title: `Task completed: ${task.title}`,
        message: "Closed a preparation task.",
        metadata: { taskId: task._id, category: task.category }
      });
    }
    if (task.deadline && new Date(task.deadline).getTime() - Date.now() < 24 * 60 * 60 * 1000 && task.status !== "completed") {
      await createNotification({
        io: req.io,
        userId: task.userId,
        title: "Task deadline approaching",
        message: `${task.title} is due soon.`,
        type: "task",
        priority: task.priority === "high" ? "high" : "medium",
        link: "/tasks"
      });
    }
    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, ...taskAccessFilter(req) });
    if (!task) {
      res.status(404);
      throw new Error("Task not found.");
    }
    res.json({ success: true, data: { id: req.params.id } });
  } catch (error) {
    next(error);
  }
};
