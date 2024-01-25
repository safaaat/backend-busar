import multer from "multer";
import path from "path";
import crypto from "crypto";
import Products from "../models/ProductModel.js";
import * as fs from 'node:fs/promises';
import sharp from "sharp";

const TYPE_IMAGE = {
    "image/jpg": "jpg",
    "image/jpeg": "jpeg",
    "image/png": "png",
}

const fileFilter = (req, file, cb) => {
    const acceptMime = Object.keys(TYPE_IMAGE);

    if (!acceptMime.includes(file.mimetype)) {
        const error = new multer.MulterError("INAPPROPRIATE_FILE_FORMAT");
        error.field = file.fieldname;
        return cb(error, false);
    } else {
        cb(null, true);
    }
}

const maxSize = 1 * 1024 * 1024; //1MB

const uploadFile = multer({
    fileFilter,
    limits: { fileSize: maxSize }
}).fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
    { name: "image5", maxCount: 1 },
]);

// Middleware khusus untuk menangani batasan ukuran file
const handleFileUploadSizeLimit = (err, req, res, next) => {
    // err instanceof multer.MulterError = untuk check apakah multer memiliki error
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            res.status(400).json({ message: `Ukuran file ${err.field} terlalu besar. Maksimum 1MB diizinkan.` });
        } else if (err.code === "INAPPROPRIATE_FILE_FORMAT") {
            res.status(400).json({ message: "format gambar tidak sesuai. Hanya format JPG, JPEG, atau PNG yang diizinkan." });
        } else {
            res.status(500).json({ error: "Terjadi kesalahan dalam mengunggah file." });
        }
    } else {
        next(err);
    }
};

// Middleware untuk memeriksa apakah ada file yang diunggah
const checkUploadText = async (req, res, next) => {
    const { name, amount, price, category, information } = req.body;
    // Pastikan 'image1' atau 'image2' ada dalam request files
    if (name === "" || !name) return res.status(400).json({ message: "name tidak boleh kosong." });
    if (amount === "" || !amount) return res.status(400).json({ message: "amount tidak boleh kosong." });
    if (price === "" || !price) return res.status(400).json({ message: "price tidak boleh kosong." });
    if (category === "" || !category) return res.status(400).json({ message: "category tidak boleh kosong." });
    if (information === "" || !information) return res.status(400).json({ message: "information tidak boleh kosong." });
    next();
}

const checkUploadFile = async (req, res, next) => {
    if (!req.files || (!req.files["image1"] && !req.files["image2"] && !req.files["image3"] && !req.files["image4"] && !req.files["image5"])) return res.status(400).json({ message: "harap unggah file gambar." });
    next();
}

// Fungsi middleware untuk mengubah format gambar menjadi WebP setelah diunggah
const processImages = async (req, res, next) => {
    try {
        // Lakukan pengolahan gambar untuk setiap field
        const imageFields = ["image1", "image2", "image3", "image4", "image5"];
        let imageWebp;
        let urlWebp;

        for (const field of imageFields) {
            if (req.files[field]) {
                // Ambil path file yang diunggah
                const imagePath = req.files[field][0].buffer;
                // Random uuid
                const uuid = crypto.randomUUID();
                const fileName = `${new Date().getTime() + uuid}.webp`

                // Lakukan proses dengan sharp untuk mengonversi ke format WebP
                await sharp(imagePath)
                    .webp() // Konversi ke format WebP
                    .toFile(path.join("src/public/images/product", fileName));

                const newImage = { [field]: fileName }
                const newUrl = { [field]: `images/product/${fileName}` }

                imageWebp = { ...imageWebp, ...newImage };
                urlWebp = { ...urlWebp, ...newUrl };
            }
        }

        req.newImages = imageWebp;
        req.newUrl = urlWebp;
        // Lanjutkan ke middleware berikutnya atau route handler
        next();
    } catch (error) {
        // Tangani kesalahan jika ada
        console.error("Error processing images:", error);
        return res.status(500).send("Internal Server Error");
    }
}

const getImageNamesFromId = async (req, res, next) => {
    let arrayImage = [];
    for (const arrayId of req.body.arrayId) {
        const product = await Products.findOne({
            where: {
                id: arrayId
            }
        });
        const imagesAll = JSON.parse(product.image);
        const array = Object.values(imagesAll);
        arrayImage = [...arrayImage, ...array];
    };

    req.arrayRemoveImage = arrayImage;

    next()
}

const loopRemoveImage = async (req, res, next) => {
    for (const element of req.arrayRemoveImage) {
        await fs.unlink(`./src/public/images/product/${element}`);
    }

    req.newArrayImage = req.newArrayImage;
    req.newArrayUrl = req.newArrayUrl;
    next();
}

const checkUploadFileUpdate = async (req, res, next) => {
    const { image1, image2, image3, image4, image5 } = req.body;

    if (!image1 && !image2 && !image3 && !image4 && !image5 && (!req.files["image1"] && !req.files["image2"] && !req.files["image3"] && !req.files["image4"] && !req.files["image5"])) return res.status(400).json({ message: "harap unggah file gambar." });
    next();
}

const handleDataArrayUpdate = async (req, res, next) => {
    const images = req.newImages;
    const urls = req.newUrl;

    const product = await Products.findOne({
        where: {
            id: req.params.id
        }
    })

    const convertObjImage = JSON.parse(product.image);

    let arrayRemoveImage = [];
    let newArrayImage = { ...images }
    let newArrayUrl = { ...urls }

    // Lakukan pengolahan gambar untuk setiap field
    const imageFields = ["image1", "image2", "image3", "image4", "image5"];

    for (const image of imageFields) {
        // check if users upload image
        if (req.files[image]) {
            // check if the database has an image. remove image database
            if (convertObjImage[image]) {
                arrayRemoveImage.push(convertObjImage[image]);
            }
        } else { // if the users does not upload image
            if (req.body[image]) {
                const images = { [image]: convertObjImage[image] };
                const urls = { [image]: `images/product/${convertObjImage[image]}` };

                newArrayImage = { ...newArrayImage, ...images };
                newArrayUrl = { ...newArrayUrl, ...urls };
            } else {
                if (convertObjImage[image]) arrayRemoveImage.push(convertObjImage[image]);
            }
        }
    }

    req.arrayRemoveImage = arrayRemoveImage;
    req.newArrayImage = newArrayImage;
    req.newArrayUrl = newArrayUrl;

    next()
}

export { uploadFile, checkUploadText, checkUploadFile, handleFileUploadSizeLimit, getImageNamesFromId, loopRemoveImage, checkUploadFileUpdate, handleDataArrayUpdate, processImages };