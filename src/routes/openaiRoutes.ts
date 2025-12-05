import { Router } from "express";
import { openaiController } from "../controllers";
import { checkAuth } from "../utils";

const router = Router();
router.post("/", checkAuth, openaiController.getResultController);
router.post("/analyze-theme", checkAuth, openaiController.analyzeThemeController);
router.post("/generate-tile-prompts", checkAuth, openaiController.generateTilePromptsController);
export default router;