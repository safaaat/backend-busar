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
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
        }
    },
    image: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: true,
        }
    },
    amount: {
        type: DataTypes.BIGINT,
        allowNull: false,
        validate: {
            notEmpty: true,
        }
    },
    url: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: true,
        }
    },
    price: {
        type: DataTypes.BIGINT,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    category: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notEmpty: true,
        }
    },
    information: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [0, 1000]
        }
    }
}, {
    freezeTableName: true
});

export default Wishlist;