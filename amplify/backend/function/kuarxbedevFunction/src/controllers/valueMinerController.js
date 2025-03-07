/**
 * @format
 * @prittier
 */

const mongoose = require('mongoose')
const Schema = mongoose.Schema
const axios = require('axios')

let asyncHandler = require('express-async-handler')

// const {
//    applyStringCriteriaToValue,
//    formatDate,
// } = require('../utils/Functions.js')
const {
   getBalanceSheets,
   updateAlphaVantage,
   updateAlphaVantageDailyPrices,
} = require('../utils/alphaVantageAPI.js')

const {
   secEdgarBulkUpdate,
   secEdgarBulkQuarterUpdate,
   edgarBulkCompanyFactsUpdate,
} = require('../utils/kuarxEdgarAPI.js')

let {
   BalanceSheetAnnual,
   BalanceSheetQuarterly,
} = require('../models/valueMinerModel.js')

const ValueMinerMetricsGenerator = require('../classes/ValueMinerClasses/ValueMinerMetricsGenerator.js')

let {
   LoggerSettings,
   LogThis,
   LogVars,
   HasDataException,
   LogDebugSection,
   LogVarsFilter,
   j,
   OFF,
   L0,
   L1,
   L2,
   L3,
} = require('../utils/Logger.js')

// let {
//    saveDynamicModelToDB,
//    loadOneDynamicModelFromDB,
//    dynamicModelsMap,
//    convertDataTypeToMongoSchemaDataType,
// } = require('../utils/mongoDbHelper.js')
const srcFileName = 'valueMinerController.js'

// @desc    Creates a new Super Survey configuration
// @route   POST /api/surveys/
// @access  Private/Admin
const postBalanceSheets = asyncHandler(async (req, res) => {
   const functionName = 'postBalanceSheets'
   const log = new LoggerSettings(srcFileName, functionName)

   const { symbols } = req.body

   const letBalanceSheets = await getBalanceSheets(symbols)

   let ownerId = req.user._id

   res.status(201).json({
      letBalanceSheets: letBalanceSheets,
   })
})

// @desc    Creates a new Super Survey configuration
// @route   POST /api/updatealphavantage/
// @access  Private/Admin
const postupdateAlphaVantageController = asyncHandler(async (req, res) => {
   const functionName = 'postBalanceSheets'
   const log = new LoggerSettings(srcFileName, functionName)

   const { inputs } = req.body

   const letBalanceSheets = await updateAlphaVantage(inputs)

   //let ownerId = req.user._id

   res.status(201).json({
      letBalanceSheets: letBalanceSheets ? 'Success' : 'Failed',
   })
})

const postSecEdgarBulkController = asyncHandler(async (req, res) => {
   const functionName = 'postSecEdgarBulkController'
   const log = new LoggerSettings(srcFileName, functionName)

   const { years } = req.body

   const success = await secEdgarBulkUpdate(years)

   let ownerId = req.user._id

   res.status(201).json({
      success: success,
   })
})

const postSecEdgarBulkUpdateQuarterController = asyncHandler(
   async (req, res) => {
      const functionName = 'postSecEdgarBulkUpdateQuarterController'
      const log = new LoggerSettings(srcFileName, functionName)

      const { quarters } = req.body

      const success = await secEdgarBulkQuarterUpdate(quarters)

      let ownerId = req.user._id

      res.status(201).json({
         success: success,
      })
   },
)

const postEdgarBulkCompanyFactsUpdateController = asyncHandler(
   async (req, res) => {
      const functionName = 'postEdgarBulkCompanyFactsUpdateController'
      const log = new LoggerSettings(srcFileName, functionName)

      const { configs } = req.body

      const status = await edgarBulkCompanyFactsUpdate(configs)

      let ownerId = req.user._id

      res.status(201).json({
         status: status,
      })
   },
)

const postUpdateCompaniesMetrics = asyncHandler(async (req, res) => {
   const functionName = 'postUpdateCompaniesMetrics'
   const log = new LoggerSettings(srcFileName, functionName)

   const { inputs } = req.body
   let valueMinerMetricsGenerator = new ValueMinerMetricsGenerator()
   const result = await valueMinerMetricsGenerator.Update10YCashFlowGrowthRate(
      inputs,
   )

   let ownerId = req.user._id

   res.status(201).json({
      status: result ? 'success' : 'failure',
   })
})

// @desc    Creates a new Super Survey configuration
// @route   POST /api/updatealphavantagedailyprices/
// @access  Private/Admin
const postUpdateAlphaVantageDailyPrices = asyncHandler(async (req, res) => {
   const functionName = 'postUpdateAlphaVantageDailyPrices'
   const log = new LoggerSettings(srcFileName, functionName)

   const { inputs } = req.body

   const letBalanceSheets = await updateAlphaVantageDailyPrices(inputs)

   //let ownerId = req.user._id

   res.status(201).json({
      letBalanceSheets: letBalanceSheets ? 'Success' : 'Failed',
   })
})

// @desc    Updates the company metrics for values that have daily frequency.
// @route   POST /api/updatecompanydailymetrics/
// @access  Private/Admin
const postUpdateCompanyDailyMetrics = asyncHandler(async (req, res) => {
   const functionName = 'postUpdateCompanyDailyMetrics'
   const log = new LoggerSettings(srcFileName, functionName)

   const { inputs } = req.body
   let valueMinerMetricsGenerator = new ValueMinerMetricsGenerator()
   const result = await valueMinerMetricsGenerator.updateCompanyDailyMetrics(
      inputs,
   )

   res.status(201).json({
      status: result ? 'success' : 'failure',
   })
})

module.exports = {
   postBalanceSheets,
   postupdateAlphaVantageController,
   postSecEdgarBulkController,
   postSecEdgarBulkUpdateQuarterController,
   postEdgarBulkCompanyFactsUpdateController,
   postUpdateCompaniesMetrics,
   postUpdateAlphaVantageDailyPrices,
   postUpdateCompanyDailyMetrics,
}
