import Validator from "validatorjs";
import Users from "../../models/UserModel.js";
import argon2 from "argon2";

const cekUsers = async (email) => {
    const user = await Users.findOne({
        where: {
            email: email
        }
    });
    return user;
};

export const RegisterValidasi = async (req, res, next) => {
    const { name, email, password, confPassword } = req.body
    const data = { name, email, password, confPassword }

    const rules = {
        "name": "required|string|min:3|max:50",
        "email": "required|email",
        "password": "required|min:6",
        "confPassword": "required|min:6"
    }

    let validation = new Validator(data, rules);

    if (validation.fails()) {
        return res.status(400).json({ message: validation.errors.errors })
    }

    const user = await cekUsers(email);
    if (user) return res.status(400).json({ message: { email: ["The email you use is registered"] } });
    if (password !== confPassword) return res.status(400).json({ message: { password: ["Password and confirmasi password are not the same"], confPassword: ["Password and confirmasi password are not the same"] } });

    next();
}

export const LoginValidasi = async (req, res, next) => {
    const { email, password } = req.body;

    const user = await cekUsers(email);
    if (!user) return res.status(400).json({ message: { email: ["Invalid email"] } });

    const match = await argon2.verify(user.password, password)
    if (!match) return res.status(400).json({ message: { password: ["The password you entered is incorrect"] } });

    next();
}

