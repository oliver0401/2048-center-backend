import { Router } from "express";
import { rewardController } from "../controllers";
import { checkAuth } from "utils/checkAuth";

const router = Router();

router.post("/send", rewardController.sendReward);

export default router;
