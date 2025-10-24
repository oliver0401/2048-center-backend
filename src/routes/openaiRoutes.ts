import { Router } from "express";
import { openaiController } from "../controllers";
import { checkAuth } from "../utils";

const router = Router();
router.post("/", checkAuth, openaiController.getResultController);
export default router;