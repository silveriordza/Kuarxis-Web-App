/**
 * @format
 * @prittier
 */

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
   j,
} = require('../utils/Logger.js')
const { validateHasData } = require('./Functions.js')

const {
   applyStringCriteriaToValue,
   formatDate,
} = require('../utils/Functions.js')

const {
   EdgarCompanyFactsAnnual,
   EdgarCikToTickerMaps,
   EgarCompanyFactsQuarter,
   EdgarCompaniesFacts,
} = require('../models/valueMinerModel.js')

const srcFileName = 'kuarxEdgarAPI.js'

const secEdgarBulkUpdate = async years => {
   const log = new LoggerSettings(srcFileName, 'bulkUpdate')
   LogThis(log, `START`)
   try {
      await EdgarCompanyFactsAnnual.deleteMany({ year: years })
      const apiResponses = []

      const headers = {
         'User-Agent': 'Kuarxis Companies silverio.rodriguez@kuarxis.com',
         'Accept-Encoding': 'gzip, deflate, br',
         Host: 'data.sec.gov',
         Accept: '*/*',
      }

      const cikTickerMapCollection = await EdgarCikToTickerMaps.find({}).lean()
      const cikTickerMapData = Object.values(
         cikTickerMapCollection[0].cikTickerMap,
      )
      const edgarCompanyFactsAnnualArray = []
      for (const year of years) {
         const apiResponse = await axios.get(
            `https://data.sec.gov/api/xbrl/frames/us-gaap/InterestExpense/USD/CY${year}.json`,
            { headers: headers },
         )
         if (!HasData(apiResponse?.data?.data)) {
            return false
         }

         for (const interestData of apiResponse?.data?.data) {
            const edgarCompanyFactAnnual = new EdgarCompanyFactsAnnual()
            edgarCompanyFactAnnual.cik = interestData.cik
            edgarCompanyFactAnnual.symbol = cikTickerMapData.find(
               data => data.cik_str === interestData.cik,
            )?.ticker
            if (!HasData(edgarCompanyFactAnnual.symbol)) {
               edgarCompanyFactAnnual.symbol = 'KUARXISNOTFOUND'
            }
            edgarCompanyFactAnnual.year = year
            edgarCompanyFactAnnual.InterestExpense = interestData.val
            edgarCompanyFactsAnnualArray.push(edgarCompanyFactAnnual)
         }
      }
      await EdgarCompanyFactsAnnual.insertMany(edgarCompanyFactsAnnualArray)

      return true
   } catch (ex) {
      throw Error(ex)
   }
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const secEdgarBulkQuarterUpdate = async quarters => {
   const log = new LoggerSettings(srcFileName, 'secEdgarBulkQuarterUpdate')
   LogThis(log, `START`)
   try {
      const headers = {
         'User-Agent': 'Kuarxis Companies silverio.rodriguez@kuarxis.com',
         'Accept-Encoding': 'gzip, deflate, br',
         Host: 'data.sec.gov',
         Accept: '*/*',
      }

      const apiResponses = []

      const cikTickerMapCollection = await EdgarCikToTickerMaps.find({}).lean()
      const cikTickerMapData = Object.values(
         cikTickerMapCollection[0].cikTickerMap,
      )
      const entityArray = []
      let AreThereMoreYears = true
      for (const year of Object.keys(quarters)) {
         if (!AreThereMoreYears) {
            break
         }

         for (const quarter of quarters[year]) {
            await EgarCompanyFactsQuarter.deleteMany({
               year: year,
               quarter: quarter,
            })

            const apiResponse = await axios.get(
               `https://data.sec.gov/api/xbrl/frames/us-gaap/InterestExpense/USD/CY${year}Q${quarter}.json`,
               { headers: headers },
            )
            await sleep(120)
            if (!HasData(apiResponse?.data?.data)) {
               AreThereMoreYears = false
               break
            }

            for (const interestData of apiResponse?.data?.data) {
               const entity = new EgarCompanyFactsQuarter()
               entity.cik = interestData.cik
               entity.symbol = cikTickerMapData.find(
                  data => data.cik_str === interestData.cik,
               )?.ticker
               if (!HasData(entity.symbol)) {
                  entity.symbol = 'KUARXISNOTFOUND'
               }
               entity.year = year
               entity.quarter = quarter
               entity.startDate = interestData.start
               entity.endDate = interestData.end
               entity.InterestExpense = interestData.val
               entityArray.push(entity)
            }
         }
      }
      await EgarCompanyFactsQuarter.insertMany(entityArray)

      return true
   } catch (ex) {
      throw Error(ex)
   }
}

const edgarBulkCompanyFactsUpdate = async configs => {
   const log = new LoggerSettings(srcFileName, 'edgarBulkCompanyFactsUpdate')
   LogThis(log, `START`, L0)
   try {
      const headers = {
         'User-Agent': 'Kuarxis Companies silverio.rodriguez@kuarxis.com',
         'Accept-Encoding': 'gzip, deflate, br',
         Host: 'data.sec.gov',
         Accept: '*/*',
      }

      const cikTickerMapCollection = await EdgarCikToTickerMaps.find({}).lean()
      const cikTickerMapData = Object.values(
         cikTickerMapCollection[0].cikTickerMap,
      )

      let cikTickerMapDataFinal = []

      switch (configs.updatetype) {
         case 'some':
            {
               const tickersToUse = configs.tickers

               for (const ticker of tickersToUse) {
                  const tickerFound = cikTickerMapData.find(
                     cikTicker => cikTicker.ticker === ticker,
                  )
                  if (tickerFound) {
                     cikTickerMapDataFinal.push(tickerFound)
                  } else {
                     LogThis(log, `ticker not found in map: ${ticker}`)
                  }
               }
            }
            break
         case 'all':
            cikTickerMapDataFinal = cikTickerMapData
            break
         default:
            throw Error('Invalid updatetype, only SOME or ALL is accepted.')
      }

      LogThis(log, `Total tickers ${cikTickerMapDataFinal.length}`, L0)
      //TIP: Do not deleteMany here, do it one by one first get it from Edgar, then if ok, delete and then insert.
      await EdgarCompaniesFacts.deleteMany({
         ticker: { $in: cikTickerMapDataFinal.map(id => id.ticker) },
      })

      let isFirstCycle = true
      let companyFacts = null
      let companyCounter = 0
      for (const companyIdentifier of cikTickerMapDataFinal) {
         companyCounter++
         LogThis(
            log,
            `Loading company ${companyCounter} of ${cikTickerMapDataFinal.length}`,
            L0,
         )

         const cik = String(companyIdentifier.cik_str)
         const preFixZerosQuantity = 10 - cik.length
         const zeros = '0'.repeat(preFixZerosQuantity)

         const companyFactJsonFilename = `${zeros}${cik}`
         let tickerFoundInEdgar = true
         tickerFoundInEdgar = true
         if (!isFirstCycle) {
            await sleep(103)
         }
         LogThis(
            log,
            `Getting Info from Edgar for Ticker: ${companyIdentifier.ticker}; CIK:${companyIdentifier.cik_str}; Company Name: ${companyIdentifier.title}`,
            L0,
         )
         let kuarxApiResponses
         try {
            kuarxApiResponses = await axios.get(
               `https://data.sec.gov/api/xbrl/companyfacts/CIK${companyFactJsonFilename}.json`,
               { headers: headers },
            )
         } catch (ex) {
            tickerFoundInEdgar = false
         }

         tickerFoundInEdgar &&
            LogThis(
               log,
               `Got Info from Edgar for Ticker: ${companyIdentifier.ticker}; CIK:${companyIdentifier.cik_str}; Company Name: ${companyIdentifier.title}`,
               L0,
            )

         if (!tickerFoundInEdgar || kuarxApiResponses?.data === undefined) {
            tickerFoundInEdgar = false
            LogThis(
               log,
               `Company data not found in Edgar: ${companyIdentifier.ticker}; CIK:${companyIdentifier.cik_str}; Company Name: ${companyIdentifier.title}`,
               L0,
            )
         }

         const companyFacts = tickerFoundInEdgar ? kuarxApiResponses.data : null

         const entity = new EdgarCompaniesFacts()
         const ticker = companyIdentifier.ticker

         const cikIn = tickerFoundInEdgar
            ? companyFacts.cik
            : companyIdentifier.cik_str

         const companyName = tickerFoundInEdgar
            ? companyFacts.entityName
            : companyIdentifier.title

         entity.ticker = ticker
         entity.cik = cikIn

         entity.companyName = companyName
         entity.edgarData = {
            tickerFoundInEdgar: tickerFoundInEdgar,
            companyFacts: companyFacts,
         }

         LogThis(
            log,
            `STORING IN VALUE MINER DATABASE TICKER: ${ticker}; cik: ${cikIn} Company Name: ${companyName}`,
            L0,
         )
         await entity.save(entity)
         LogThis(
            log,
            `STORED IN VALUE MINER DATABASE TICKER:${ticker}; cik: ${cikIn} Company Name: ${companyName}`,
            L0,
         )

         isFirstCycle = false
      }
      LogThis(log, `END`)
      return true
   } catch (ex) {
      throw Error(ex)
   }
}

module.exports = {
   secEdgarBulkUpdate,
   secEdgarBulkQuarterUpdate,
   edgarBulkCompanyFactsUpdate,
}
