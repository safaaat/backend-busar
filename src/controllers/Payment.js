import midtransClient from "midtrans-client";
import { nanoid } from 'nanoid';
import Payments from "../models/PaymentModel.js";
import crypto from "crypto";
import { handleBroadcastClient, handleSendMessage } from "../sockets/ConfigureSocket.js";
import { createDatabasePayment, handleFindAllPayment, handleFindOnePayment, handleGetStatusMidtrans, handleRemoveCart, handleUpdatePayment, reduceProductStock, removePayment, updatePaymentPending, updateStatusPayment } from "../servis.js/PaymentServis.js";

export const createSnapMidtrans = async (req, res) => {
    const { total_price, name_customer, email_customer, uuid_users, product } = req.body;
    const transaction_id = `TRX-${nanoid(4)}-${nanoid(8)}`;

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
            idCarts: data.id,
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
            error: `${process.env.FRONT_END_URL}/cart/shipment`,
            pending: `${process.env.FRONT_END_URL}/order-status/busar/${transaction_id}`
        }
    }

    const creditCardOption = {
        enabledPayments: ['bank_transfer']
    };

    try {
        const response = await snap.createTransaction(parameter, creditCardOption);

        const field = {
            transaction_id: transaction_id,
            total_price: total_price,
            uuid_users: uuid_users,
            customer_details: JSON.stringify(parameter.customer_details),
            item_details: JSON.stringify(parameter.item_details),
            snap_token: response.token,
            snap_redirect_url: response.redirect_url,
            date: new Date().getTime()
        }
        // Call Function create database payment
        const createPayment = await createDatabasePayment(field);

        if (!createPayment) return res.status(401).json({ message: "create snap midtrans failed" });
        return res.status(200).json({ snap_token: response.token, transaction_id: transaction_id, message: "create snap midtrans success" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Handle Remove Payment
export const handleRemovePayment = async (req, res) => {
    const { transaction_id } = req.body;

    console.log(transaction_id)

    const payment = await removePayment(transaction_id);

    if (!payment) return res.status(401).json({ message: "remove payment failed" });
    return res.status(200).json({ message: "remove payment success" });
}

export const getTransactionByTransactionId = async (req, res) => {
    const { uuid, transaction_id } = req.params;

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

        if (newPayment) handleSendMessage(`${newPayment.uuid_users}-socket-payment`, "get-payment")

        return res.status(200).json(newPayment);
    }

    return res.status(200).json(payment);
}

// Get All Transaction By Uuid
export const getTransactionAllByUuid = async (req, res) => {
    const { uuid } = req.params;

    const response = await handleFindAllPayment(uuid);

    const filterPayment = response.filter((data) => {
        return data.status !== null
    });

    return res.status(200).json(filterPayment);
}

// Handler untuk notifikasi dari Midtrans
export const transactionNotif = async (req, res) => {
    const data = req.body;
    // console.log(data)
    const payment = await updateStatusTransaction(data.order_id, data);
    return res.status(200).json(payment)
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
            if (transaction) {
                // Handle Transaction Success
                handleBroadcastClient(transaction.transaction_id, transaction);

                const allPayment = await handleFindAllPayment(transaction.uuid_users);
                // Handle Socket payment all
                handleBroadcastClient(`${transaction.uuid_users}-socket-payment`, allPayment);
            }
            reponseData = transaction
        }
    } else if (transactionStatus == 'settlement') {
        const transaction = await updateStatusPayment(transaction_id, settlement_time);
        console.log(`transaction: ${data.order_id} status success`);
        await reduceProductStock(data);
        if (transaction) {
            // Handle Socket Transaction Success
            handleBroadcastClient(transaction.transaction_id, transaction);

            const allPayment = await handleFindAllPayment(transaction.uuid_users);
            // Handle Socket payment all
            handleBroadcastClient(`${transaction.uuid_users}-socket-payment`, allPayment);
        }
        reponseData = transaction
    }
    else if (transactionStatus == 'cancel' ||
        transactionStatus == 'deny' ||
        transactionStatus == 'expire') {
        console.log(`transaction: ${data.order_id} status cansel`)
    } else if (transactionStatus == 'pending') {
        // Update Payment pending
        await updatePaymentPending(data.order_id);
        // Remove product from cart. if users purchased.
        await handleRemoveCart(data.order_id);
        console.log(`transaction: ${data.order_id} status pending`)
    }

    return {
        status: "success",
        data: reponseData
    }
}

// Handle Update the purchase status Packed to delivered
export const updatePackedStatusToDelivered = async (req, res) => {
    const { transaction_id } = req.body;

    const getPayment = await handleFindOnePayment(transaction_id);

    // Check Status payment, if the payment status is not PAYMENT_SUCCESS
    if (getPayment.status !== `${process.env.PAYMENT_SUCCESS}`) return res.status(400).json({ message: `payment does not have ${process.env.PAYMENT_SUCCESS} status` });
    // Check Status_purchase, if the purchase status is not packaged
    if (getPayment.status_purchase !== `${process.env.PURCHASE_PACKAGED}`) return res.status(400).json({ message: `purchase does not have ${process.env.PURCHASE_PACKAGED} status` });

    const fields = {
        status_purchase: process.env.PURCHASE_DELIVERED
    }

    const response = await handleUpdatePayment(fields, transaction_id);

    if (!response) return res.status(401).json({ message: "PurchaseToDelivered failed" });

    handleSendMessage(`${getPayment.uuid_users}-socket-payment`, "get-payment")
    return res.status(200).json({ message: "PurchaseToDelivered success" })
}