import { Sequelize } from "sequelize";
import db from "../config/Database.js";

const { DataTypes } = Sequelize;

const LabelAddress = db.define("labelAddress", {
    name: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            notEmpty: true
        }
    }
}, {
    freezeTableName: true
})

export default LabelAddress;