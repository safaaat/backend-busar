import express from "express";
import {
    getProducts,
    getProductsById,
    updateProducts,
    deleteProducts,
    uploadProduct
} from "../controllers/Products.js";
import { handleFileUploadSizeLimit, getImageNamesFromId, uploadFile, checkUploadText, checkUploadFile, checkUploadFileUpdate, handleDataArrayUpdate, loopRemoveImage, processImages } from "../middleware/ProductMiddleware.js";

const router = express.Router();

router.get("/products", getProducts);
router.get("/products/:id", getProductsById);
router.post("/upload", uploadFile, handleFileUploadSizeLimit, checkUploadText, checkUploadFile, processImages, uploadProduct)
router.delete("/products", getImageNamesFromId, loopRemoveImage, deleteProducts);
router.patch("/products/:id", uploadFile, handleFileUploadSizeLimit, checkUploadText, checkUploadFileUpdate, processImages, handleDataArrayUpdate, loopRemoveImage, updateProducts);

export default router;