import { Router } from "express";
import { rewardController } from "../controllers";

const router = Router();

router.post("/send", rewardController.sendReward);
export default router;
