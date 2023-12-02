import { Sequelize } from "sequelize";
import db from "../config/Database.js";

const { DataTypes } = Sequelize;

const Wishlist = db.define("wishlist", {
    uuidUser: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    idProduct: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
}, {
    freezeTableName: true
});

export default Wishlist;