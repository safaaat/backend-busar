import Carts from "../models/CartModel.js";
import Products from "../models/ProductModel.js";
import { createCartDatabase } from "../servis.js/CartServis.js";
import { sendCartDataToClient } from "../sockets/ConfigureSocket.js";

export const getCarts = async (req, res) => {
    const cart = await Carts.findAll({
        where: {
            uuidUser: req.params.uuidUser
        }
    });
    return res.status(200).json(cart);
}

export const addCart = async (req, res) => {
    const { uuidUser } = req.params;
    const { id, amount } = req.body;

    const product = await Products.findOne({ where: { id: id } });
    // If the product does not exist
    if (!product) return res.status(404).json({ message: "dont have a product" });
    // If the product amount is less than 0
    if (product.amount <= 0) return res.status(404).json({ message: "the product is out of stock" });

    const cart = await Carts.findAll({
        where: {
            uuidUser: uuidUser
        }
    });
    const productCart = cart.filter((data) => {
        return data.idProduct === id
    });

    // if the cart doesn't have any product
    if (productCart.length === 0 || cart.length === 0) {
        const createCart = await createCartDatabase(req.body, uuidUser);
        if (!createCart) return res.status(401).json({ message: "failed add cart" });

        await sendCartDataToClient(uuidUser);
        return res.status(200).json({ message: "success add cart" })
    }

    // If the requested amount exceeds the available stock for the product
    if (product.amount < productCart[0].amount + amount) return res.status(401).json({ message: `${product.name} only has ${product.amount} in stock` });

    try {
        const newAmount = productCart[0].amount + req.body.amount;
        const newTotalPrice = productCart[0].price * newAmount;

        await Carts.update({
            amount: newAmount,
            totalPrice: newTotalPrice,
        }, {
            where: {
                id: productCart[0].id
            }
        });

        await sendCartDataToClient(req.params.uuidUser);

        return res.status(200).json({ message: "success add cart" })
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

export const updateAmountCart = async (req, res) => {
    const cart = await Carts.findAll({
        where: {
            id: req.body.id
        }
    });
    if (cart.length === 0) return res.status(404).json({ message: "dont have a cart" })

    try {
        const newAmount = req.body.amount;
        const newTotalPrice = cart[0].price * newAmount;

        await Carts.update({
            amount: newAmount,
            totalPrice: newTotalPrice,
        }, {
            where: {
                id: cart[0].id
            }
        });

        await sendCartDataToClient(cart[0].uuidUser);
        return res.status(200).json({ message: "success update amount cart" })
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

export const removeCarts = async (req, res) => {
    const cart = await Carts.findAll({
        where: {
            id: req.body.arrayId
        }
    });

    if (cart.length === 0) return res.status(404).json({ message: "dont have a cart" });

    try {
        await Carts.destroy({
            where: {
                id: req.body.arrayId
            }
        });

        await sendCartDataToClient(cart[0].uuidUser);
        return res.status(200).json({ message: "delete cart success" })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}