import { Router } from "express";
import { themeController } from "../controllers";
import { checkAuth } from "../utils/checkAuth";

const themeRouter = Router();

themeRouter.get("/private/:visibility", checkAuth, themeController.getThemeController);
themeRouter.get("/public/:visibility", themeController.getPublicThemeController);
themeRouter.post("/created", checkAuth, themeController.getCreatedThemesController);
themeRouter.post("/", checkAuth, themeController.createThemeController);
themeRouter.post("/ai", checkAuth, themeController.createAIThemeController);
themeRouter.post("/buy", checkAuth, themeController.buyThemeController);
themeRouter.post("/share", checkAuth, themeController.shareThemeController);
themeRouter.post("/import", checkAuth, themeController.importThemeController);
export default themeRouter;
