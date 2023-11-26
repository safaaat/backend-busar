import Users from "../models/UserModel.js";
import argon2 from "argon2";
import jwt from "jsonwebtoken";

const cekUsers = async (email) => {
    const user = await Users.findAll({
        where: {
            email: email
        }
    });
    return user;
};

const usersNoPass = async (email) => {
    const user = await Users.findAll({
        attributes: ["id", "name", "email"],
        where: {
            email: email
        }
    })
    return user;
}

export const register = async (req, res) => {
    const { name, email, password } = req.body;
    // Hash Password
    const hashPassword = await argon2.hash(password);
    // Create Users
    try {
        await Users.create({
            name: name,
            email: email,
            password: hashPassword
        })
        res.status(200).json({ msg: "Register success" })
    } catch (error) {
        console.error(error);
    }
}

export const login = async (req, res) => {
    const user = await cekUsers(req.body.email);
    const { id, name, email } = user[0];
    const accessToken = jwt.sign({ id, name, email }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "20s"
    })
    const refreshToken = jwt.sign({ id, name, email }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: "1d"
    })

    await Users.update({ refresh_token: refreshToken }, {
        where: {
            id: id
        }
    });
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        secure: false
    });

    const userNoPass = await usersNoPass(req.body.email)
    return res.status(200).json(userNoPass);
}

export const logout = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    console.log(refreshToken)

    if (!refreshToken) return res.sendStatus(204);
    const user = await Users.findOne({
        where: {
            refresh_token: refreshToken
        }
    });

    if (!user) return res.sendStatus(204)
    await Users.update({ refresh_token: null }, {
        where: {
            id: user.id
        }
    });
    res.clearCookie("refreshToken");
    return res.status(200).json({ msg: "Anda berhasil logout" });
}

export const refreshToken = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) return req.sendStatus(401);

    const user = await Users.findOne({
        where: {
            refresh_token: refreshToken
        }
    })
    if (!user) return res.sendStatus(403);

    try {
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decode) => {
            if (err) return res.sendStatus(403);
            const userId = user.id;
            const name = user.name;
            const email = user.email;
            const accessToken = jwt.sign({ userId, name, email }, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '15s'
            });
            res.json({ accessToken })
        })
    } catch (error) {
        console.log(error)
    }
}