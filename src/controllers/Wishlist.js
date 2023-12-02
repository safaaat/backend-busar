import Wishlist from "../models/WishlistModel.js";

export const getWishlist = async (req, res) => {
    const wishlists = await Wishlist.findAll({
        attributes: ["id", "uuidUser", "idProduct"],
        where: {
            uuidUser: req.params.uuidUser
        }
    });

    return res.status(200).json(wishlists);
}

export const addWishlist = async (req, res) => {
    const wishlists = await Wishlist.findAll({
        where: {
            uuidUser: req.body.uuidUser
        }
    });

    const filterWishlists = wishlists.filter((data) => {
        return data.idProduct === req.body.idProduct
    });

    if (filterWishlists.length !== 0) return res.status(401).json({ message: "product sudah ada di daftar wishlist" });

    try {
        await Wishlist.create({
            uuidUser: req.body.uuidUser,
            idProduct: req.body.idProduct
        });

        res.status(200).json({ message: "success add wishlist" });
    } catch (error) {
        req.status(400).json({ message: error.message });
    }
}

export const removeWishlist = async (req, res) => {
    const wishlists = await Wishlist.findAll({
        where: {
            id: req.params.id
        }
    });

    if (wishlists.length === 0) return res.status(401).json({ message: "product tidak ada di daftar wishlist" });

    try {
        await Wishlist.destroy({ where: { id: req.params.id } })

        res.status(200).json({ message: "success remove wishlist" });
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}