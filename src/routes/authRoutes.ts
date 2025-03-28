import { Router } from "express";
import { authController } from "../controllers";
import { checkAuth } from "utils/checkAuth";

const router = Router();

router.post("/", authController.registerController);
router.get("/", checkAuth, authController.getUserController);
router.put("/", checkAuth, authController.updateUserController);
router.put("/:itemId", checkAuth, authController.updateItemController);

export default router;
