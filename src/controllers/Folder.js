import FolderModel from "../models/FolderModel.js";

export const postFolder = async (req, res) => {
    const { userId, nameFolder } = req.body

    try {
        await FolderModel.create({
            userId: userId,
            nameFolder: nameFolder
        });
        res.status(200).json({ message: "Create Folder Success" })
    } catch (error) {
        res.sendStatus(400);
    }
}

export const getFolder = async (req, res) => {
    const { userId } = req.params

    const folder = await FolderModel.findAll({
        where: {
            userId: userId
        }
    });

    res.status(200).json(folder);
}

export const deleteFolder = async (req, res) => {
    try {
        await FolderModel.destroy({ where: { id: req.body.id } });
        res.status(200).json({ message: "Delete folder success" });
    } catch (error) {
        res.sendStatus(400);
    }
}
