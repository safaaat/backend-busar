import Carts from "../models/CartModel.js";


export const deletingCartData = async (req, res, next) => {
    try {
        const { product } = req.body;

        for (let index = 0; index < product.length; index++) {
            await Carts.destroy({ where: { id: product[index].id } })
        }

        req.body = req.body;
        next()
    } catch (error) {
        console.error("Error deleting cart data:", error);
        // next(error);
    }
}