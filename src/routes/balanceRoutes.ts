import { Router } from "express";
import { checkAuth } from "utils";
import { balanceController } from "../controllers";

const router = Router();
router.get("/", checkAuth, balanceController.getBalanceController);
router.post("/", checkAuth, balanceController.depositBalanceController);
router.post("/withdraw", checkAuth, balanceController.withdrawBalanceController);

export default router;
