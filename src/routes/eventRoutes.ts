import { Router } from "express";
import { eventController } from "../controllers";
import { checkAuth } from "utils/checkAuth";

const router = Router();

// Save or update event record
router.post("/", checkAuth, eventController.saveOrUpdateEventRecordController);

// Get leaderboard for a specific event (with pagination)
router.get("/:event/leaderboard", eventController.getLeaderboardController);

// Get user's rank in a specific event
router.get("/:event/rank", checkAuth, eventController.getUserRankController);

export default router;

