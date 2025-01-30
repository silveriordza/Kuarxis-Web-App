/**
 * @prettier
 */

const { LogManager } = require(`../LogManager`)
const mongoose = require('mongoose')
const { sortListObjects, medianFromArray } = require('../../utils/Functions')
const _ = require('lodash')

const {
   AlphaVantageCashFlowAnnual,
   CompanyAnnualMetrics,
   AlphaVantageCache,
   AlphaVantageIncomeStatementAnnual,
   AlphaVantageBalanceSheetAnnual,
} = require('../../models/valueMinerModel')

const collectionEntity = 'CompanyAnnualMetrics'

class ValueMinerMetricsGenerator {
   constructor() {
      this.log = new LogManager('ValueMinerMetricsGenerator.js', 'START')
   }
   async Update10YCashFlowGrowthRate(inputs) {
      this.log.setFunctionName('Update10YCashFlowGrowthRate')
      this.log.LogThis('START')
      try {
         for (const symbol of inputs.symbols) {
            this.log.LogThis(`Started processing symbol: ${symbol}`)
            const cashFlows = await AlphaVantageCashFlowAnnual.find({
               symbol: symbol,
            })
               .sort({ year: -1 })
               .select('year sequence operatingCashflow capitalExpenditures')
               .limit(inputs.configs.yearsBack)
               .lean()

            if (cashFlows && cashFlows.length >= 2) {
               let cashFlowsOk = true
               for (const cashFlow of cashFlows) {
                  if (
                     typeof cashFlow.operatingCashflow === 'number' &&
                     typeof cashFlow.capitalExpenditures === 'number'
                  ) {
                     cashFlow.FreeCashFlow =
                        cashFlow.operatingCashflow -
                        cashFlow.capitalExpenditures
                  } else {
                     this.log.updateErrorStatus({
                        symbol: symbol,
                        function: 'CalculatingFreeCashFlows',
                        sourceVendor: 'Alpha Vantage',
                        message:
                           'Missing operatingCashFlow or capitalExpenditures in AlphaVantageCashFlowAnnual',
                     })
                     cashFlowsOk = false
                     break
                  }
               }
               if (!cashFlowsOk) {
                  continue
               }
            } else {
               const message = !cashFlows
                  ? 'AlphaVantageCashFlow not found'
                  : cashFlows.length < 2
                  ? `AlphaVantageCashFlow only found ${cashFlows.length} cashFlow, need at least 2 to calculate growth rate.`
                  : 'unexpected error'

               this.log.updateErrorStatus({
                  symbol: symbol,
                  function: 'CalculatingFreeCashFlows',
                  sourceVendor: 'Alpha Vantage',
                  message: message,
               })
               //this.log.LogThis(`${symbol} ${message} `)
               continue
            }

            sortListObjects(cashFlows, 'year')

            //this.log.LogThis(this.log.j(cashFlows))
            const years = cashFlows.length
            const yearStart = cashFlows[0].year
            const yearEnd = cashFlows[years - 1].year
            const latestCashFlowReported = cashFlows[years - 1].FreeCashFlow

            const cagrPerPeriod = []
            let cagrValuesAttempts = 0
            let cagrValuesSkipped = 0
            for (let cagrPeriod = 1; cagrPeriod < years; cagrPeriod++) {
               const cagrPerYear = []
               for (let year = cagrPeriod; year < years; year++) {
                  this.log.LogThis(
                     `Symbol: ${symbol}; CAGR Period: ${1}; year:${year}`,
                  )
                  const cashFlow0 = cashFlows[year - cagrPeriod].FreeCashFlow
                  const cashFlow1 = cashFlows[year].FreeCashFlow
                  cagrValuesAttempts++
                  if (cashFlow0 == 0) {
                     cagrValuesSkipped++
                     continue
                  }

                  let cashFlowGrowthRate = 0
                  cashFlowGrowthRate = cashFlow1 / cashFlow0
                  let cagr = null
                  if (cashFlowGrowthRate < 0) {
                     /**
                      * CAGR does not work well when the cashFlowGrowthRate is negative is better to use the GrowthRate = (EndValue - BeginValue)/ABS(BeginValue) then apply the Annualized Growth Rate = (1 + GrowthRate)^(1/n) - 1;  where n is the numbrer of periods to annualize or periodize.
                      */
                     cagrValuesSkipped++

                     let growthRate =
                        (cashFlow1 - cashFlow0) / Math.abs(cashFlow0)
                     let annualizedGrowthBase = 1 + growthRate
                     if (annualizedGrowthBase < 0) {
                        //The annualized grwoth formula doe not work well if the annualizedGrowthBase is negative, in that case we will use the growthRate as cagr.
                        cagr = growthRate / cagrPeriod
                     } else {
                        //This is the annualized rate formula, no issues with negatives in this case.
                        cagr =
                           Math.pow(annualizedGrowthBase, 1 / cagrPeriod) - 1
                     }
                  } else {
                     //This is just the cagr formula, no issues with negatives in this case.
                     cagr = Math.pow(cashFlowGrowthRate, 1 / cagrPeriod) - 1
                  }

                  /**
                   * In case the cashFlowGrowthRate is negative and the power is an odd root, mathematics allow negative base for odd roots, however Javascript cannot calculate the odd root of a negative root base, in order to achieve that, get the absolute value of the base, calculate the odd root, then multiply the result by negative 1, we use the Math.sing to get the sign of the base, and Math.abs to get the absolute value of the base.
                   */

                  cagrPerYear.push(cagr)
               }
               if (cagrPerYear.length > 0) {
                  const cagrMedianPerPeriod = medianFromArray(cagrPerYear)
                  cagrPerPeriod.push(cagrMedianPerPeriod)
               }
            }

            let metricsEntity = await CompanyAnnualMetrics.findOne({
               symbol: symbol,
            })

            if (!metricsEntity) {
               metricsEntity = new CompanyAnnualMetrics()
               metricsEntity.symbol = symbol
            }

            if (cagrPerPeriod.length > 0) {
               metricsEntity.year10_growthRate = medianFromArray(cagrPerPeriod)
               metricsEntity.year10_growthRateConfidence =
                  1 - cagrValuesSkipped / cagrValuesAttempts
            } else {
               metricsEntity.year10_growthRate = null
               metricsEntity.year10_growthRateConfidence = null
            }
            metricsEntity.latestCashFlowReported = latestCashFlowReported

            metricsEntity.yearStart = yearStart
            metricsEntity.yearEnd = yearEnd
            metricsEntity.year10_NumberOfYearsAvailable = years

            //START Get Company Overview Metrics
            const companyOverview = await AlphaVantageCache.findOne({
               symbol: symbol,
               functionName: 'OVERVIEW',
            }).lean()
            if (companyOverview && companyOverview?.data) {
               metricsEntity.CIK = companyOverview.data.CIK
               metricsEntity.AssetType = companyOverview.data.AssetType
               metricsEntity.Description = companyOverview.data.Description
               metricsEntity.Exchange = companyOverview.data.Exchange
               metricsEntity.OfficialSite = companyOverview.data.OfficialSite
               metricsEntity.DilutedEPSTTM = companyOverview.data.DilutedEPSTTM
               metricsEntity.QuarterlyEarningsGrowthYOY =
                  companyOverview.data.QuarterlyEarningsGrowthYOY
               metricsEntity.QuarterlyRevenueGrowthYOY =
                  companyOverview.data.QuarterlyRevenueGrowthYOY
               metricsEntity.AnalystTargetPrice =
                  companyOverview.data.AnalystTargetPrice
               metricsEntity.AnalystRatingStrongBuy =
                  companyOverview.data.AnalystRatingStrongBuy
               metricsEntity.AnalystRatingBuy =
                  companyOverview.data.AnalystRatingBuy
               metricsEntity.AnalystRatingHold =
                  companyOverview.data.AnalystRatingHold
               metricsEntity.AnalystRatingSell =
                  companyOverview.data.AnalystRatingSell
               metricsEntity.AnalystRatingStrongSell =
                  companyOverview.data.AnalystRatingStrongSell
               metricsEntity.TrailingPE = companyOverview.data.TrailingPE
               metricsEntity.ForwardPE = companyOverview.data.ForwardPE
               metricsEntity.Beta = companyOverview.data.Beta
               metricsEntity.SharesOutstanding =
                  companyOverview.data.SharesOutstanding
            }

            const alphaVantageIncomeAnnual =
               await AlphaVantageIncomeStatementAnnual.find({ symbol: symbol })
                  .sort({ year: -1 })
                  .limit(1)
                  .lean()

            if (
               alphaVantageIncomeAnnual &&
               alphaVantageIncomeAnnual.length > 0
            ) {
               metricsEntity.interestExpense =
                  alphaVantageIncomeAnnual[0]?.interestExpense
               metricsEntity.interestAndDebtExpense =
                  alphaVantageIncomeAnnual[0]?.interestAndDebtExpense
            }

            const alphaVantageBalanceSheetAnnual =
               await AlphaVantageBalanceSheetAnnual.find({ symbol: symbol })
                  .sort({ year: -1 })
                  .limit(1)
                  .lean()

            if (
               alphaVantageBalanceSheetAnnual &&
               alphaVantageBalanceSheetAnnual.length > 0
            ) {
               metricsEntity.latestTotalAssets =
                  alphaVantageBalanceSheetAnnual[0]?.totalAssets
               metricsEntity.latestTotalLiabilities =
                  alphaVantageBalanceSheetAnnual[0]?.totalLiabilities
               metricsEntity.latestGoodwill =
                  alphaVantageBalanceSheetAnnual[0]?.goodwill
               metricsEntity.latestCashAndCashEquivalents =
                  alphaVantageBalanceSheetAnnual[0]?.cashAndCashEquivalentsAtCarryingValue
            }

            //END Get Company Overview Metrics

            await metricsEntity.save()
            this.log.LogThis(`Finished processing symbol: ${symbol}`)
         }

         this.log.LogThis('END')
         return true
      } catch (ex) {
         this.log.LogThis(`Unexpected Exception: ${ex.message}`)
         this.log.LogThis('END')
         return false
      }
   }
}
module.exports = ValueMinerMetricsGenerator
