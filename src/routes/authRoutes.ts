import { Router } from "express";
import { authController } from "../controllers";
import { checkAuth } from "../utils";

const router = Router();

router.post("/", authController.registerController);
router.get("/", checkAuth, authController.getUserController);
router.put("/", checkAuth, authController.updateUserController);
router.put("/:itemId", checkAuth, authController.updateItemController);
router.post("/record", authController.recordSigninActivityController);
router.post("/avatar", checkAuth, authController.uploadAvatarController);
router.get("/collect", authController.collectUsersController);
router.get("/subscribers/daily", authController.countDailySubscribersController);
export default router;
