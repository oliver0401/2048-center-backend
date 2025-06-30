import { Router } from "express";
import { themeController } from "../controllers";
import { checkAuth } from "../utils/checkAuth";

const themeRouter = Router();

themeRouter.get("/:visibility", checkAuth, themeController.getThemeController);
themeRouter.post("/created", checkAuth, themeController.getCreatedThemesController);
themeRouter.post("/", checkAuth, themeController.createThemeController);
themeRouter.post("/buy", checkAuth, themeController.buyThemeController);

export default themeRouter;
