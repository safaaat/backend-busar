import Payments from "../models/PaymentModel.js"

export const handleUpdatePayment = async (field, transactionId) => {
    try {
        await Payments.update(field, {
            where: {
                transaction_id: transactionId
            }
        });

        return "success"
    } catch (error) {
        return null
    }
}

export const handleGetPayment = async (transaction_id) => {
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