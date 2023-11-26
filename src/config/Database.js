import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

const db = new Sequelize(process.env.DATABASE_NAME, process.env.DATABASE_USER, process.env.PASSWORD, {
    host: process.env.HOST,
    dialect: "mysql"
});

export default db;