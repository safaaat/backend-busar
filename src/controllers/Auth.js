import Users from "../models/UserModel.js";
import argon2 from "argon2";

export const getUsersByUuid = async (req, res) => {
    try {
        const response = await Users.findOne({
            attributes: ["id", "uuid", "email"],
            where: {
                uuid: req.params.uuid
            }
        });

        if (!response || response.role === "admin") return res.status(404).json({ message: "Email tidak ditemukan" });
        res.status(200).json(response)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const Login = async (req, res) => {
    // Destructuring Request Body
    const { email, password } = req.body;

    // Query Users By Email
    const user = await Users.findOne({
        where: {
            email: email
        }
    });

    // If Users Doesn't Exist
    if (!user) return res.status(400).json({ message: "email yang anda masukan tidak terdafatar" });
    // Matching UserPassword With RequestPasswordBody Using Argon2
    const match = await argon2.verify(user.password, password);
    // If Password Is Not Same Return 400
    if (!match) return res.status(400).json({ message: "password yang anda masukan salah" });

    const userNoPass = await Users.findOne({
        attributes: ["uuid", "email", "role", "idAddress"],
        where: {
            email: email
        }
    });

    res.status(200).json(userNoPass);
}

export const Me = async (req, res) => {
    if (!req.params.uuid) {
        return res.status(401).json({ message: "mohon login ke akun anda!" });
    }
    const userNoPass = await Users.findOne({
        attributes: ["uuid", "email", "role", "idAddress"],
        where: {
            uuid: req.params.uuid
        }
    });
    if (!userNoPass) return res.status(404).json({ message: "user tidak di temukan" });
    res.status(200).json(userNoPass);
}

export const Logout = async (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(400).json({ message: "tidak dapat logout" });
        res.status(200).json({ message: "anda telah logout" })
    });
}