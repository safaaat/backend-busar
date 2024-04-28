import express from "express";
import { createSnapMidtrans, getTransactionAllByUuid, getTransactionByTransactionId, handleRemovePayment, transactionNotif, updatePackedStatusToDelivered } from "../controllers/Payment.js";
import { handleGetStatusMidtrans } from "../servis.js/PaymentServis.js";
import { checkAmoutProduct } from "../middleware/PaymentMiddleware.js";

const router = express.Router();

router.post("/process-transaction", checkAmoutProduct, createSnapMidtrans);
router.get("/transaction/:uuid/:transaction_id", getTransactionByTransactionId);
router.get("/transaction/:uuid", getTransactionAllByUuid);
router.post("/transaction/notification", transactionNotif);
router.patch("/transaction/update/purchase/delivered", updatePackedStatusToDelivered);
router.delete("/transaction/remove/payment", handleRemovePayment);


router.post("/transaction/check", handleGetStatusMidtrans);

export default router;