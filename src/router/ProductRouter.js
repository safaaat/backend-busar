import express from "express";
import {
    getProducts,
    getProductsById,
    updateProducts,
    deleteProducts,
    uploadProduct
} from "../controllers/Products.js";
import { handleCombineImage, handleFileUploadSizeLimit, getImageNamesFromId, uploadFile, checkUploadText, checkUploadFile, checkUploadFileUpdate, handleDataArrayUpdate, loopRemoveImage } from "../middleware/ProductMiddleware.js";

const router = express.Router();

router.get("/products", getProducts);
router.get("/products/:id", getProductsById);
router.post("/upload", uploadFile, checkUploadText, checkUploadFile, handleCombineImage, handleFileUploadSizeLimit, uploadProduct)
router.patch("/products/:id", uploadFile, handleFileUploadSizeLimit, checkUploadText, checkUploadFileUpdate, handleDataArrayUpdate, loopRemoveImage, updateProducts);
router.delete("/products", getImageNamesFromId, loopRemoveImage, deleteProducts);

export default router;