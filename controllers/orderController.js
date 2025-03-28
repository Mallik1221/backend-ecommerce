const Order = require('../models/orderSchema.js');

const newOrder = async (req, res) => {
    try {

        const {
            buyer,
            shippingData,
            orderedProducts,
            paymentInfo,
            productsQuantity,
            totalPrice,
        } = req.body;

        const order = await Order.create({
            buyer,
            shippingData,
            orderedProducts,
            paymentInfo,
            paidAt: Date.now(),
            productsQuantity,
            totalPrice,
        });

        return res.send(order);

    } catch (err) {
        res.status(500).json(err);
    }
}

const getOrderedProductsByCustomer = async (req, res) => {
    try {
        let orders = await Order.find({ buyer: req.params.id });

        if (orders.length > 0) {
            const orderedProducts = orders.reduce((accumulator, order) => {
                order.orderedProducts.forEach(product => {
                    accumulator.push({
                        ...product.toObject(),
                        orderId: order._id,
                        orderStatus: order.orderStatus,
                        orderedAt: order.createdAt
                    });
                });
                return accumulator;
            }, []);
            res.send(orderedProducts);
        } else {
            res.send({ message: "No products found" });
        }
    } catch (err) {
        res.status(500).json(err);
    }
};

const getOrderedProductsBySeller = async (req, res) => {
    try {
        const sellerId = req.params.id;

        const ordersWithSellerId = await Order.find({
            'orderedProducts.seller': sellerId
        });

        if (ordersWithSellerId.length > 0) {
            const orderedProducts = ordersWithSellerId.reduce((accumulator, order) => {
                order.orderedProducts.forEach(product => {
                    if (product.seller.toString() === sellerId) {
                        const existingProductIndex = accumulator.findIndex(p => p._id.toString() === product._id.toString());
                        if (existingProductIndex !== -1) {
                            // If product already exists, merge quantities
                            accumulator[existingProductIndex].quantity += product.quantity;
                        } else {
                            // If product doesn't exist, add it to accumulator with order details
                            accumulator.push({
                                ...product.toObject(),
                                orderId: order._id,
                                orderStatus: order.orderStatus
                            });
                        }
                    }
                });
                return accumulator;
            }, []);
            res.send(orderedProducts);
        } else {
            res.send({ message: "No products found" });
        }
    } catch (err) {
        res.status(500).json(err);
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;
        
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        order.orderStatus = status;
        if (status === "Delivered") {
            order.deliveredAt = Date.now();
        }
        
        await order.save();
        res.send(order);
    } catch (err) {
        res.status(500).json(err);
    }
};

const getOrdersByStatus = async (req, res) => {
    try {
        const { sellerId, status } = req.params;
        
        const orders = await Order.find({
            'orderedProducts.seller': sellerId,
            orderStatus: status
        });

        if (orders.length > 0) {
            const orderedProducts = orders.reduce((accumulator, order) => {
                order.orderedProducts.forEach(product => {
                    if (product.seller.toString() === sellerId) {
                        const existingProductIndex = accumulator.findIndex(p => p._id.toString() === product._id.toString());
                        if (existingProductIndex !== -1) {
                            accumulator[existingProductIndex].quantity += product.quantity;
                        } else {
                            accumulator.push(product);
                        }
                    }
                });
                return accumulator;
            }, []);
            res.send(orderedProducts);
        } else {
            res.send({ message: "No products found" });
        }
    } catch (err) {
        res.status(500).json(err);
    }
};

module.exports = {
    newOrder,
    getOrderedProductsByCustomer,
    getOrderedProductsBySeller,
    updateOrderStatus,
    getOrdersByStatus
};
