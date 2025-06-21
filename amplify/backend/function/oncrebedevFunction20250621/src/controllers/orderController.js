/** @format */

let asyncHandler = require("express-async-handler");
let Order = require("../models/orderModel.js");
let path = require("node:path");
let Product = require("../models/productModel.js");
let awsS3Services = require("../awsServices/awsS3Services");
let LogThisLegacy = require("../utils/Logger.js");

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = asyncHandler(async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    orderPaymentResult,
  } = req.body;

  if (orderItems && orderItems.length === 0) {
    res.status(400);
    throw new Error("No order items");
    return;
  } else {
    const order = new Order({
      orderItems,
      user: req.user._id,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    });

    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = orderPaymentResult;

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
  }
});

// @desc    Get order
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    "user",
    "name email"
  );
  if (order) {
    res.json(order);
  } else {
    res.status(404);
    throw new Error("Order not found");
  }
});

// @desc   Update order to paid
// @route   GET /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.update_time,
      email_address: req.body.payer.email_address,
    };

    const updatedOrder = await order.save();

    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error("Order not found");
  }
});

// @desc   Update order to delivered
// @route  PUT /api/orders/:id/delivered
// @access Private/Admin
const updateOrderToDelivered = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error("Order not found");
  }
});

// @desc   Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id });

  // LogThisLegacy(
  //   null,
  //   `orderController, getMyOrders: req.user._id=${
  //     req.user._id
  //   }, orders=${JSON.stringify(orders)}`
  // );

  res.json(orders);
});

// @desc   Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({}).populate("user", "id name");
  res.json(orders);
});

// @desc    Get downloadOrderedProduct
// @route   GET /orders/downloadOrderedProduct/:id
// @access  Private
const downloadOrderedProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  console.log("Product is:", product);
  if (product) {
    const preSignedURL = await awsS3Services.getPresignedURL(product.image);
    console.log("orderController presignedURL:", preSignedURL);
    res.send(preSignedURL);
  } else {
    res.status(404);
    throw new Error("Product not found");
  }
});

module.exports = {
  addOrderItems,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  getMyOrders,
  getOrders,
  downloadOrderedProduct,
};
