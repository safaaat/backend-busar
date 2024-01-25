import LabelAddress from "../models/LabelAddressModel.js"

export const getLabelAddress = async (req, res) => {
    try {
        const response = await LabelAddress.findAll();
        res.status(200).json(response)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}