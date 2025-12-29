import { Router } from "express";
import { approvalController } from "../controllers";

const approvalRouter = Router();

approvalRouter.post("/", approvalController.createApprovalController);
approvalRouter.get("/list", approvalController.getAllApprovalsController);

export default approvalRouter;

