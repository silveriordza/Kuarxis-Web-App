/**
 * @format
 * @prittier
 * */

const axios = require('axios')
let {
   LogThis,
   HasDataException,
   LoggerSettings,
   L0,
   L1,
   L2,
   L3,
   LogVars,
   LogThisFilter,
   LogVarsFilter,
   HasData,
   j,
   updateErrorStatus,
} = require('../utils/Logger.js')

const { sleep } = require('../utils/Functions.js')

const {
   AlphaVantageBalanceSheetAnnual,
   AlphaVantageBalanceSheetQuarterly,
   AlphaVantageCashFlowAnnual,
   AlphaVantageCashFlowQuarterly,
   AlphaVantageIncomeStatementAnnual,
   AlphaVantageIncomeStatementQuarterly,
   ValueMinerDataSourceStatus,
   AlphaVantageCache,
   AlphaVantageHistoricalDailyPrices,
} = require('../models/valueMinerModel.js')

const srcFileName = 'alphaVantageAPI.js'

const getBalanceSheets = async symbols => {
   const log = new LoggerSettings(srcFileName, 'getBalanceSheets')
   const apiKey = process.env.KUARSIS_VALUEMINER_ALPHAVANTAGE_APIKEY

   if (!apiKey || apiKey == '') {
      throw new Error(`Alpha Vantage apikey is empty.`)
   }

   const params = {
      function: 'BALANCE_SHEET',
      symbol: null,
      apikey: 'UC397SSPO5KK4FT3',
   }
   let apiResponses = null

   await BalanceSheetAnnual.deleteMany({ symbol: { $in: symbols } })
   await BalanceSheetQuarterly.deleteMany({ symbol: { $in: symbols } })
   let annualReports = null
   let quarterlyReports = null
   for (const symbol of symbols) {
      params.symbol = symbol
      try {
         apiResponses = await axios.get(`https://www.alphavantage.co/query`, {
            params,
         })
      } catch (ex) {
         LogThis(log, `ticker: ${symbol} not found.  Exception: ${ex.message}`)
         continue
      }

      annualReports = apiResponses?.data?.annualReports
      quarterlyReports = apiResponses?.data?.quarterlyReports
      // for (const annualReport in annualReports) {
      //    annualReport.symbol = params.symbol
      // }
      if (annualReports) {
         annualReports.forEach(x => {
            x.symbol = params.symbol
         })
         await BalanceSheetAnnual.insertMany(annualReports)
      }

      if (quarterlyReports) {
         quarterlyReports.forEach(x => {
            x.symbol = params.symbol
         })
         await BalanceSheetQuarterly.insertMany(quarterlyReports)
      }
   }

   return { annualReports: annualReports, quarterlyReports: quarterlyReports }
}

