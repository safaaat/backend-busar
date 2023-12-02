import multer from "multer";
import path from "path";
import crypto from "crypto";
import Products from "../models/ProductModel.js";
import * as fs from 'node:fs/promises';

const TYPE_IMAGE = {
    "image/jpg": "jpg",
    "image/jpeg": "jpeg",
    "image/png": "png",
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "src/public/images/product");
    },
    filename: (req, file, cb) => {
        const uuid = crypto.randomUUID();
        cb(null, new Date().getTime() + uuid + path.extname(file.originalname))
    }
})

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

// Middleware untuk memeriksa apakah ada file yang diunggah
const checkUploadText = async (req, res, next) => {
    const { name, amount, price, category, information } = req.body;
    // Pastikan 'image1' atau 'image2' ada dalam request files
    if (name === "") return res.status(400).json({ message: "name tidak boleh kosong." });
    if (amount === "") return res.status(400).json({ message: "amount tidak boleh kosong." });
    if (price === "") return res.status(400).json({ message: "price tidak boleh kosong." });
    if (category === "") return res.status(400).json({ message: "category tidak boleh kosong." });
    if (information === "") return res.status(400).json({ message: "information tidak boleh kosong." });
    next();
}

const checkUploadFile = async (req, res, next) => {
    if (!req.files || (!req.files["image1"] && !req.files["image2"] && !req.files["image3"] && !req.files["image4"] && !req.files["image5"])) return res.status(400).json({ message: "harap unggah file gambar." });
    next();
}

const handleCombineImage = (req, res, next) => {
    const { image1, image2, image3, image4, image5 } = req.files;

    let urlProduct
    let imageProduct
    if (image1) {
        let url = { image1: `images/product/${image1[0].filename}` }
        let image = { image1: image1[0].filename }

        urlProduct = { ...urlProduct, ...url }
        imageProduct = { ...imageProduct, ...image }
    }
    if (image2) {
        let url = { image2: `images/product/${image2[0].filename}` }
        let image = { image2: image2[0].filename }

        urlProduct = { ...urlProduct, ...url }
        imageProduct = { ...imageProduct, ...image }
    }
    if (image3) {
        let url = { image3: `images/product/${image3[0].filename}` }
        let image = { image3: image3[0].filename }

        urlProduct = { ...urlProduct, ...url }
        imageProduct = { ...imageProduct, ...image }
    }
    if (image4) {
        let url = { image4: `images/product/${image4[0].filename}` }
        let image = { image4: image4[0].filename }

        urlProduct = { ...urlProduct, ...url }
        imageProduct = { ...imageProduct, ...image }
    }
    if (image5) {
        let url = { image5: `images/product/${image5[0].filename}` }
        let image = { image5: image5[0].filename }

        urlProduct = { ...urlProduct, ...url }
        imageProduct = { ...imageProduct, ...image }
    }

    req.url = urlProduct;
    req.images = imageProduct;
    next()
}

// // Middleware khusus untuk menangani batasan ukuran file
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

const maxSize = 1 * 1024 * 1024; //1MB

const uploadFile = multer({ storage, fileFilter, limits: { fileSize: maxSize } }).fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
    { name: "image5", maxCount: 1 },
]);

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
        await fs.unlink(`./public/images/product/${element}`);
    }

    next();
}

const checkUploadFileUpdate = async (req, res, next) => {
    const { image1, image2, image3, image4, image5 } = req.body;

    if (!image1 && !image2 && !image3 && !image4 && !image5 && (!req.files["image1"] && !req.files["image2"] && !req.files["image3"] && !req.files["image4"] && !req.files["image5"])) return res.status(400).json({ message: "harap unggah file gambar." });
    next();
}

