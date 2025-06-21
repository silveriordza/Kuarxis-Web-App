let express = require('express')
const router = express.Router()
let {getScheduleByProviderId, updateScheduleByProviderId} = require('../controllers/schedulerController.js')
let { protect, admin } = require('../middleware/authMiddleware.js')

// // This is comming from /api/orders
// router.route('/').post(protect, addOrderItems).get(protect, admin, getOrders)

// router.route('/downloadOrderedProduct/:id').get(protect, downloadOrderedProduct)
  
// router.route('/myorders').get(protect, getMyOrders)
// // Make sure the route that uses the :id is at the bottom of your routes, otherwise, it the router will treat all other routes as if they were ids.
router.route('/').get(protect, getScheduleByProviderId)
router.route('/').put(protect, updateScheduleByProviderId)

// router.route('/:id/pay').put(protect, updateOrderToPaid)

// router.route('/:id/delivered').put(protect, admin, updateOrderToDelivered)

module.exports = router
