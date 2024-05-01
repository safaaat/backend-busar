import Carts from "../models/CartModel.js";

export const createCartDatabase = async (data, uuidUsers) => {
    try {
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

        return "success"
    } catch (error) {
        return null
    }
}