import { Router } from "express";
import { themeController } from "../controllers";
import { checkAuth } from "../utils/checkAuth";

const themeRouter = Router();

themeRouter.get("/", checkAuth, themeController.getThemeController);
themeRouter.post("/buy", checkAuth, themeController.buyThemeController);

export default themeRouter;
