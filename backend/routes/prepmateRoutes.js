import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getPrepMateResponse } from "../controllers/prepmateController.js";

const router = express.Router();

router.use(protect);
router.post("/chat", getPrepMateResponse);

export default router;
