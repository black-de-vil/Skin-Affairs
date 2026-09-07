import express from "express";
import { purchasePlan } from "../controllers/creditController.js";
import { protect } from "../middlewares/auth.js";

const creditRouter = express.Router();

creditRouter.post("/purchase", protect, purchasePlan);

export default creditRouter;