import express from "express";
import { createTransaction, getTransactionByTransactionId, transactionNotif, updatePurchaseToDelivered } from "../controllers/Payment.js";
import { deletingCartData } from "../middleware/PaymentMiddleware.js";

const router = express.Router();

router.post("/process-transaction", deletingCartData, createTransaction);
router.get("/transaction/:uuid/:transaction_id", getTransactionByTransactionId);
router.post("/transaction/notification", transactionNotif);
router.patch("/transaction/update/purchase", updatePurchaseToDelivered);

export default router;