import { Router } from "express";
import authRoutes from "./authRoutes";
import themeRouter from "./themeRoutes";
import calcRouter from "./calcRouter";
import rewardRouter from "./rewardRoutes";
import recordRouter from "./recordRoutes";
import openaiRoutes from "./openaiRoutes";
import runwareRoutes from "./runwareRoutes";
import balanceRoutes from "./balanceRoutes";
import monitorRoutes from "./monitorRoutes";

export const appRouter = Router();

appRouter.use("/auth", authRoutes);
appRouter.use("/themes", themeRouter);
appRouter.use("/calc", calcRouter);
appRouter.use("/reward", rewardRouter);
appRouter.use("/records", recordRouter);
appRouter.use("/openai", openaiRoutes);
appRouter.use("/runware", runwareRoutes);
appRouter.use("/balance", balanceRoutes);
appRouter.use("/monitor", monitorRoutes);