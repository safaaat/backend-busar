import Catatan from "../models/CatatanModel.js";

export const getCatatan = async (req, res) => {
    const { id } = req.params;

    const catatan = await Catatan.findAll({
        where: {
            userId: id
        }
    });

    res.status(200).json(catatan);
}

export const postCatatan = async (req, res) => {
    const { userId, judul, contain, folderId, createdDate, updateDate } = req.body;

    try {
        await Catatan.create({
            userId: userId,
            judul: judul,
            contain: contain,
            folderId: folderId,
            createdDate: createdDate,
            updateDate: updateDate
        });
        res.status(200).json({ message: "Create Succses" })
    } catch (error) {
        res.sendStatus(400);
    }
}

export const updateCatatan = async (req, res) => {
    const { judul, contain, updateDate } = req.body;

    try {
        await Catatan.update({
            judul: judul,
            contain: contain,
            updateDate: updateDate
        }, {
            where: {
                id: req.params.id
            }
        });
        res.status(200).json({ message: "Update Success" })
    } catch (error) {
        res.sendStatus(400);
    }
}

export const deleteCatatan = async (req, res) => {
    try {
        await Catatan.destroy({ where: { id: req.body.id } });
        res.status(200).json({ message: "Delete catatan success" });
    } catch (error) {
        res.sendStatus(400);
    }
}