const updateAlphaVantage = async inputs => {
   const log = new LoggerSettings(srcFileName, 'updateAlphaVantage')
   const apiKey = process.env.KUARSIS_VALUEMINER_ALPHAVANTAGE_APIKEY
   const symbols = inputs.symbols
   const configs = inputs.configs
   const { refreshcache } = configs
   const ALPHAVANTAGE_CALLWAIT = parseInt(
      process.env.KUARSIS_VALUEMINER_ALPHAVANTAGE_CALLWAIT,
   )

   if (!apiKey || apiKey == '') {
      throw new Error(`Alpha Vantage apikey is empty.`)
   }

   const dateToQuartersMap = new Map()
   dateToQuartersMap.set('03-31', 1)
   dateToQuartersMap.set('06-30', 2)
   dateToQuartersMap.set('09-30', 3)
   dateToQuartersMap.set('12-31', 4)

   const params = {
      function: null,
      symbol: null,
      apikey: apiKey,
   }

   const paramsEarningsReported = {
      function: 'EARNINGS',
      symbol: null,
      apikey: apiKey,
   }

   const functionToCollectionsMap = new Map()
   functionToCollectionsMap.set('BALANCE_SHEET', {
      annual: AlphaVantageBalanceSheetAnnual,
      quarterly: AlphaVantageBalanceSheetQuarterly,
   })
   functionToCollectionsMap.set('INCOME_STATEMENT', {
      annual: AlphaVantageIncomeStatementAnnual,
      quarterly: AlphaVantageIncomeStatementQuarterly,
   })
   functionToCollectionsMap.set('CASH_FLOW', {
      annual: AlphaVantageCashFlowAnnual,
      quarterly: AlphaVantageCashFlowQuarterly,
   })

   let annualReports = null
   let quarterlyReports = null
   let apiResponses = null
   let foundInApi = null
   let firstTimeApiCall = true
   // let millisecondsStart = 0
   // let millisecondsEnd = 0
   const symbolsTotalCount = symbols?.length
   let symbolsProcessed = 0
   LogThis(log, `Started processing ${symbolsTotalCount} symbols`)
   for (const symbol of symbols) {
      params.symbol = symbol
      // params.function = 'EARNINGS'
      // //paramsEarningsReported.symbol = symbol
      // LogThis(log, `${symbol} Started updating function: ${params.function}`)
      // let responseEarningsReported = await axios.get(
      //    `https://www.alphavantage.co/query`,
      //    {
      //       params,
      //    },
      // )

      // if (
      //    responseEarningsReported &&
      //    responseEarningsReported?.data &&
      //    responseEarningsReported.data?.annualEarnings &&
      //    responseEarningsReported.data?.quarterlyEarnings
      // ) {
      // } else {
      //    LogThis(
      //       log,
      //       `${symbol} function ${responseEarningsReported.function} data not found in API`,
      //    )
      //    // continue
      // }

      for (const [avFunction, collections] of functionToCollectionsMap) {
         params.function = avFunction
         annualReports = null
         quarterlyReports = null
         LogThis(
            log,
            `${symbol} Started updating function: ${params.function}`,
            L1,
         )
         try {
            // if (refreshcache) {
            //    await AlphaVantageCache.deleteMany({
            //       symbol: symbol,
            //       functionName: avFunction,
            //    })
            //    apiResponses = null
            // } else {
            //    apiResponses = await AlphaVantageCache.findOne({
            //       symbol: symbol,
            //       functionName: avFunction,
            //    }).lean()
            // }

            // //if (!apiResponses) {
            // if (firstTimeApiCall) {
            //    firstTimeApiCall = false
            //    //millisecondsStart = Date.now()
            // } else {
            //    await sleep(process.env.KUARSIS_VALUEMINER_ALPHAVANTAGE_CALLWAIT)
            // }

            if (firstTimeApiCall) {
               firstTimeApiCall = false
               millisecondsStart = Date.now()
            } else {
               const millisecondsNow = Date.now()
               const millisencondsElapsed = millisecondsNow - millisecondsStart
               // LogThis(
               //    log,
               //    `${symbol} function ${params.function}, millisecondsNow=${millisecondsNow}, millisecondsStart=${millisecondsStart}, millisencondsElapsed=${millisencondsElapsed}, ALPHAVANTAGE_CALLWAIT=${ALPHAVANTAGE_CALLWAIT}`,
               // )
               if (millisencondsElapsed < ALPHAVANTAGE_CALLWAIT) {
                  const waitMilliseconds =
                     ALPHAVANTAGE_CALLWAIT - millisencondsElapsed
                  // LogThis(
                  //    log,
                  //    `${symbol} function ${params.function}, waitMilliseconds=${waitMilliseconds}`,
                  // )
                  await sleep(waitMilliseconds)
               }
               millisecondsStart = Date.now()
            }

            // millisecondsEnd = Date.now()
            // let millisecondsElapsed = millisecondsEnd - millisecondsStart
            // LogThis(log, `millisecondsElapsed: ${millisecondsElapsed}`)
            // millisecondsStart = Date.now()

            apiResponses = await axios.get(
               `https://www.alphavantage.co/query`,
               {
                  params,
               },
            )

            if (
               apiResponses &&
               apiResponses?.data &&
               apiResponses.data?.annualReports &&
               apiResponses.data?.quarterlyReports
            ) {
               foundInApi = true
               LogThis(
                  log,
                  `${symbol} function ${params.function} data found by API`,
               )
            } else {
               const messageFromAPI = apiResponses?.data?.Information
                  ? `with message ${apiResponses?.data?.Information}`
                  : ''

               await updateErrorStatus({
                  symbol: symbol,
                  sourceVendor: 'AlphaVantage',
                  function: params.function,
                  message: `symbol not found or error from API ${messageFromAPI}`,
               })
               continue
            }
            // } else {
            //    foundInApi = false
            //    LogThis(
            //       log,
            //       `${symbol} function ${params.function} data found in cache`,
            //    )
            // }
         } catch (ex) {
            LogThis(
               log,
               `${symbol} not found in API.  Exception: ${ex.message}`,
               L0,
            )
            const status = new ValueMinerDataSourceStatus()
            status.ticker = symbol
            status.sourceVendor = 'AlphaVantage'
            status.status = false
            status.functionName = params.function
            status.message = `Exception thrown by API for ticker not found in function ${params.function}`
            await status.save()
            continue
         }

         if (!apiResponses?.data) {
            LogThis(
               log,
               `${symbol} data returned by API function ${params.function} is empty.`,
               L0,
            )
            const status = new ValueMinerDataSourceStatus()
            status.ticker = symbol
            status.sourceVendor = 'AlphaVantage'
            status.status = false
            status.functionName = params.function
            status.message = `ticker: ${symbol} data returned by API function ${params.function} is empty.`
            await status.save()
            continue
         }

         // if (foundInApi) {
         //    const alphaVantageCache = new AlphaVantageCache()
         //    alphaVantageCache.functionName = params.function
         //    alphaVantageCache.symbol = symbol
         //    alphaVantageCache.data = apiResponses.data
         //    await alphaVantageCache.save()
         // }

         annualReports = apiResponses?.data?.annualReports
         quarterlyReports = apiResponses?.data?.quarterlyReports

         // await collections.annual.deleteMany({ symbol: symbol })
         // await collections.quarterly.deleteMany({ symbol: symbol })

         if (annualReports) {
            const maxAnnualDateAlreadyProcessed =
               await collections.annual.aggregate([
                  {
                     $match: { symbol: symbol },
                  },
                  {
                     $group: {
                        _id: null,
                        maxDate: { $max: '$fiscalDateEnding' },
                     },
                  },
               ])
            let sequence = null
            let keyTemp = null
            let keyFinal = null
            const keysStoredMap = new Map()
            const annualReportsToInsert = []
            for (const x of annualReports) {
               x.symbol = params.symbol
               let fiscalDateEndingDate = new Date(x.fiscalDateEnding)
               if (
                  fiscalDateEndingDate.toISOString() ==
                  maxAnnualDateAlreadyProcessed[0].maxDate.toISOString()
               ) {
                  break
               }

               let year = fiscalDateEndingDate.getFullYear()
               let month = fiscalDateEndingDate.getMonth() + 1
               if (month >= 1 && month <= 3) {
                  year--
               }

               //x.year = parseInt(x.fiscalDateEnding.substring(0, 4), 10)
               x.year = year
               keyTemp = `${x.symbol}-${x.year}`
               sequence = keysStoredMap.get(keyTemp)
               if (sequence ?? false) {
                  sequence++
               } else {
                  sequence = 1
               }

               keyFinal = `${x.symbol}-${x.year}-${sequence}`
               keysStoredMap.set(keyTemp, sequence)
               x.sequence = sequence
               x.key = keyFinal
               annualReportsToInsert.push(x)
            }
            if (annualReportsToInsert.length > 0) {
               await collections.annual.insertMany(annualReportsToInsert)
               LogThis(
                  log,
                  `Symbol: ${symbol} function: ${params.function} inserted ${annualReportsToInsert.length} new annual records.`,
               )
            } else {
               LogThis(
                  log,
                  `Symbol: ${symbol} function: ${params.function} is up to date and no annual new records have been inserted.`,
               )
               break
            }
         }
         const quarterlyReportsToInsert = []
         if (quarterlyReports) {
            let sequence = null
            let keyTemp = null
            let keyFinal = null
            const keysStoredMap = new Map()

            const maxQuarterlyDateAlreadyProcessed =
               await collections.quarterly.aggregate([
                  {
                     $match: { symbol: symbol },
                  },
                  {
                     $group: {
                        _id: null,
                        maxDate: { $max: '$fiscalDateEnding' },
                     },
                  },
               ])

            for (const x of quarterlyReports) {
               let fiscalDateEndingDate = new Date(x.fiscalDateEnding)
               if (
                  fiscalDateEndingDate.toISOString() ===
                  maxQuarterlyDateAlreadyProcessed[0].maxDate.toISOString()
               ) {
                  break
               }

               x.symbol = params.symbol
               x.year = parseInt(x.fiscalDateEnding.substring(0, 4), 10)
               x.quarter =
                  dateToQuartersMap.get(x.fiscalDateEnding.substring(5, 10)) ??
                  0
               if (x.quarter === 0) {
                  // await updateErrorStatus({
                  //    symbol: symbol,
                  //    sourceVendor: 'AlphaVantage',
                  //    function: params.function,
                  //    message: `fiscalDateEnding ${x.fiscalDateEnding} does not match a quarter end date. Calculating approximate quarter.`,
                  // })

                  const monthQ = parseInt(
                     x.fiscalDateEnding.substring(5, 7),
                     10,
                  )

                  if (monthQ >= 3 && monthQ <= 5) {
                     x.quarter = 1
                  } else if (monthQ >= 6 && monthQ <= 8) {
                     x.quarter = 2
                  } else if (monthQ >= 9 && monthQ <= 11) {
                     x.quarter = 3
                  } else if (monthQ === 12 || monthQ <= 2) {
                     x.quarter = 4
                  }
                  // else {
                  //    await updateErrorStatus({
                  //       symbol: symbol,
                  //       sourceVendor: 'AlphaVantage',
                  //       function: params.function,
                  //       message: `Couldn't determine an approximate quarter for fiscalDateEnding ${x.fiscalDateEnding} setting quarter to zero 0`,
                  //    })
                  //    x.quarter = 0
                  // }
               }

               keyTemp = `${x.symbol}-${x.year}-${x.quarter}`
               sequence = keysStoredMap.get(keyTemp)
               if (sequence ?? false) {
                  sequence++
               } else {
                  sequence = 1
               }

               keyFinal = `${x.symbol}-${x.year}-${x.quarter}-${sequence}`
               keysStoredMap.set(keyTemp, sequence)
               x.sequence = sequence
               x.key = keyFinal
               quarterlyReportsToInsert.push(x)
            }

            if (quarterlyReportsToInsert.length > 0) {
               await collections.quarterly.insertMany(quarterlyReportsToInsert)
               LogThis(
                  log,
                  `Symbol: ${symbol} function: ${params.function} inserted ${quarterlyReportsToInsert.length} new quarterly records.`,
               )
            } else {
               LogThis(
                  log,
                  `Symbol: ${symbol} function: ${params.function} is up to date and no quarterly new records have been inserted.`,
               )
            }
         }
         LogThis(
            log,
            `${symbol} Completed updating function: ${params.function}`,
            L0,
         )
      }
      // try {
      //    params.function = 'OVERVIEW'
      //    LogThis(log, `${symbol} Started Updating Company Overview`)
      //    // if (refreshcache) {
      //    //    await AlphaVantageCache.deleteMany({
      //    //       symbol: symbol,
      //    //       functionName: params.function,
      //    //    })
      //    //    apiResponses = null
      //    // } else {
      //    //    apiResponses = await AlphaVantageCache.findOne({
      //    //       symbol: symbol,
      //    //       functionName: params.function,
      //    //    }).lean()
      //    // }

      //    //if (!apiResponses) {
      //       if (firstTimeApiCall) {
      //          firstTimeApiCall = false
      //          //millisecondsStart = Date.now()
      //       } else {
      //          await sleep(process.env.KUARSIS_VALUEMINER_ALPHAVANTAGE_CALLWAIT)
      //       }

      //       // millisecondsEnd = Date.now()
      //       // let millisecondsElapsed = millisecondsEnd - millisecondsStart
      //       // LogThis(log, `millisecondsElapsed: ${millisecondsElapsed}`)
      //       // millisecondsStart = Date.now()

      //       apiResponses = await axios.get(
      //          `https://www.alphavantage.co/query`,
      //          {
      //             params,
      //          },
      //       )
      //       if (
      //          apiResponses &&
      //          apiResponses?.data &&
      //          Object.keys(apiResponses.data).length > 0
      //       ) {
      //          foundInApi = true
      //          LogThis(
      //             log,
      //             `${symbol} function ${params.function} data found by API`,
      //          )
      //       } else {
      //          const messageFromAPI = apiResponses?.data?.Information
      //             ? `with message ${apiResponses?.data?.Information}`
      //             : ''

      //          await updateErrorStatus({
      //             symbol: symbol,
      //             sourceVendor: 'AlphaVantage',
      //             function: params.function,
      //             message: `symbol not found or error from API ${messageFromAPI}`,
      //          })
      //          continue
      //       }
      //    // } else {
      //    //    foundInApi = false
      //    //    LogThis(
      //    //       log,
      //    //       `${symbol} function ${params.function} data found in cache`,
      //    //    )
      //    // }
      // } catch (ex) {
      //    LogThis(
      //       log,
      //       `${symbol} Company Overview not found in cache nor in API.  Exception: ${ex.message}`,
      //       L0,
      //    )
      //    const status = new ValueMinerDataSourceStatus()
      //    status.ticker = symbol
      //    status.sourceVendor = 'AlphaVantage'
      //    status.status = false
      //    status.functionName = params.function
      //    status.message = `Exception thrown by API for ticker not found in function ${params.function}`
      //    await status.save()
      //    continue
      // }

      // if (!apiResponses?.data) {
      //    LogThis(
      //       log,
      //       `${symbol} data returned by API function ${params.function} is empty.`,
      //       L0,
      //    )
      //    const status = new ValueMinerDataSourceStatus()
      //    status.ticker = symbol
      //    status.sourceVendor = 'AlphaVantage'
      //    status.status = false
      //    status.functionName = params.function
      //    status.message = `ticker: ${symbol} data returned by API function ${params.function} is empty.`
      //    await status.save()
      //    continue
      // }

      // if (foundInApi) {
      //    const alphaVantageCache = new AlphaVantageCache()
      //    alphaVantageCache.functionName = params.function
      //    alphaVantageCache.symbol = symbol
      //    alphaVantageCache.data = apiResponses.data
      //    await alphaVantageCache.save()
      // }
      // LogThis(log, `${symbol} Completed Updating Company Overview`)
      symbolsProcessed++
      LogThis(
         log,
         `Completed ${symbolsProcessed} symbols out off ${symbolsTotalCount} remaining ${
            symbolsTotalCount - symbolsProcessed
         }`,
      )
   }
   LogThis(
      log,
      `Update Completed ${symbolsProcessed} out off ${symbolsTotalCount} remaining ${
         symbolsTotalCount - symbolsProcessed
      }`,
   )
   return true
}

