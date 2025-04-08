import { calcController } from "../controllers";
import { Router } from "express";
import { checkAuth } from "../utils";

const router = Router();

router.get("/max-score", checkAuth, calcController.maxScoreController);
router.get("/max-tile", checkAuth, calcController.maxTileController);
router.get("/max-moves", checkAuth, calcController.maxMoveController);

export default router;
