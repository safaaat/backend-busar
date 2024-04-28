import Users from "../models/UserModel.js"
import argon2 from "argon2";

export const getUsers = async (req, res) => {
    const { email } = req.body
    try {
        const response = await Users.findAll({
            attributes: ["id", "email", "idAddress", "role"]
        });
        if (response.email !== email)
            res.status(200).json(response)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const getUsersByEmail = async (req, res) => {
    try {
        const response = await Users.findOne({
            attributes: ["uuid"],
            where: {
                email: req.params.email
            }
        });

        if (!response || response.role === "admin") return res.status(404).json({ message: "Email tidak ditemukan" });

        res.status(200).json(response.uuid)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const createUsers = async (req, res) => {
    const { email, password, confirmasiPassword, role, idAddress } = req.body

    // fetch data from database based on email
    const user = await Users.findOne({
        where: {
            email: email
        }
    })
    // if if there are user return 404
    if (user) return res.status(404).json({ message: "email yang anda gunakan sudah terdaftar" })
    // if the password and confirmasi password not is the same
    if (password !== confirmasiPassword) return res.status(401).json({ message: "password dan confirmasi password tidak sama" });
    const hashPassword = await argon2.hash(password);

    try {
        await Users.create({
            email: email,
            password: hashPassword,
            role: role,
            idAddress: idAddress
        });
        res.status(201).json({ message: "register success" })
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export const updateUsers = async (req, res) => {
    // Query Users By Params Id
    const user = await Users.findOne({
        where: {
            uuid: req.params.id
        }
    });
    // Destructuring Request Body
    const { password, confirmasiPassword } = req.body;


    // If Users Doesn't Exist
    if (!user) return res.status(404).json({ message: "user tidak di temukan" });
    // If Password Cannot Be Empty
    if (password === "" || confirmasiPassword === "") return res.status(401).json({ message: "password dan confirmasi password tidak boleh kosong" });
    // if password and confirmasi password are not the same, return status 400
    if (password !== confirmasiPassword) return res.status(401).json({ message: "password dan confirmasi password tidak sama" });
    // Matching UserPassword With RequestPasswordBody Using Argon2
    const match = await argon2.verify(user.password, password);
    // If Password Is Not Same Return 400
    if (match) return res.status(400).json({ message: "password tetep sama" });

    // Hashing Password
    const hashPassword = await argon2.hash(password);
    // Update Users
    try {
        await Users.update({
            password: hashPassword
        }, {
            where: {
                id: user.id
            }
        });
        res.status(200).json({ message: "update user success" })
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export const updateIdAddress = async (req, res) => {
    const user = await Users.findOne({
        where: {
            uuid: req.params.uuid
        }
    })
    if (!user) return res.status(401).json({ message: "user tidak ditemukan" });

    try {
        await Users.update({
            idAddress: req.body.idAddress
        }, {
            where: {
                id: user.id
            }
        })
        res.status(200).json({ message: "update address user success" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export const changeEmailUsers = async (req, res) => {
    const { email } = req.body;

    const user = await Users.findOne({
        where: {
            uuid: req.params.uuid
        }
    });

    if (!user) return res.status(404).json({ message: "Email tidak ditemukan" });

    try {
        await Users.update({
            email: email
        }, {
            where: {
                id: user.id
            }
        });
        res.status(200).json({ message: "update user success" })
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export const deleteUsers = async (req, res) => {
    const user = await Users.findOne({
        where: {
            uuid: req.params.id
        }
    });
    // if the user is not found
    if (!user) return res.status(404).json({ message: "user tidak di temukan" });
    try {
        await Users.destroy({
            where: {
                id: user.id
            }
        });
        res.status(200).json({ message: "delete user success" })
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}