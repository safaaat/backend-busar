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
    const { name, numberPhone, city, subdistrict, codePos, completeAddress, courierNote, uuidUser, addressLabel } = req.body;

    const user = await Users.findOne({
        where: {
            uuid: uuidUser
        }
    });

    if (name === "" || numberPhone === "" || city === "" || subdistrict === "" || codePos === "" || completeAddress === "" || addressLabel === "address label") return res.status(401).json({ message: "input form Must be filled in" });

    if (!user) return res.status(401).json({ message: "users tidak terdaftar" });

    if (name.length < 4) return res.status(401).json({ message: "name is too short (minimum 4 digits)." });
    if (numberPhone.length < 10) return res.status(401).json({ message: "number phone is too short (minimum 10 digits)." });
    if (city.length < 4) return res.status(401).json({ message: "city is too short (minimum 4 digits)." });
    if (subdistrict.length < 4) return res.status(401).json({ message: "subdistrict is too short (minimum 4 digits)." });
    if (codePos.length < 5) return res.status(401).json({ message: "code pos is too short (minimum 5 digits)." });
    if (completeAddress.length < 15) return res.status(401).json({ message: "complete address is too short (minimum 15 digits)." });

    let courierNotes = courierNote;
    if (courierNote === "") courierNotes = null

    const address = await Address.findAll();

    if (address.length === 0) {
        try {
            await Address.create({
                uuidUser: uuidUser,
                name: name,
                numberPhone: numberPhone,
                addressLabel: addressLabel,
                city: city,
                subdistrict: subdistrict,
                codePos: codePos,
                completeAddress: completeAddress,
                main: true,
                choice: true,
                courierNote: courierNotes
            });
            return res.status(201).json({ message: "add address success" });
        } catch (error) {
            return res.status(500).json({ message: error.message })
        }
    } else {
        try {
            await Address.create({
                uuidUser: uuidUser,
                name: name,
                numberPhone: numberPhone,
                addressLabel: addressLabel,
                city: city,
                subdistrict: subdistrict,
                codePos: codePos,
                completeAddress: completeAddress,
                courierNote: courierNotes
            });
            res.status(201).json({ message: "add address success" });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}

export const removeAddress = async (req, res) => {
    try {
        const idArray = req.body.id;

        const user = await Users.findOne({ where: { uuid: req.params.uuid } });
        if (!user) return res.status(401).json({ message: "user tidak ditemukan" });

        const address = await Address.findAll({ where: { uuidUser: req.params.uuid } });
        const matchingAddresses = address.filter(addr => idArray.includes(addr.id));
        if (matchingAddresses.length === 0) return res.status(401).json({ message: "users tidak memiliki address tersebut" });

        const addressesChoiceTrue = matchingAddresses.filter(value => value.choice === true);
        const addressMainTrue = address.filter(value => value.main === true);

        if (addressesChoiceTrue.length === 0) {
            for (const address of matchingAddresses) {
                await Address.destroy({ where: { id: address.id } });
            }
            res.status(200).json({ message: "delete address success" });
        } else {
            for (const address of matchingAddresses) {
                await Address.destroy({ where: { id: address.id } });
            }

            await Address.update({
                choice: true
            }, {
                where: {
                    id: addressMainTrue[0].id
                }
            });

            res.status(200).json({ message: "delete address success" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const updateAddress = async (req, res) => {
    const { id, name, numberPhone, city, subdistrict, codePos, completeAddress, courierNote, addressLabel } = req.body;

    const address = await Address.findOne({
        where: {
            id: id
        }
    })

    if (name === "" || numberPhone === "" || city === "" || subdistrict === "" || codePos === "" || completeAddress === "" || addressLabel === "") return res.status(401).json({ message: "input form Must be filled in" });

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
            addressLabel: addressLabel,
            courierNote: courierNotes
        }, {
            where: {
                id: id
            }
        });
        res.status(201).json({ message: "update address success" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const updateMainAddress = async (req, res) => {
    const { mainAddress, address } = req.body;

    const addressMain = await Address.findOne({
        where: {
            id: mainAddress.id
        }
    });
    if (!addressMain) return res.status(401).json({ message: "address main not found" });
    if (addressMain.main !== true) return res.status(401).json({ message: "Unauthorized access. Only main address has permission for this action" });

    const addresss = await Address.findOne({
        where: {
            id: address.id
        }
    });
    if (!addresss) return res.status(401).json({ message: "address not found" });
    if (addresss.main !== null) return res.status(401).json({ message: "Unauthorized access. This action is only allowed for non-main addresses" });

    try {
        await Address.update({
            main: null,
            choice: null
        }, {
            where: {
                id: mainAddress.id
            }
        });
        await Address.update({
            main: true,
            choice: true
        }, {
            where: {
                id: address.id
            }
        });

        return res.status(200).json({ message: "update main address success" })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const updateChoiceAddress = async (req, res) => {
    const { choiceAddress, address } = req.body;

    const addressChoice = await Address.findOne({
        where: {
            id: choiceAddress.id
        }
    });
    if (!addressChoice) return res.status(401).json({ message: "address choice not found" });
    if (addressChoice.choice !== true) return res.status(401).json({ message: "Unauthorized access. Only choice address has permission for this action" });

    const addresss = await Address.findOne({
        where: {
            id: address.id
        }
    });
    if (!addresss) return res.status(401).json({ message: "address not found" });
    if (addresss.choice !== null) return res.status(401).json({ message: "Unauthorized access. This action is only allowed for non-choice addresses" });

    try {
        await Address.update({
            choice: null
        }, {
            where: {
                id: addressChoice.id
            }
        });
        await Address.update({
            choice: true
        }, {
            where: {
                id: address.id
            }
        });

        return res.status(200).json({ message: "update choice address success" })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}