const updateAlphaVantageDailyPrices = async inputs => {
   const log = new LoggerSettings(srcFileName, 'updateAlphaVantageDailyPrices')
   const apiKey = process.env.KUARSIS_VALUEMINER_ALPHAVANTAGE_APIKEY
   const ALPHAVANTAGE_CALLWAIT = parseInt(
      process.env.KUARSIS_VALUEMINER_ALPHAVANTAGE_CALLWAIT,
   )
   const symbols = inputs.symbols
   const configs = inputs.configs
   const { refreshcache, refreshType, alphaVantageOutputSize } = configs

   if (!apiKey || apiKey == '') {
      throw new Error(`Alpha Vantage apikey is empty.`)
   }

   const params = {
      function: 'TIME_SERIES_DAILY_ADJUSTED',
      symbol: null,
      outputsize: alphaVantageOutputSize, //full or compact
      apikey: apiKey,
   }

   const symbolsTotalCount = symbols?.length
   let symbolsProcessed = 0
   let firstTimeApiCall = true
   LogThis(log, `Started processing ${symbolsTotalCount} symbols`)

   for (const symbol of symbols) {
      params.symbol = symbol
      LogThis(log, `Updating symbol ${symbol}. Function ${params.function}`)
      symbolsProcessed++
      let listOfDates = null
      try {
         if (firstTimeApiCall) {
            firstTimeApiCall = false
            millisecondsStart = Date.now()
         } else {
            const millisecondsNow = Date.now()
            const millisencondsElapsed = millisecondsNow - millisecondsStart
            // LogThis(
            //    log,
            //    `${symbol} function ${params.function}, millisecondsNow=${millisecondsNow}, millisecondsStart=${millisecondsStart}, millisencondsElapsed=${millisencondsElapsed}, ALPHAVANTAGE_CALLWAIT=${ALPHAVANTAGE_CALLWAIT}`,
            // )
            if (millisencondsElapsed < ALPHAVANTAGE_CALLWAIT) {
               const waitMilliseconds =
                  ALPHAVANTAGE_CALLWAIT - millisencondsElapsed
               // LogThis(
               //    log,
               //    `${symbol} function ${params.function}, waitMilliseconds=${waitMilliseconds}`,
               // )
               await sleep(waitMilliseconds)
               // LogThis(
               //    log,
               //    `${symbol} function ${params.function} waited waitMilliseconds=${waitMilliseconds}, new millisecondsStart=${millisecondsStart}`,
               // )
            }
            millisecondsStart = Date.now()
            // LogThis(
            //    log,
            //    `${symbol} function ${params.function} waited waitMilliseconds=${waitMilliseconds}, new millisecondsStart=${millisecondsStart}`,
            // )
         }

         apiResponses = await axios.get(`https://www.alphavantage.co/query`, {
            params,
         })

         if (
            apiResponses &&
            apiResponses?.data &&
            apiResponses.data['Time Series (Daily)'] &&
            Object.keys(apiResponses.data['Time Series (Daily)'])?.length > 0
         ) {
            LogThis(
               log,
               `${symbol} function ${params.function} data found by API`,
            )
         } else {
            const messageFromAPI = apiResponses?.data?.Information
               ? `with message ${apiResponses?.data?.Information}`
               : ''

            await updateErrorStatus({
               symbol: symbol,
               sourceVendor: 'AlphaVantage',
               function: params.function,
               message: `symbol not found or error from API ${messageFromAPI}`,
            })
            continue
         }
      } catch (ex) {
         LogThis(
            log,
            `${symbol} not found in cache nor in API.  Exception: ${ex.message}`,
            L0,
         )
         const status = new ValueMinerDataSourceStatus()
         status.ticker = symbol
         status.sourceVendor = 'AlphaVantage'
         status.status = false
         status.functionName = params.function
         status.message = `Exception thrown by API for ticker not found in function ${params.function}`
         await status.save()
         continue
      }

      try {
         let alphaVantageData = apiResponses.data['Time Series (Daily)']
         listOfDates = Object.keys(alphaVantageData)

         //await AlphaVantageHistoricalDailyPrices.deleteMany({ symbol: symbol })
         const historicalPricesDocsArray = []
         LogThis(log, `${symbol} started reading daily prices results`)
         let timerStart = Date.now()
         let latestDateIndex = 0
         switch (refreshType) {
            case 'latestDates': {
               let latestDailyDate =
                  await AlphaVantageHistoricalDailyPrices.aggregate([
                     {
                        $match: { symbol: symbol },
                     },
                     {
                        $group: {
                           _id: null,
                           maxDate: { $max: '$priceDate' },
                        },
                     },
                  ])
               let latestDate = null
               if (latestDailyDate && latestDailyDate?.length > 0) {
                  latestDate = latestDailyDate[0].maxDate
               }

               if (latestDate) {
                  latestDateIndex = listOfDates.indexOf(
                     latestDate.toISOString().slice(0, 10),
                  )
                  if (latestDateIndex > 0) {
                     latestDateIndex--
                  } else {
                     continue
                  }
               } else {
                  latestDateIndex = listOfDates.length - 1
               }
               break
            }
            case 'allDates': {
               latestDateIndex = listOfDates.length - 1
               await AlphaVantageHistoricalDailyPrices.deleteMany({
                  symbol: symbol,
               })
               break
            }
            default: {
               throw Error(
                  'invalid refreshType selected, only allDates or latestDates allowed',
               )
            }
         }

         //for (const priceDateKey of Object.keys(alphaVantageData)) {
         for (let i = latestDateIndex; i >= 0; i--) {
            let priceDateKey = listOfDates[i]
            //const dailyPriceKey = `${symbol}_${priceDateKey}`
            // let record = await AlphaVantageHistoricalDailyPrices.findOne({
            //    dailyPriceKey: dailyPriceKey,
            // })

            //if (!record) {
            let record = new AlphaVantageHistoricalDailyPrices()
            //}

            //const record = new AlphaVantageHistoricalDailyPrices()
            record.symbol = symbol
            record.dailyPriceKey = `${symbol}_${priceDateKey}`
            record.priceDate = new Date(priceDateKey)
            record.open = alphaVantageData[priceDateKey]['1. open']
            record.high = alphaVantageData[priceDateKey]['2. high']
            record.low = alphaVantageData[priceDateKey]['3. low']
            record.close = alphaVantageData[priceDateKey]['4. close']
            record.adjustedClose =
               alphaVantageData[priceDateKey]['5. adjusted close']
            record.volume = alphaVantageData[priceDateKey]['6. volume']
            record.dividendAmount =
               alphaVantageData[priceDateKey]['7. dividend amount']
            record.splitCoefficient =
               alphaVantageData[priceDateKey]['8. split coefficient']
            //historicalPricesDocsArray.push(record)
            await record.save()
         }
         let timerEnd = Date.now()
         let elapsedMs = timerEnd - timerStart
         let elapsedSec = elapsedMs / 1000
         LogThis(
            log,
            `${symbol} completed reading daily prices results. Elapsed ms=${elapsedMs}; sec=${elapsedSec}`,
         )

         // LogThis(log, `${symbol} started inserting many daily prices`)
         // timerStart = Date.now()
         // await AlphaVantageHistoricalDailyPrices.insertMany(
         //    historicalPricesDocsArray,
         // )
         // timerEnd = Date.now()
         // elapsedMs = timerEnd - timerStart
         // elapsedSec = elapsedMs / 1000
         // LogThis(
         //    log,
         //    `${symbol} completed inserting many daily prices. Elapsed ms=${elapsedMs}; sec=${elapsedSec}`,
         // )
      } catch (ex) {
         LogThis(
            log,
            `${symbol} Error while saving AlphaVantageHistoricalDailyPrices Exception: ${ex.message}`,
            L0,
         )
         await updateErrorStatus({
            symbol: symbol,
            sourceVendor: 'AlphaVantage',
            function: params.function,
            message: `Error while saving to AlphaVantageHistoricalDailyPrices ${ex.message}`,
         })
      }
      LogThis(
         log,
         `Symbols remaining ${
            symbolsTotalCount - symbolsProcessed
         } of ${symbolsTotalCount}`,
      )
   }

   LogThis(log, `Finished updating ${symbolsTotalCount} symbols`)
   return true
}

