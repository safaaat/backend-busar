import { Sequelize } from "sequelize";
import db from "../config/Database.js";

const { DataTypes } = Sequelize;

export const ForderModel = db.define("folder", {
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    nameFolder: {
        type: DataTypes.STRING
    }
}, {
    freezeTableName: true
});

export default ForderModel;