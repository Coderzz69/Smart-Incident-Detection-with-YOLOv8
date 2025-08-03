import express from "express";

import { incidentController } from "../controllers/incident.controller.js";

const router = express.Router();

router.post("/detect", incidentController);

export default router;