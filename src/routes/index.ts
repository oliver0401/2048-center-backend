import { Router } from "express";
import authRoutes from "./authRoutes";
import themeRouter from "./themeRoutes";
import calcRouter from "./calcRouter";
import rewardRouter from "./rewardRoutes";

export const appRouter = Router();

appRouter.use("/auth", authRoutes);
appRouter.use("/themes", themeRouter);
appRouter.use("/calc", calcRouter);
appRouter.use("/reward", rewardRouter);
