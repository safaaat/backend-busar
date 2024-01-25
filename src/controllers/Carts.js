import Carts from "../models/CartModel.js";
import Products from "../models/ProductModel.js";

export const getCarts = async (req, res) => {
    const cart = await Carts.findAll({
        where: {
            uuidUser: req.params.uuidUser
        }
    });
    return res.status(200).json(cart);
}

const newAddCart = async (data, uuidUsers) => {
    const totalPrice = data.price * data.amount;

    await Carts.create({
        nameProduct: data.name,
        idProduct: data.id,
        uuidUser: uuidUsers,
        urlImage: data.url,
        price: data.price,
        amount: data.amount,
        totalPrice: totalPrice,
    });
}

export const addCart = async (req, res) => {
    const product = await Products.findAll({ where: { id: req.body.id } });
    if (product.length === 0) return res.status(404).json({ message: "dont have a product" })

    const cart = await Carts.findAll({
        where: {
            uuidUser: req.params.uuidUser
        }
    });

    if (cart.length === 0) { // if the user dont have a cart, add the product to the cart
        newAddCart(req.body, req.params.uuidUser)
        return res.status(200).json({ message: "success add cart" })
    }

    const productCart = cart.filter((data) => {
        return data.idProduct === req.body.id
    });

    if (productCart.length === 0) { // if the cart doesn't have any product
        newAddCart(req.body, req.params.uuidUser)
        return res.status(200).json({ message: "success add cart" })
    }

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
        return res.status(200).json({ message: "delete cart success" })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}