import midtransClient from "midtrans-client";
import { nanoid } from 'nanoid';
import Payments from "../models/PaymentModel.js";
import crypto from "crypto";
import { handleBroadcastClient } from "../sockets/ConfigureSocket.js";
import Products from "../models/ProductModel.js";
import { handleUpdatePayment } from "../servis.js/PaymentServis.js";

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

const reduceProductStock = async (data) => {
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

const createDatabasePayment = async (transaction_id, total_price, uuid_users, customer_details, item_details, snap_token, snap_redirect_url, expiration_time) => {
    let time = new Date().getTime();

    await Payments.create({
        transaction_id: transaction_id,
        status: process.env.PAYMENT_PEDDING,
        total_price: total_price,
        uuid_users: uuid_users,
        customer_details: JSON.stringify(customer_details),
        item_details: JSON.stringify(item_details),
        snap_token: snap_token,
        snap_redirect_url: snap_redirect_url,
        date: time,
        expiration_time: expiration_time
    })
}

const updateStatusPayment = async (transaction_id, settlement_time) => {
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
            // Jika waktu kedaluwarsa, update status menjadi "canceled"
            await Payments.update({
                status: process.env.PAYMENT_CANCEL
            }, {
                where: {
                    transaction_id: payment.transaction_id
                }
            });
        }
    });

    console.log("run check expiration_time")
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
        const packagedTime = settlementTime.getTime() + 15 * 60 * 1000;
        // Current Time
        const currentMillis = new Date().getTime();

        if (currentMillis >= packagedTime) {
            // Jika packagedTime, update purchase menjadi "DELIVERED"
            await Payments.update({
                status_purchase: process.env.PURCHASE_DELIVERED
            }, {
                where: {
                    transaction_id: payments.transaction_id
                }
            });
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
        const packagedTime = settlementTime.getTime() + 3 * 24 * 60 * 60 * 1000;
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

    console.log("run check updatePurchaseStatusDelivered")
}

export const createTransaction = async (req, res) => {
    const { total_price, name_customer, email_customer, uuid_users, product } = req.body;
    const transaction_id = `TRX-${nanoid(4)}-${nanoid(8)}`;
    const expiration_time = new Date().getTime() + 24 * 60 * 60 * 1000;

    const snap = new midtransClient.Snap({
        isProduction: false,
        serverKey: process.env.SERVER_KEY,
        clientKey: process.env.CLIENT_KEY
    });

    const parameter = {
        transaction_details: {
            order_id: transaction_id,
            gross_amount: total_price
        },
        item_details: product.map((data) => ({
            idProduct: data.idProduct,
            price: data.price,
            quantity: data.amount,
            name: data.nameProduct
        })),
        customer_details: {
            first_name: name_customer,
            email: email_customer
        },
        callbacks: {
            finish: `${process.env.FRONT_END_URL}/order-status/busar/${transaction_id}`,
            error: `${process.env.FRONT_END_URL}/order-status/busar/${transaction_id}`,
            pending: `${process.env.FRONT_END_URL}/order-status/busar/${transaction_id}`
        }
    }

    const creditCardOption = {
        enabledPayments: ['bank_transfer']
    };

    try {
        const response = await snap.createTransaction(parameter, creditCardOption);

        createDatabasePayment(transaction_id, total_price, uuid_users, parameter.customer_details, parameter.item_details, response.token, response.redirect_url, expiration_time);

        return res.status(200).json({ snap_token: response.token, id: transaction_id, message: "create payment success" })
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const getTransactionByTransactionId = async (req, res) => {
    const { uuid, transaction_id } = req.params;

    // const response = await handleGetStatusMidtrans(transaction_id);
    // return res.status(200).json(response);

    const payment = await handleFindOnePayment(transaction_id);

    if (!payment) return res.status(401).json({ payment, message: "have no payment" });
    // Check uuidUsers Payment
    if (payment.uuid_users !== uuid) return res.status(401).json({ message: "users have no payment" });
    // Check status expired Payment
    if (payment.status === process.env.PAYMENT_CANCEL) return res.status(401).json({ message: "your transaction has expired" });

    if (!payment.data_payment) {
        const response = await handleGetStatusMidtrans(transaction_id);
        if (!response) return res.status(500).json({ message: "Failed to fetch transaction status" });

        await Payments.update({
            data_payment: JSON.stringify(response)
        }, {
            where: {
                transaction_id: transaction_id
            }
        });

        const newPayment = await handleFindOnePayment(transaction_id);
        return res.status(200).json(newPayment);
    }

    return res.status(200).json(payment);
}

const updateStatusTransaction = async (transaction_id, data) => {
    const hash = crypto.createHash("SHA512").update(`${transaction_id}${data.status_code}${data.gross_amount}${process.env.SERVER_KEY}`).digest('hex');
    if (data.signature_key !== hash) return null

    let reponseData = null;
    let transactionStatus = data.transaction_status;
    let fraudStatus = data.fraud_status;
    let settlement_time = data.settlement_time;

    if (transactionStatus == 'capture') {
        if (fraudStatus == 'accept') {
            const transaction = await updateStatusPayment(transaction_id, settlement_time);
            console.log("transaction success");
            await reduceProductStock(data);
            if (transaction) handleBroadcastClient(transaction.transaction_id, transaction)
            reponseData = transaction
        }
    } else if (transactionStatus == 'settlement') {
        const transaction = await updateStatusPayment(transaction_id, settlement_time);
        console.log("transaction success");
        await reduceProductStock(data);
        if (transaction) handleBroadcastClient(transaction.transaction_id, transaction)
        reponseData = transaction
    }
    // else if (transactionStatus == 'cancel' ||
    //     transactionStatus == 'deny' ||
    //     transactionStatus == 'expire') {
    //     const transaction = await updateStatusPayment(transaction_id, process.env.PAYMENT_CANCEL);
    //     reponseData = transaction
    // } else if (transactionStatus == 'pending') {
    //     const transaction = await updateStatusPayment(transaction_id, process.env.PAYMENT_PEDDING);
    //     reponseData = transaction
    // }

    return {
        status: "success",
        data: reponseData
    }
}

// Handler untuk notifikasi dari Midtrans
export const transactionNotif = async (req, res) => {
    const data = req.body;
    const payment = await updateStatusTransaction(data.order_id, data);
    return res.status(200).json(payment)
}

// Handle Update the purchase status to delivered
export const updatePurchaseToDelivered = async (req, res) => {
    const { transaction_id } = req.body;

    const fields = {
        status_purchase: process.env.PURCHASE_DELIVERED
    }

    const response = await handleUpdatePayment(fields, transaction_id);

    if (!response) return res.status(401).json({ message: "PurchaseToDelivered failed" });
    return res.status(200).json({ message: "PurchaseToDelivered success" })
}

