import express from "express";
import { body } from "express-validator";
import { login, me, register, updateProfile } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import { validate } from "../middleware/validateMiddleware.js";

const router = express.Router();

router.post(
  "/register",
  authLimiter,
  [
    body("name").trim().notEmpty().withMessage("Name is required."),
    body("email").isEmail().withMessage("Valid email is required."),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters."),
    body("role").optional().isIn(["student", "mentor", "admin"])
  ],
  validate,
  register
);

router.post(
  "/login",
  authLimiter,
  [body("email").isEmail(), body("password").notEmpty()],
  validate,
  login
);

router.get("/me", protect, me);
router.put("/update-profile", protect, updateProfile);

export default router;
