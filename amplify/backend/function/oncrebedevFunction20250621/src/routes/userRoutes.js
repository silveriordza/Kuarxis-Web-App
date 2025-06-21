let express = require('express')

const router = express.Router()
let {
  authUser,
  registerUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
} = require('../controllers/userController.js')
let { protect, admin } = require('../middleware/authMiddleware.js')

router.route('/').post(registerUser).get(protect, admin, getUsers)

router.post('/sign-in', authUser)

router.route('/profile').get(protect, getUserProfile)

router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile)

router
  .route('/:id')
  .delete(protect, admin, deleteUser)
  .get(protect, admin, getUserById)
  .put(protect, admin, updateUser)

module.exports = router
