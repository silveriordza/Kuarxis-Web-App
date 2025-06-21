/** @format */

let asyncHandler = require("express-async-handler");
let Product = require("../models/productModel.js");
let { LogThis } = require("../utils/Logger.js");

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  console.log("START getProducts function");
  const pageSize = 12;

  const page = Number(req.query.pageNumber) || 1;
  console.log("productController page: ", page);
  //With req.query you can get the parameters after the ? of the URL, in this case we are getting the keyword whenever the user searches for a product in the Navbar of the Home Screen
  const keyword = req.query.keyword
    ? {
        name: {
          $regex: req.query.keyword,
          $options: "i",
        },
      }
    : {};

  const count = await Product.countDocuments({ ...keyword });
  //The skip function will cause the effect of getting the next page of whatever the page is minus one.
  const products = await Product.find({ ...keyword })
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .lean();

  res.json({ products, page, pages: Math.ceil(count / pageSize) });
});

//This is a route to get only one product based on id, you request this with "http://localhost:5000/api/products/1" the 1 is the id of the product you want to find out.
// @desc    Fetch a single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
  console.log("Getting product by id", req.params.id, "START");
  const product = await Product.findById(req.params.id);
  if (product) {
    LogThis(null, `productController, getProductById, product=${product}`);
    res.json(product);
  } else {
    res.status(404);
    throw new Error("Product not found");
  }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (product) {
    //You can check who created the product is teh same as the user deleting the product, in case users can only delete the products they created, but in this website we will trust all the admins with all the products, we will not check for that.
    await product.remove();
    res.json({ message: "Product removed" });
  } else {
    res.status(404);
    throw new Error("Product not found");
  }
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
  const product = new Product({
    name: "Sample name",
    price: 0,
    user: req.user._id,
    image: "/images/sample.jpg",
    brand: "Sample brand",
    isShippable: false,
    isDownloadable: false,
    isImageProtected: false,
    isBookable: false,
    category: "Sample category",
    countInStock: 0,
    numReviews: 0,
    description: "Sample description",
    isCreated: false,
  });
  const createdProduct = await product.save();

  res.status(201).json(createdProduct);
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
  const {
    name,
    price,
    description,
    image,
    brand,
    isShippable,
    isDownloadable,
    isImageProtected,
    isBookable,
    category,
    countInStock,
    isCreated,
  } = req.body;
  const product = await Product.findById(req.params.id);

  LogThis(null, `productController, updateProduct, isShippable=${isShippable}`);

  if (product) {
    product.name = name;
    product.price = price;
    product.description = description;
    product.image = image;
    product.brand = brand;
    product.isShippable = isShippable;
    product.isDownloadable = isDownloadable;
    product.isImageProtected = isImageProtected;
    product.isBookable = isBookable;
    product.category = category;
    product.countInStock = countInStock;
    product.isCreated = isCreated;
    LogThis(null, `productController, updateProduct, product=${product}`);
    const updatedProduct = await product.save();
    LogThis(
      null,
      `productController, updateProduct, updatedProduct=${updatedProduct}`
    );
    res.json(updatedProduct);
  } else {
    res.status(404);
    throw new Error("Product not found");
  }
});

// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private
const createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const product = await Product.findById(req.params.id);

  if (product) {
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );
    if (alreadyReviewed) {
      res.status(400);
      throw new Error("Product already reviewed");
    }

    const review = {
      name: req.user.name,
      rating: Number(rating),
      comment,
      user: req.user._id,
    };
    product.reviews.push(review);
    product.numReviews = product.reviews.length;

    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;

    await product.save();
    res.status(201).json({ message: "Review added" });
  } else {
    res.status(404);
    throw new Error("Product not found");
  }
});

// @desc    Get top rated products
// @route   GET /api/products/top
// @access  Public
const getTopProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({}).sort({ rating: -1 }).limit(3);

  res.json(products);
});

module.exports = {
  getProducts,
  getProductById,
  deleteProduct,
  updateProduct,
  createProduct,
  createProductReview,
  getTopProducts,
};
