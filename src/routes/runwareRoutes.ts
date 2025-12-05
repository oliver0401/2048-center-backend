import { Router } from "express";
import { runwareController } from "../controllers";
import { checkAuth } from "../utils";

const router = Router();
router.post("/text-to-image", checkAuth, runwareController.textToImageController);
router.post("/batch-text-to-image", checkAuth, runwareController.batchTextToImageController);

export default router;