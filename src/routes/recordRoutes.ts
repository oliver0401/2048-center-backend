import { Router } from "express";
import { recordController } from "../controllers";
import { checkAuth } from "utils/checkAuth";

const router = Router();

// Save a new play record
router.post("/", checkAuth, recordController.saveRecordController);

// Get user's play records (basic pagination)
router.get("/", checkAuth, recordController.getUserRecordsController);

// Search records with advanced filtering and sorting
router.get("/search", checkAuth, recordController.searchRecordsController);

// Get records by date range
router.get("/date-range", checkAuth, recordController.getRecordsByDateRangeController);

// Get a specific record by ID
router.get("/:recordId", checkAuth, recordController.getRecordByIdController);

// Delete a record
router.delete("/:recordId", checkAuth, recordController.deleteRecordController);

export default router;
