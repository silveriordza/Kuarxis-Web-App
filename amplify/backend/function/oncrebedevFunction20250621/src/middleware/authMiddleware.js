/** @format */

let jwt = require('jsonwebtoken')
let asyncHandler = require('express-async-handler')
let User = require('../models/userModel.js')
const { getSecretValue } = require('../awsServices/awsMiscellaneous.js')
const { LogThis, LoggerSettings, j, L0, L3 } = require('../utils/Logger')
const srcFile = 'authMiddleware.js'

const protect = asyncHandler(async (req, res, next) => {
   let token
   const log = new LoggerSettings(srcFile, 'protect')
   LogThis(log, `START`, L3)
   if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
   ) {
      try {
         token = req.headers.authorization.split(' ')[1]

         LogThis(
            log,
            `About to call getSecretValue process.env.JWT_SECRET_VAR=${process.env.JWT_SECRET_VAR}`,
            L3,
         )
         const secretValue = await getSecretValue(process.env.JWT_SECRET_VAR)

         const decoded = jwt.verify(token, secretValue)

         req.user = await User.findById(decoded.id).select('-password')

         next()
      } catch (error) {
         console.error(error)
         res.status(401)
         throw new Error('Not authorized, token failed')
      }
   }

   if (!token) {
      res.status(401)
      throw new Error('Not authorized, no token')
   }
})

const admin = (req, res, next) => {
   if (req.user && req.user.isAdmin) {
      next()
   } else {
      res.status(401)
      throw new Error('Not authorized as an admin')
   }
}

const hasAccess = (req, res, next) => {
   if (req.user && req.user.hasSurveyOutputAccess) {
      next()
   } else {
      res.status(401)
      throw new Error('Not authorized to access this function')
   }
}

const protectMonkeyWebhook = asyncHandler(async (req, res, next) => {
   const log = new LoggerSettings(srcFile, 'protectMonkeyWebhook')
   LogThis(log, `START`, L3)

   try {
      let token
      req.monkeyAccess = false
      if (
         req.headers.authorization &&
         req.headers.authorization.startsWith('Bearer')
      ) {
         token = req.headers.authorization.split(' ')[1]
         apiKey = req.headers['sm-apikey']
         eventType = req.headers['sm-eventtype']

         const secretToken = await getSecretValue(
            process.env.KUARSIS_SURVEY_MONKEY_WEBHOOKS_TOKEN_VAR,
         )

         const secretApiKey = await getSecretValue(
            process.env.KUARSIS_SURVEY_MONKEY_APIKEY_VAR,
         )

         if (token !== secretToken) {
            throw new Error(
               `Invalid survey monkey webhook token for req.headers=${j(
                  req.headers,
               )};`,
            )
         }

         if (apiKey !== secretApiKey) {
            throw new Error(
               `Invalid survey monkey webhook apiKey for req.headers=${j(
                  req.headers,
               )};`,
            )
         }

         if (eventType !== 'ResponseEvent') {
            throw new Error(
               `Invalid survey monkey webhook eventType for req.headers=${j(
                  req.headers,
               )};`,
            )
         }

         req.monkeyAccess = true
         LogThis(
            log,
            `Survey Monkey webhook authentication approved for ${req.body.name}`,
         )
         next()
      } else {
         res.status(401)
         throw new Error(`Not authorized, no token for ${j(req.body)}`)
      }

      if (!token || !req.monkeyAccess) {
         res.status(401)
         throw new Error(`Not authorized, no token for ${j(req.body)}`)
      }
   } catch (error) {
      console.error(error)
      res.status(401)
      throw new Error(`Not authorized, token failed for ${j(req.body)}`)
   }
})

module.exports = { protect, admin, protectMonkeyWebhook, hasAccess }
