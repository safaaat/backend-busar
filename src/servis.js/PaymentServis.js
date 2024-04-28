import Payments from "../models/PaymentModel.js"
import Products from "../models/ProductModel.js";
import midtransClient from "midtrans-client";
import { handleSendMessage, sendCartDataToClient } from "../sockets/ConfigureSocket.js";
import Carts from "../models/CartModel.js";

export const handleUpdatePayment = async (field, transactionId) => {
    try {
        await Payments.update(field, {
            where: {
                transaction_id: transactionId
            }
        });

        const payments = await handleFindOnePayment(transactionId);
        const uuid_users = payments.uuid_users;
        const allPayment = await handleFindAllPayment(uuid_users);

        // Socket Payment
        handleSendMessage(`${uuid_users}-socket-payment`, allPayment);
        return "success"
    } catch (error) {
        return null
    }
}

// Get One Data Payment By Transaction_id
export const handleFindOnePayment = async (transaction_id) => {
    try {
        const payment = await Payments.findOne({
            where: {
                transaction_id: transaction_id
            }
        });

        // Parsing customer_details and payment from string to object
        payment.customer_details = JSON.parse(payment.customer_details);
        payment.item_details = JSON.parse(payment.item_details);
        if (payment.data_payment) {
            payment.data_payment = JSON.parse(payment.data_payment);
        }

        let data = { ...payment.dataValues, item_details: JSON.parse(payment.item_details) }

        return data
    } catch (error) {
        return null
    }
}

// Get All Data Payment
export const handleFindAllPayment = async (uuid) => {
    try {
        const payment = await Payments.findAll({
            where: {
                uuid_users: uuid
            }
        });

        const parsedPayments = payment.map(payment => {
            let parsedPayment = { ...payment.dataValues };
            parsedPayment.customer_details = JSON.parse(payment.customer_details);
            parsedPayment.item_details = JSON.parse(payment.item_details);
            if (payment.data_payment) {
                parsedPayment.data_payment = JSON.parse(payment.data_payment);
            }

            let data = { ...parsedPayment, item_details: JSON.parse(parsedPayment.item_details) }

            return data;
        });

        return parsedPayments
    } catch (error) {
        return null
    }
}

export const handleGetStatusMidtrans = async (transaction_id) => {
    let apiClient = new midtransClient.Snap({
        isProduction: false,
        serverKey: process.env.SERVER_KEY,
        clientKey: process.env.CLIENT_KEY
    });

    try {
        const response = await apiClient.transaction.status(transaction_id);

        // Cstore
        if (response.payment_type === "cstore") {
            // Handle Store Indomaret
            if (response.store === "indomaret") {
                const data_payment = {
                    payment_type: response.payment_type,
                    payment_va_numbers: {
                        payment_store: response.store,
                        merchant_id: response.merchant_id,
                        payment_code: response.payment_code,
                    }
                }

                return data_payment
            }

            // Handle Store Alfamart
            const data_payment = {
                payment_type: response.payment_type,
                payment_va_numbers: {
                    payment_store: response.store,
                    payment_code: response.payment_code,
                }
            }

            return data_payment
        }
        // Qris
        if (response.payment_type === "qris") {
            const data_payment = {
                payment_store: response.acquirer
            }

            return data_payment
        }
        // Bank Mandiri
        if (response.payment_type === "echannel") {
            const data_payment = {
                payment_type: response.payment_type,
                payment_va_numbers: {
                    bank: "mandiri",
                    biller_code: response.biller_code,
                    bill_key: response.bill_key,
                }
            }

            return data_payment
        }
        // Bank Transfer
        if (response.payment_type === "bank_transfer") {
            // Handle Permata Bank
            if (response.permata_va_number) {
                const data_payment = {
                    payment_type: response.payment_type,
                    payment_va_numbers: {
                        bank: "permata",
                        va_number: response.permata_va_number
                    }
                }

                return data_payment
            }

            const data_payment = {
                payment_type: response.payment_type,
                payment_va_numbers: response.va_numbers[0],
            }

            return data_payment
        }

        return response;
    } catch (error) {
        return null
    }
}

export const reduceProductStock = async (data) => {
    try {
        const payment = await handleFindOnePayment(data.order_id);
        const productPayment = payment.item_details;

        for (let index = 0; index < productPayment.length; index++) {
            const productId = productPayment[index].idProduct;
            const productAmount = productPayment[index].quantity;

            const product = await Products.findOne({
                where: {
                    id: productId
                }
            })

            await Products.update({
                amount: product.amount - productAmount
            }, {
                where: {
                    id: productId
                }
            })
        }
    } catch (error) {
        console.error("Error reduce product stock:", error);
    }
}

// Create DataBase Payment
export const createDatabasePayment = async (field) => {
    try {
        await Payments.create(field);

        return "success"
    } catch (error) {
        return null
    }
}

