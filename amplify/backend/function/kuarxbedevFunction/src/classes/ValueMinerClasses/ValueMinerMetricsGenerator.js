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
   AlphaVantageHistoricalDailyPrices,
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

   async updateCompanyDailyMetrics(inputs) {
      this.log.setFunctionName('updateCompanyDailyMetrics')
      this.log.LogThis('START')
      try {
         const { configs, symbols } = inputs
         const VaR_1_percent = configs.VaR_1_percent
         const VaR_2_percent = configs.VaR_2_percent
         const VaR_3_percent = configs.VaR_3_percent
         const CVaR_1_percent = configs.CVaR_1_percent
         const CVaR_2_percent = configs.CVaR_2_percent
         const CVaR_3_percent = configs.CVaR_3_percent

         const totalSymbols = symbols?.length ?? 0
         this.log.LogThis(`Total symbols to be updated: ${totalSymbols ?? 0}`)

         let symbolProcessedCount = 0
         for (const symbol of symbols) {
            try {
               symbolProcessedCount++
               this.log.LogThis(
                  `Updating symbol: ${symbol}. Symbols remaining ${
                     totalSymbols - symbolProcessedCount
                  } of ${totalSymbols}`,
               )
               // this.log.LogThis(
               //    `Symbol ${symbol}: finding Daily Prices in database`,
               // )
               const dailyPrices = await AlphaVantageHistoricalDailyPrices.find(
                  { symbol: symbol },
                  'symbol priceDate adjustedClose',
               )
                  .sort({ priceDate: -1 })
                  .lean()

               if (!dailyPrices || dailyPrices?.length === 0) {
                  this.log.updateErrorStatus({
                     symbol: symbol,
                     function: 'updateCompanyDailyMetrics',
                     sourceVendor: 'Alpha Vantage',
                     message:
                        'Alpha Vantage historical daily price not found in table.',
                  })
                  continue
               }

               if (!dailyPrices || dailyPrices?.length === 1) {
                  this.log.updateErrorStatus({
                     symbol: symbol,
                     function: 'updateCompanyDailyMetrics',
                     sourceVendor: 'Alpha Vantage',
                     message:
                        'Alpha Vantage historical daily price only has 1 price and 2 are required to calculate VaR CVaR',
                  })
                  continue
               }

               // this.log.LogThis(
               //    `Symbol ${symbol}: Found ${dailyPrices.length} daily prices, starting VaR and CVaR calculations`,
               // )
               const returnsArray = []
               for (let i = 0; i < dailyPrices.length - 1; i++) {
                  const dailyPrice1 = dailyPrices[i]
                  const dailyPrice2 = dailyPrices[i + 1]
                  const adjustedClose1 = dailyPrice1.adjustedClose
                  const adjustedClose2 = dailyPrice2.adjustedClose
                  let returnRate = null
                  if (adjustedClose2 == 0) {
                     returnRate = 0
                  } else {
                     returnRate =
                        (adjustedClose1 - adjustedClose2) / adjustedClose2
                  }
                  returnsArray.push(returnRate)
               }

               const returnsArraySorted = returnsArray.sort((a, b) => a - b)

               //returnsArraySorted.forEach((x, i) => (x.sequence = i + 1))
               const returnRatesCount = returnsArraySorted.length
               let VaR_1_index = Math.round(
                  returnRatesCount * (1 - VaR_1_percent),
               )
               let VaR_2_index = Math.round(
                  returnRatesCount * (1 - VaR_2_percent),
               )
               let VaR_3_index = Math.round(
                  returnRatesCount * (1 - VaR_3_percent),
               )

               VaR_1_index = VaR_1_index == 0 ? 0 : VaR_1_index - 1
               VaR_2_index = VaR_2_index == 0 ? 0 : VaR_2_index - 1
               VaR_3_index = VaR_3_index == 0 ? 0 : VaR_3_index - 1

               const VaR_1_value = returnsArraySorted[VaR_1_index]
               const VaR_2_value = returnsArraySorted[VaR_2_index]
               const VaR_3_value = returnsArraySorted[VaR_3_index]

               // this.log.LogThis(
               //    `Symbol ${symbol}: VaR and CVaR calculation completed. Finding Company metrics in Database`,
               // )
               let companyMetric = await CompanyAnnualMetrics.findOne({
                  symbol: symbol,
               })
               if (!companyMetric) {
                  // this.log.LogThis(
                  //    `Symbol: ${symbol} not found in CompanyMetrics, creating a new entry for it`,
                  // )
                  this.log.updateErrorStatus({
                     symbol: symbol,
                     function: 'updateCompanyDailyMetrics',
                     sourceVendor: 'Alpha Vantage',
                     message:
                        'Symbol not found in company metrics, creating a new entry for it',
                  })
                  companyMetric = new CompanyAnnualMetrics()
                  companyMetric.symbol = symbol
                  companyMetric.yearStart =
                     dailyPrices[returnRatesCount - 1].priceDate.getFullYear()
                  companyMetric.yearEnd = dailyPrices[0].priceDate.getFullYear()
               }
               // else {
               //    this.log.LogThis(
               //       `Symbol ${symbol}: found a record in Company Metrics database`,
               //    )
               // }

               companyMetric.VaR_1_percent = VaR_1_percent
               companyMetric.VaR_1_value = VaR_1_value
               companyMetric.VaR_2_percent = VaR_2_percent
               companyMetric.VaR_2_value = VaR_2_value
               companyMetric.VaR_3_percent = VaR_3_percent
               companyMetric.VaR_3_value = VaR_3_value

               let CVaR_1_value = 0
               let CVaR_2_value = 0
               let CVaR_3_value = 0

               for (let i = 0; i <= VaR_1_index; i++) {
                  if (i <= VaR_1_index) {
                     CVaR_1_value = CVaR_1_value + returnsArraySorted[i]
                  }

                  if (i <= VaR_2_index) {
                     CVaR_2_value = CVaR_2_value + returnsArraySorted[i]
                  }

                  if (i <= VaR_3_index) {
                     CVaR_3_value = CVaR_3_value + returnsArraySorted[i]
                  }
               }

               companyMetric.CVaR_1_percent = CVaR_1_percent
               companyMetric.CVaR_1_value =
                  (1 / (VaR_1_index + 1)) * CVaR_1_value
               companyMetric.CVaR_2_percent = CVaR_2_percent
               companyMetric.CVaR_2_value =
                  (1 / (VaR_2_index + 1)) * CVaR_2_value
               companyMetric.CVaR_3_percent = CVaR_3_percent
               companyMetric.CVaR_3_value =
                  (1 / (VaR_3_index + 1)) * CVaR_3_value

               companyMetric.VaR_CVaR_dataPointsFound = returnRatesCount
               // this.log.LogThis(
               //    `Symbol ${symbol}: Saving VaR and CVaR in Company Metrics database.`,
               // )
               await companyMetric.save()
               // this.log.LogThis(
               //    `Symbol ${symbol}: Saved VaR and CVaR in Company Metrics database.`,
               // )
            } catch (ex) {
               this.log.updateErrorStatus({
                  symbol: symbol,
                  function: 'updateCompanyDailyMetrics',
                  sourceVendor: 'Alpha Vantage',
                  message: `Error found during processing: ${ex.message}`,
               })
            }
         }
         return true
      } catch (ex) {
         this.log.LogThis(`Exception message: ${ex.message}`)
      }
   }
}
module.exports = ValueMinerMetricsGenerator
