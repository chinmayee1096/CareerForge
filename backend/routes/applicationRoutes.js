import express from "express";
import { body } from "express-validator";
import {
  createApplication,
  deleteApplication,
  getApplicationAnalytics,
  listApplications,
  updateApplication
} from "../controllers/applicationController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";

const router = express.Router();

router.use(protect, authorize("student"));

router.get("/analytics", getApplicationAnalytics);

router.route("/")
  .get(listApplications)
  .post(
    [
      body("company").trim().notEmpty().withMessage("Company is required."),
      body("role").trim().notEmpty().withMessage("Role is required.")
    ],
    validate,
    createApplication
  );

router.route("/:id")
  .put(updateApplication)
  .delete(deleteApplication);

export default router;