const updateCompanyDailyMetrics = async inputs => {
   const log = new LoggerSettings(srcFileName, 'updateCompanyDailyMetrics')
   const apiKey = process.env.KUARSIS_VALUEMINER_ALPHAVANTAGE_APIKEY
   const symbols = inputs.symbols
   const configs = inputs.configs
   const { refreshcache } = configs

   if (!apiKey || apiKey == '') {
      throw new Error(`Alpha Vantage apikey is empty.`)
   }

   const params = {
      function: 'TIME_SERIES_DAILY_ADJUSTED',
      symbol: null,
      outputsize: 'full',
      apikey: apiKey,
   }

   const symbolsTotalCount = symbols?.length
   let symbolsProcessed = 0
   let firstTimeApiCall = true
   LogThis(log, `Started processing ${symbolsTotalCount} symbols`)
   for (const symbol of symbols) {
      params.symbol = symbol
      LogThis(log, `${symbol} Started updating function: ${params.function}`)

      LogThis(
         log,
         `${symbol} Started updating function: ${params.function}`,
         L1,
      )
      try {
         if (firstTimeApiCall) {
            firstTimeApiCall = false
            //millisecondsStart = Date.now()
         } else {
            await sleep(process.env.KUARSIS_VALUEMINER_ALPHAVANTAGE_CALLWAIT)
         }

         apiResponses = await axios.get(`https://www.alphavantage.co/query`, {
            params,
         })
         if (
            apiResponses &&
            apiResponses?.data &&
            apiResponses.data['Time Series (Daily)'] &&
            Object.keys(apiResponses.data['Time Series (Daily)'])?.length > 0
         ) {
            LogThis(
               log,
               `${symbol} function ${params.function} data found by API`,
            )
         } else {
            const messageFromAPI = apiResponses?.data?.Information
               ? `with message ${apiResponses?.data?.Information}`
               : ''

            await updateErrorStatus({
               symbol: symbol,
               sourceVendor: 'AlphaVantage',
               function: params.function,
               message: `symbol not found or error from API ${messageFromAPI}`,
            })
            break
         }
      } catch (ex) {
         LogThis(
            log,
            `${symbol} not found in cache nor in API.  Exception: ${ex.message}`,
            L0,
         )
         const status = new ValueMinerDataSourceStatus()
         status.ticker = symbol
         status.sourceVendor = 'AlphaVantage'
         status.status = false
         status.functionName = params.function
         status.message = `Exception thrown by API for ticker not found in function ${params.function}`
         await status.save()
         continue
      }

      try {
         let alphaVantageData = apiResponses.data['Time Series (Daily)']

         await AlphaVantageHistoricalDailyPrices.deleteMany({ symbol: symbol })

         for (const priceDateKey of Object.keys(alphaVantageData)) {
            const record = new AlphaVantageHistoricalDailyPrices()
            record.symbol = symbol
            record.priceDate = new Date(priceDateKey)
            record.open = alphaVantageData[priceDateKey]['1. open']
            record.high = alphaVantageData[priceDateKey]['2. high']
            record.low = alphaVantageData[priceDateKey]['3. low']
            record.close = alphaVantageData[priceDateKey]['4. close']
            record.adjustedClose =
               alphaVantageData[priceDateKey]['5. adjusted close']
            record.volume = alphaVantageData[priceDateKey]['6. volume']
            record.dividendAmount =
               alphaVantageData[priceDateKey]['7. dividend amount']
            record.splitCoefficient =
               alphaVantageData[priceDateKey]['8. split coefficient']
            await record.save()
         }
      } catch (ex) {
         LogThis(
            log,
            `${symbol} Error while saving AlphaVantageHistoricalDailyPrices Exception: ${ex.message}`,
            L0,
         )
         await updateErrorStatus({
            symbol: symbol,
            sourceVendor: 'AlphaVantage',
            function: params.function,
            message: `Error while saving to AlphaVantageHistoricalDailyPrices ${ex.message}`,
         })
      }
   }

   LogThis(
      log,
      `Update Completed ${symbolsProcessed} out off ${symbolsTotalCount} remaining ${
         symbolsTotalCount - symbolsProcessed
      }`,
   )
   return true
}

module.exports = {
   getBalanceSheets,
   updateAlphaVantage,
   updateAlphaVantageDailyPrices,
   updateCompanyDailyMetrics,
}
