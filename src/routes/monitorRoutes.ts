import { Router } from "express";
import { monitorController } from "../controllers";

const router = Router();
router.post("/", monitorController.collectMonitorController);

export default router;