const handleDataArrayUpdate = async (req, res, next) => {
    const { image1, image2, image3, image4, image5 } = req.files;

    const product = await Products.findOne({
        where: {
            id: req.params.id
        }
    })
    const convertObjUrl = JSON.parse(product.url);
    const convertObjImage = JSON.parse(product.image);

    let arrayRemoveImage = [];
    let newArrayImage = {}
    let newArrayUrl = {}

    // Check if 'product image1' exists
    if (convertObjImage.image1) {
        // Check if 'users image1' not same 'product image1'
        if (req.body.image1 !== convertObjUrl.image1) {
            // if not same, push data 'product image1' to arrayRomoveImage
            arrayRemoveImage.push(convertObjImage.image1);
            // check if users input file image1
            if (image1) {
                // if yes, enter the image1 file input data into the object newArrayImage and newArrayUrl
                let url = { image1: `images/product/${image1[0].filename}` }
                let image = { image1: image1[0].filename }

                newArrayImage = { ...newArrayImage, ...image }
                newArrayUrl = { ...newArrayUrl, ...url }
            }
        }
        // if 'users image1' is the same as 'product image1'
        else {
            // enter the 'product image1' into newArrayImage and newArrayUrl objects
            newArrayUrl = { ...newArrayUrl, image1: convertObjUrl.image1 }
            newArrayImage = { ...newArrayImage, image1: convertObjImage.image1 }
        }
    } else if (image1 && !convertObjImage.image1) {
        let url = { image1: `images/product/${image1[0].filename}` }
        let image = { image1: image1[0].filename }

        newArrayImage = { ...newArrayImage, ...image }
        newArrayUrl = { ...newArrayUrl, ...url }
    }

    // Check if 'product image2' exists
    if (convertObjImage.image2) {
        // Check if 'users image2' not same 'product image1'
        if (req.body.image2 !== convertObjUrl.image2) {
            // if not same, push data 'product image2' to arrayRomoveImage
            arrayRemoveImage.push(convertObjImage.image2);
            // check if users input file image1
            if (image2) {
                // if yes, enter the image1 file input data into the object newArrayImage and newArrayUrl
                let url = { image2: `images/product/${image2[0].filename}` }
                let image = { image2: image2[0].filename }

                newArrayImage = { ...newArrayImage, ...image }
                newArrayUrl = { ...newArrayUrl, ...url }
            }
        }
        // if 'users image2' is the same as 'product image2'
        else {
            // enter the 'product image2' into newArrayImage and newArrayUrl objects
            newArrayUrl = { ...newArrayUrl, image2: convertObjUrl.image2 }
            newArrayImage = { ...newArrayImage, image2: convertObjImage.image2 }
        }
    } else if (image2 && !convertObjImage.image2) {
        let url = { image2: `images/product/${image2[0].filename}` }
        let image = { image2: image2[0].filename }

        newArrayImage = { ...newArrayImage, ...image }
        newArrayUrl = { ...newArrayUrl, ...url }
    }

    // Check if 'product image3' exists
    if (convertObjImage.image3) {
        // Check if 'users image3' not same 'product image3'
        if (req.body.image3 !== convertObjUrl.image3) {
            // if not same, push data 'product image3' to arrayRomoveImage
            arrayRemoveImage.push(convertObjImage.image3);
            // check if users input file image3
            if (image3) {
                // if yes, enter the image3 file input data into the object newArrayImage and newArrayUrl
                let url = { image3: `images/product/${image3[0].filename}` }
                let image = { image3: image3[0].filename }

                newArrayImage = { ...newArrayImage, ...image }
                newArrayUrl = { ...newArrayUrl, ...url }
            }
        }
        // if 'users image3' is the same as 'product image3'
        else {
            // enter the 'product image3' into newArrayImage and newArrayUrl objects
            newArrayUrl = { ...newArrayUrl, image3: convertObjUrl.image3 }
            newArrayImage = { ...newArrayImage, image3: convertObjImage.image3 }
        }
    } else if (image3 && !convertObjImage.image3) {
        let url = { image3: `images/product/${image3[0].filename}` }
        let image = { image3: image3[0].filename }

        newArrayImage = { ...newArrayImage, ...image }
        newArrayUrl = { ...newArrayUrl, ...url }
    }

    // Check if 'product image4' exists
    if (convertObjImage.image4) {
        // Check if 'users image4' not same 'product image4'
        if (req.body.image4 !== convertObjUrl.image4) {
            // if not same, push data 'product image4' to arrayRomoveImage
            arrayRemoveImage.push(convertObjImage.image4);
            // check if users input file image4
            if (image4) {
                // if yes, enter the image4 file input data into the object newArrayImage and newArrayUrl
                let url = { image4: `images/product/${image4[0].filename}` }
                let image = { image4: image4[0].filename }

                newArrayImage = { ...newArrayImage, ...image }
                newArrayUrl = { ...newArrayUrl, ...url }
            }
        }
        // if 'users image4' is the same as 'product image4'
        else {
            // enter the 'product image4' into newArrayImage and newArrayUrl objects
            newArrayUrl = { ...newArrayUrl, image4: convertObjUrl.image4 }
            newArrayImage = { ...newArrayImage, image4: convertObjImage.image4 }
        }
    } else if (image4 && !convertObjImage.image4) {
        let url = { image4: `images/product/${image4[0].filename}` }
        let image = { image4: image4[0].filename }

        newArrayImage = { ...newArrayImage, ...image }
        newArrayUrl = { ...newArrayUrl, ...url }
    }

    // Check if 'product image5' exists
    if (convertObjImage.image5) {
        // Check if 'users image5' not same 'product image5'
        if (req.body.image5 !== convertObjUrl.image5) {
            // if not same, push data 'product image5' to arrayRomoveImage
            arrayRemoveImage.push(convertObjImage.image5);
            // check if users input file image5
            if (image5) {
                // if yes, enter the image5 file input data into the object newArrayImage and newArrayUrl
                let url = { image5: `images/product/${image5[0].filename}` }
                let image = { image5: image5[0].filename }

                newArrayImage = { ...newArrayImage, ...image }
                newArrayUrl = { ...newArrayUrl, ...url }
            }
        }
        // if 'users image5' is the same as 'product image5'
        else {
            // enter the 'product image5' into newArrayImage and newArrayUrl objects
            newArrayUrl = { ...newArrayUrl, image5: convertObjUrl.image5 }
            newArrayImage = { ...newArrayImage, image5: convertObjImage.image5 }
        }
    } else if (image5 && !convertObjImage.image5) {
        let url = { image5: `images/product/${image5[0].filename}` }
        let image = { image5: image5[0].filename }

        newArrayImage = { ...newArrayImage, ...image }
        newArrayUrl = { ...newArrayUrl, ...url }
    }


    req.arrayRemoveImage = arrayRemoveImage;
    req.newArrayImage = newArrayImage;
    req.newArrayUrl = newArrayUrl;
    next()
}

export { uploadFile, checkUploadText, checkUploadFile, handleCombineImage, handleFileUploadSizeLimit, getImageNamesFromId, loopRemoveImage, checkUploadFileUpdate, handleDataArrayUpdate };