// Handle remove data cart array
export const handleRemoveCart = async (transaction_id) => {
    try {
        const payment = await handleFindOnePayment(transaction_id);
        const product = payment.item_details;

        for (let index = 0; index < product.length; index++) {
            await Carts.destroy({ where: { id: product[index].idCarts } })
        }

        sendCartDataToClient(payment.uuid_users);

        return "success"
    } catch (error) {
        console.error("Error deleting cart data:", error);
        // next(error);
    }
}

const convertDateStringToTimestamp = (dateString) => {
    const date = new Date(dateString);
    const millisSinceEpoch = date.getTime();

    return millisSinceEpoch
}

export const updatePaymentPending = async (transaction_id) => {
    try {
        let apiClient = new midtransClient.Snap({
            isProduction: false,
            serverKey: process.env.SERVER_KEY,
            clientKey: process.env.CLIENT_KEY
        });
        const response = await apiClient.transaction.status(transaction_id);

        const data_payment = await handleGetStatusMidtrans(transaction_id);
        const date = convertDateStringToTimestamp(response.transaction_time);
        const expiration_time = convertDateStringToTimestamp(response.expiry_time);

        const field = {
            status: process.env.PAYMENT_PEDDING,
            data_payment: JSON.stringify(data_payment),
            date: date,
            expiration_time: expiration_time,
        }

        await handleUpdatePayment(field, transaction_id);
        return "success"
    } catch (error) {
        return null
    }
}

// Handle update Payment Success
export const updateStatusPayment = async (transaction_id, settlement_time) => {
    try {
        await Payments.update({
            status: process.env.PAYMENT_SUCCESS,
            settlement_time: settlement_time,
            status_purchase: process.env.PURCHASE_PACKAGED
        }, {
            where: {
                transaction_id: transaction_id
            }
        });

        const payment = await handleFindOnePayment(transaction_id);
        return payment
    } catch (error) {
        return null
    }
}

// Handle Remove one payment
export const removePayment = async (transaction_id) => {
    try {
        await Payments.destroy({
            where: {
                transaction_id: transaction_id
            }
        })

        return "success"
    } catch (error) {
        return null
    }
}

// Payment Expiration Time
export const checkAndUpdateExpiredPayments = async () => {
    const currentTime = new Date().getTime();

    // Ambil semua pembayaran dengan status PENDING_PAYMENT dari database
    const pendingPayments = await Payments.findAll({
        where: {
            status: process.env.PAYMENT_PEDDING
        }
    });

    // Periksa setiap pembayaran untuk melihat apakah waktu kedaluwarsa
    pendingPayments.forEach(async (payment) => {
        if (currentTime > payment.expiration_time) {
            const fields = {
                status: process.env.PAYMENT_CANCEL
            }
            // Jika waktu kedaluwarsa, update status menjadi "canceled"
            await handleUpdatePayment(fields, payment.transaction_id)
        }
    });

    console.log("run check checkAndUpdateExpiredPayments")
}

//  Update The Purchase Status To Delivered
export const updatePurchaseStatusDelivered = async () => {
    const payment = await Payments.findAll({
        where: {
            status_purchase: process.env.PURCHASE_PACKAGED
        }
    });

    payment.forEach(async (payments, index) => {
        const settlementTime = new Date(`${payments.settlement_time}`);
        // const packagedTime = settlementTime.getTime() + 15 * 60 * 1000;
        const packagedTime = settlementTime.getTime() + 1 * 60 * 1000;
        // Current Time
        const currentMillis = new Date().getTime();

        if (currentMillis >= packagedTime) {
            const fields = {
                status_purchase: process.env.PURCHASE_DELIVERED
            }
            // if 15 , update purchase menjadi "Delivered"
            await handleUpdatePayment(fields, payments.transaction_id);
        }
    })

    console.log("run check updatePurchaseStatusDelivered")
}

//  Update The Purchase Status To Accepted
export const updatePurchaseStatusAccepted = async () => {
    const paymentDelivered = await Payments.findAll({
        where: {
            status_purchase: process.env.PURCHASE_DELIVERED
        }
    });

    paymentDelivered.forEach(async (payments) => {
        const settlementTime = new Date(`${payments.settlement_time}`);
        // const packagedTime = settlementTime.getTime() + 3 * 24 * 60 * 60 * 1000;
        const packagedTime = settlementTime.getTime() + 2 * 60 * 1000;
        // Current Time
        const currentMillis = new Date().getTime();

        if (currentMillis >= packagedTime) {
            const fields = {
                status_purchase: process.env.PURCHASE_ACCEPTED
            }

            // if 3 day, update purchase menjadi "Accepted"
            await handleUpdatePayment(fields, payments.transaction_id);
        }
    })

    console.log("run check updatePurchaseStatusAccepted")
}