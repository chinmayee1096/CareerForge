import express from "express";
import { body } from "express-validator";
import multer from "multer";
import { analyzeStudentResume, createProgressLog, getProfile, listStudents, parseStudentResume, updateProfile, uploadStudentResume } from "../controllers/studentController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { aiLimiter } from "../middleware/rateLimiter.js";
import { validate } from "../middleware/validateMiddleware.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "text/markdown"
    ];
    if (allowed.includes(file.mimetype) || /\.(pdf|doc|docx|txt|md)$/i.test(file.originalname)) return cb(null, true);
    return cb(new Error("Upload PDF, DOC, DOCX, TXT, or MD resume files only."));
  }
});

router.get("/", protect, authorize("mentor", "admin"), listStudents);
router.get("/profile", protect, authorize("student"), getProfile);
router.put("/profile", protect, authorize("student"), updateProfile);
router.post("/progress", protect, authorize("student"), [body("studyMinutes").optional().isNumeric()], validate, createProgressLog);
router.post("/resume/parse", protect, authorize("student"), [body("resumeText").optional().isString()], validate, parseStudentResume);
router.post("/resume/upload", protect, authorize("student"), upload.single("resume"), uploadStudentResume);
router.post("/resume/analyze", protect, authorize("student"), aiLimiter, analyzeStudentResume);

export default router;
