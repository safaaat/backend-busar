import Categorys from "../models/CategoryModel.js";

export const getCategory = async (req, res) => {
    try {
        const response = await Categorys.findAll({
            attributes: ["id", "name"]
        });
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

export const createCategory = async (req, res) => {
    const { name } = req.body;

    const category = await Categorys.findAll({
        where: {
            name: name.toLowerCase()
        }
    });

    if (category.length !== 0) return res.status(400).json({ message: "category sudah digunakan" });

    try {
        await Categorys.create({
            name: name.toLowerCase()
        })
        return res.status(200).json({ message: "create category success" });
    } catch (error) {
        res.status(500).josn({ message: error.message });
    }
}

export const removeCategoryId = async (req, res) => {
    try {
        await Categorys.destroy({ where: { id: req.body.id } });
        return res.status(200).json({ message: "remove category success" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}