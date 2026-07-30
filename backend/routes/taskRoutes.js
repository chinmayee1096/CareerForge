import express from "express";
import { body } from "express-validator";
import { createTask, deleteTask, getTasks, updateTask } from "../controllers/taskController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";

const router = express.Router();

router.route("/")
  .get(protect, getTasks)
  .post(
    protect,
    [body("title").trim().notEmpty().withMessage("Task title is required.")],
    validate,
    createTask
  );

router.route("/:id")
  .put(protect, updateTask)
  .delete(protect, deleteTask);

export default router;
