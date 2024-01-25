import Products from "../models/ProductModel.js";

export const getProducts = async (req, res) => {
    try {
        const response = await Products.findAll();
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const getProductsById = async (req, res) => {
    try {
        const response = await Products.findOne({
            where: {
                id: req.params.id
            }
        });
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const uploadProduct = async (req, res) => {
    try {
        const { name, amount, price, category, information } = req.body;

        const imagesJSON = JSON.stringify(req.newImages);
        const urlJSON = JSON.stringify(req.newUrl);

        await Products.create({
            name: name.toLowerCase(),
            image: imagesJSON,
            amount: amount,
            url: urlJSON,
            price: price,
            category: category,
            information: information,
        })

        res.status(200).json({ message: "add product success" })
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const updateProducts = async (req, res) => {
    const { name, amount, price, category, information } = req.body;
    const imagesJSON = JSON.stringify(req.newArrayImage)
    const urlJSON = JSON.stringify(req.newArrayUrl)

    try {
        await Products.update({
            name: name.toLowerCase(),
            image: imagesJSON,
            amount: amount,
            url: urlJSON,
            price: price,
            category: category,
            information: information,
        }, {
            where: {
                id: req.params.id
            }
        });
        res.status(200).json({ message: "update product success" })
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const deleteProducts = async (req, res) => {
    try {
        await Products.destroy({
            where: {
                id: req.body.arrayId
            }
        });

        return res.status(200).json({ message: "product delete successfuly" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}