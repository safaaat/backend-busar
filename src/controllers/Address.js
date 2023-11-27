import Address from "../models/AddressModel.js";
import Users from "../models/UserModel.js";

export const getAddress = async (req, res) => {
    try {
        const response = await Address.findAll({
            where: {
                uuidUser: req.params.uuid
            }
        });
        res.status(200).json(response)
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const createAddress = async (req, res) => {
    const { name, numberPhone, city, subdistrict, codePos, completeAddress, courierNote, uuidUser } = req.body;

    const user = await Users.findOne({
        where: {
            uuid: uuidUser
        }
    });


    if (name === "" || numberPhone === "" || city === "" || subdistrict === "" || codePos === "" || completeAddress === "") return res.status(401).json({ message: "input form Must be filled in" });

    if (!user) return res.status(401).json({ message: "users tidak terdaftar" });

    if (name.length < 4) return res.status(401).json({ message: "name is too short (minimum 4 digits)." });
    if (numberPhone.length < 10) return res.status(401).json({ message: "number phone is too short (minimum 10 digits)." });
    if (city.length < 4) return res.status(401).json({ message: "city is too short (minimum 4 digits)." });
    if (subdistrict.length < 4) return res.status(401).json({ message: "subdistrict is too short (minimum 4 digits)." });
    if (codePos.length < 5) return res.status(401).json({ message: "code pos is too short (minimum 5 digits)." });
    if (completeAddress.length < 15) return res.status(401).json({ message: "complete address is too short (minimum 15 digits)." });

    let courierNotes;
    if (courierNote === "") courierNotes = null

    try {
        await Address.create({
            uuidUser: uuidUser,
            name: name,
            numberPhone: numberPhone,
            city: city,
            subdistrict: subdistrict,
            codePos: codePos,
            completeAddress: completeAddress,
            courierNote: courierNotes
        });
        res.status(201).json({ message: "add address success" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export const removeAddress = async (req, res) => {
    try {
        const idArray = req.body.id

        const user = await Users.findOne({ where: { uuid: req.params.uuid } });
        if (!user) return res.status(401).json({ message: "user tidak ditemukan" });

        const address = await Address.findAll({ where: { uuidUser: req.params.uuid } });
        const matchingAddresses = address.filter(addr => idArray.includes(addr.id));
        if (matchingAddresses.length === 0) return res.status(401).json({ message: "users tidak memiliki address tersebut" });

        for (const address of matchingAddresses) {
            await Address.destroy({ where: { id: address.id } });
        }
        res.status(200).json({ message: "delete address success" });
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

export const updateAddress = async (req, res) => {
    const { id, name, numberPhone, city, subdistrict, codePos, completeAddress, courierNote } = req.body;

    const address = await Address.findOne({
        where: {
            id: id
        }
    })

    if (name === "" || numberPhone === "" || city === "" || subdistrict === "" || codePos === "" || completeAddress === "") return res.status(401).json({ message: "input form Must be filled in" });

    if (!address) return res.status(401).json({ message: "address tidak ditemukan" });

    if (name.length < 4) return res.status(401).json({ message: "name is too short (minimum 4 digits)." });
    if (numberPhone.length < 10) return res.status(401).json({ message: "number phone is too short (minimum 10 digits)." });
    if (city.length < 4) return res.status(401).json({ message: "city is too short (minimum 4 digits)." });
    if (subdistrict.length < 4) return res.status(401).json({ message: "subdistrict is too short (minimum 4 digits)." });
    if (codePos.length < 5) return res.status(401).json({ message: "code pos is too short (minimum 5 digits)." });
    if (completeAddress.length < 15) return res.status(401).json({ message: "complete address is too short (minimum 15 digits)." });

    let courierNotes;
    if (courierNote === "") courierNotes = null

    try {
        await Address.update({
            name: name,
            numberPhone: numberPhone,
            city: city,
            subdistrict: subdistrict,
            codePos: codePos,
            completeAddress: completeAddress,
            courierNote: courierNotes
        }, {
            where: {
                id: id
            }
        });
        res.status(201).json({ message: "update address success" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}