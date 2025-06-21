/** @format */

let asyncHandler = require('express-async-handler')
let generateToken = require('../utils/generateToken.js')
let User = require('../models/userModel.js')
let {
   LogThis,
   LoggerSettings,
   OFF,
   L0,
   L1,
   L2,
   L3,
} = require('../utils/Logger.js')

const srcFileName = 'userController.js'

// @desc    Auth user & get token
// @route   POST /users/sign-in
// @access  Public
const authUser = asyncHandler(async (req, res) => {
   const functionName = 'authUser'
   const log = new LoggerSettings(srcFileName, functionName)

   const { email, password } = req.body

   LogThis(log, `User logging in: ${email}`, L0)

   const user = await User.findOne({
      email: { $regex: new RegExp(email, 'i') },
   })
   if (user && (await user.matchPassword(password))) {
      console.log('userController:authUser', 'password matched')
      res.json({
         _id: user._id,
         name: user.name,
         email: user.email,
         isAdmin: user.isAdmin,
         hasSurveyOutputAccess: user.hasSurveyOutputAccess,
         token: generateToken(user._id),
      })
   } else {
      console.log('userController:authUser', 'password not matched')
      res.status(401).json({ message: 'Email o password inválido.' })
      throw new Error('Invalid email or password')
   }
})

// @desc    Register a new user
// @route   POST /users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
   const {
      name,
      email,
      password,
      address,
      internalNumber,
      city,
      state,
      postalCode,
      country,
   } = req.body

   const userExists = await User.findOne({
      email: { $regex: new RegExp(email, 'i') },
   })

   if (userExists) {
      res.status(400)
      throw new Error('User already exists')
   }

   const user = await User.create({
      name,
      email,
      password,
      address,
      internalNumber,
      city,
      state,
      postalCode,
      country,
   })

   if (user) {
      res.status(201).json({
         _id: user._id,
         name: user.name,
         email: user.email,
         isAdmin: user.isAdmin,
         hasSurveyOutputAccess: user.hasSurveyOutputAccess,
         address: user.address,
         internalNumber: user.internalNumber,
         city: user.city,
         state: user.state,
         postalCode: user.postalCode,
         country: user.country,
         token: generateToken(user._id),
      })
   } else {
      res.status(400)
      throw new Error('Invalid user data')
   }
})

// @desc    Get user profile
// @route   GET /users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
   const user = await User.findById(req.user._id)

   if (user) {
      res.json({
         _id: user._id,
         name: user.name,
         email: user.email,
         isAdmin: user.isAdmin,
         hasSurveyOutputAccess: user.hasSurveyOutputAccess,
         address: user.address,
         internalNumber: user.internalNumber,
         city: user.city,
         state: user.state,
         postalCode: user.postalCode,
         country: user.country,
      })
   } else {
      res.status(404)
      throw new Error('User not found')
   }
})

// @desc    Update user profile
// @route   PUT /users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
   const user = await User.findById(req.user._id)

   if (user) {
      user.name = req.body.name || user.name
      user.email = req.body.email || user.email
      if (req.body.password) {
         user.password = req.body.password
      }
      user.address = req.body.address || user.address
      user.internalNumber = req.body.internalNumber || user.internalNumber
      user.city = req.body.city || user.city
      user.state = req.body.state || user.state
      user.postalCode = req.body.postalCode || user.postalCode
      user.country = req.body.country || user.country

      const updatedUser = await user.save()
      res.json({
         _id: updatedUser._id,
         name: updatedUser.name,
         email: updatedUser.email,
         isAdmin: updatedUser.isAdmin,
         hasSurveyOutputAccess: updatedUser.hasSurveyOutputAccess,
         address: updatedUser.address,
         internalNumber: updatedUser.internalNumber,
         city: updatedUser.city,
         state: updatedUser.state,
         postalCode: updatedUser.postalCode,
         country: updatedUser.country,
         token: generateToken(updatedUser._id),
      })
   } else {
      res.status(404)
      throw new Error('User not found')
   }
})

// @desc    Get all users
// @route   GET /users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
   const users = await User.find({})
   res.json(users)
})

// @desc    Delete user
// @route   DELETE /users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
   const user = await User.findById(req.params.id)

   if (user) {
      await user.remove()
      res.json({ message: 'User removed' })
   } else {
      res.status(404)
      throw new Error('User not found')
   }
})

// @desc    Get a user by Id
// @route   GET /users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
   const user = await User.findById(req.params.id).select('-password')
   if (user) {
      res.json(user)
   } else {
      res.status(404)
      throw new Error('User not found')
   }
})

// @desc    Update user
// @route   PUT /users/:id
// @access  Private
const updateUser = asyncHandler(async (req, res) => {
   const user = await User.findById(req.params.id)

   if (user) {
      user.name = req.body.name || user.name
      user.email = req.body.email || user.email
      user.isAdmin = req.body.isAdmin
      user.hasSurveyOutputAccess = req.body.hasSurveyOutputAccess
      user.address = req.body.address || user.address
      user.internalNumber = req.body.internalNumber || user.internalNumber
      user.city = req.body.city || user.city
      user.state = req.body.state || user.state
      user.postalCode = req.body.postalCode || user.postalCode
      user.country = req.body.country || user.country
      const updatedUser = await user.save()

      res.json({
         _id: updatedUser._id,
         name: updatedUser.name,
         email: updatedUser.email,
         isAdmin: updatedUser.isAdmin,
         hasSurveyOutputAccess: updatedUser.hasSurveyOutputAccess,
         address: updatedUser.address,
         internalNumber: updatedUser.internalNumber,
         city: updatedUser.city,
         state: updatedUser.state,
         postalCode: updatedUser.postalCode,
         country: updatedUser.country,
      })
   } else {
      res.status(404)
      throw new Error('User not found')
   }
})

module.exports = {
   authUser,
   registerUser,
   getUserProfile,
   updateUserProfile,
   getUsers,
   deleteUser,
   getUserById,
   updateUser,
}
