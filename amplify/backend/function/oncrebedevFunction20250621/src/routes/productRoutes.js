let express = require('express')
const router = express.Router()
let {
  getProducts,
  getProductById,
  deleteProduct,
  updateProduct,
  createProduct,
  createProductReview,
  getTopProducts,
} = require('../controllers/productController.js')
let { protect, admin } = require('../middleware/authMiddleware.js')

//This is another way of routing from Express, the getProducts and getProductById are in the productController.js file
router.route('/').get(getProducts).post(protect, admin, createProduct)
router.route('/:id/reviews').post(protect, createProductReview)
router.get('/top', getTopProducts)
router
  .route('/:id')
  .get(getProductById)
  .delete(protect, admin, deleteProduct)
  .put(protect, admin, updateProduct)

module.exports = router
