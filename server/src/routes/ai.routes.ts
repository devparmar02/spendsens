import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth } from "@/middleware/auth";
import { validate } from "@/middleware/validate";
import { askAssistantSchema } from "@/validators/ai.validator";
import { ask, history, reset } from "@/controllers/ai.controller";

const router = Router();
router.use(requireAuth);

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: { success: false, message: "Too many requests to the assistant, slow down a little" },
});

router.post("/ask", aiLimiter, validate(askAssistantSchema), ask);
router.get("/history", history);
router.delete("/history", reset);

export default router;
