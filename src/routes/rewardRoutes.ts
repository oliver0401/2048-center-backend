import { Router } from "express";
import { rewardController } from "../controllers";

const router = Router();

router.post("/send", rewardController.sendReward);
router.post("/betting", rewardController.bettingReward);
export default router;
