import { Router } from "express";
import { approvalController } from "../controllers";

const approvalRouter = Router();

approvalRouter.post("/", approvalController.createApprovalController);

export default approvalRouter;

