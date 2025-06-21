let express = require('express')
const router = express.Router()

let {
  uploadProduct,
  listProducts,
  getUploadPublicPrivatePresignedURL,
} = require('../controllers/uploadController.js')

router.route('/').post(uploadProduct)
router.route('/').get(listProducts)
router.route('/getPutObjectURLs').get(getUploadPublicPrivatePresignedURL)

module.exports = router
