import { Router } from "express";
import { authController } from "../controllers";
import { checkAuth } from "utils/checkAuth";

const router = Router();

router.post("/signup", authController.registerController);
router.post("/signin", authController.loginController);
router.get("/", checkAuth, authController.getUserController);
router.put("/", checkAuth, authController.updateUserController);

export default router;
