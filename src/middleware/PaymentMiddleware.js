import Products from "../models/ProductModel.js";

export const checkAmoutProduct = async (req, res, next) => {
    const { product } = req.body;

    const products = await Products.findAll();

    const productsWithLowStock = products.filter(data => {
        const cartItem = product.find(item => item.idProduct === data.id);
        return cartItem && data.amount < cartItem.amount;
    });

    if (productsWithLowStock.length !== 0) return res.status(401).json({ message: "some products have insufficient stock for the requested quantity" });

    req.body = req.body
    next();
}