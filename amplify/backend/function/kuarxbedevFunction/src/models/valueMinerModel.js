/**
 * @prettier
 */

let mongoose = require('mongoose')

const AlphaVantageBalanceSheetAnnualModel = mongoose.Schema(
   {
      key: { type: String, required: false, unique: true },
      symbol: { type: String, required: true },
      year: { type: Number, required: false },
      sequence: { type: Number, required: false },
      fiscalDateEnding: { type: Date, required: false },
      reportedCurrency: { type: String, required: false },
      totalAssets: { type: Number, required: false },
      totalCurrentAssets: { type: Number, required: false },
      cashAndCashEquivalentsAtCarryingValue: { type: Number, required: false },
      cashAndShortTermInvestments: { type: Number, required: false },
      inventory: { type: Number, required: false },
      currentNetReceivables: { type: Number, required: false },
      totalNonCurrentAssets: { type: Number, required: false },
      propertyPlantEquipment: { type: Number, required: false },
      accumulatedDepreciationAmortizationPPE: { type: Number, required: false },
      intangibleAssets: { type: Number, required: false },
      intangibleAssetsExcludingGoodwill: { type: Number, required: false },
      goodwill: { type: Number, required: false },
      investments: { type: Number, required: false },
      longTermInvestments: { type: Number, required: false },
      shortTermInvestments: { type: Number, required: false },
      otherCurrentAssets: { type: Number, required: false },
      otherNonCurrentAssets: { type: Number, required: false },
      totalLiabilities: { type: Number, required: false },
      totalCurrentLiabilities: { type: Number, required: false },
      currentAccountsPayable: { type: Number, required: false },
      deferredRevenue: { type: Number, required: false },
      currentDebt: { type: Number, required: false },
      shortTermDebt: { type: Number, required: false },
      totalNonCurrentLiabilities: { type: Number, required: false },
      capitalLeaseObligations: { type: Number, required: false },
      longTermDebt: { type: Number, required: false },
      currentLongTermDebt: { type: Number, required: false },
      longTermDebtNoncurrent: { type: Number, required: false },
      shortLongTermDebtTotal: { type: Number, required: false },
      otherCurrentLiabilities: { type: Number, required: false },
      otherNonCurrentLiabilities: { type: Number, required: false },
      totalShareholderEquity: { type: Number, required: false },
      treasuryStock: { type: Number, required: false },
      retainedEarnings: { type: Number, required: false },
      commonStock: { type: Number, required: false },
      commonStockSharesOutstanding: { type: Number, required: false },
   },
   {
      timestamps: true,
   },
)
AlphaVantageBalanceSheetAnnualModel.pre('insertMany', function (next, docs) {
   // 'docs' is an array of documents being inserted
   docs.forEach(doc => {
      for (let key in doc) {
         if (doc[key] === 'None') {
            doc[key] = null // Replace "None" with an empty string
         }
      }
   })
   next() // Proceed with the insertion
})

AlphaVantageBalanceSheetAnnualModel.index({ symbol: 1 })

const AlphaVantageBalanceSheetAnnual = mongoose.model(
   'AlphaVantageBalanceSheetAnnual',
   AlphaVantageBalanceSheetAnnualModel,
)

const AlphaVantageBalanceSheetQuarterlyModel = mongoose.Schema(
   {
      key: { type: String, required: false, unique: true },
      symbol: { type: String, required: true },
      year: { type: Number, required: true, unique: false },
      quarter: { type: Number, required: false },
      sequence: { type: Number, required: false },
      fiscalDateEnding: { type: Date, required: false },
      reportedCurrency: { type: String, required: false },
      totalAssets: { type: Number, required: false },
      totalCurrentAssets: { type: Number, required: false },
      cashAndCashEquivalentsAtCarryingValue: { type: Number, required: false },
      cashAndShortTermInvestments: { type: Number, required: false },
      inventory: { type: Number, required: false },
      currentNetReceivables: { type: Number, required: false },
      totalNonCurrentAssets: { type: Number, required: false },
      propertyPlantEquipment: { type: Number, required: false },
      accumulatedDepreciationAmortizationPPE: { type: Number, required: false },
      intangibleAssets: { type: Number, required: false },
      intangibleAssetsExcludingGoodwill: { type: Number, required: false },
      goodwill: { type: Number, required: false },
      investments: { type: Number, required: false },
      longTermInvestments: { type: Number, required: false },
      shortTermInvestments: { type: Number, required: false },
      otherCurrentAssets: { type: Number, required: false },
      otherNonCurrentAssets: { type: Number, required: false },
      totalLiabilities: { type: Number, required: false },
      totalCurrentLiabilities: { type: Number, required: false },
      currentAccountsPayable: { type: Number, required: false },
      deferredRevenue: { type: Number, required: false },
      currentDebt: { type: Number, required: false },
      shortTermDebt: { type: Number, required: false },
      totalNonCurrentLiabilities: { type: Number, required: false },
      capitalLeaseObligations: { type: Number, required: false },
      longTermDebt: { type: Number, required: false },
      currentLongTermDebt: { type: Number, required: false },
      longTermDebtNoncurrent: { type: Number, required: false },
      shortLongTermDebtTotal: { type: Number, required: false },
      otherCurrentLiabilities: { type: Number, required: false },
      otherNonCurrentLiabilities: { type: Number, required: false },
      totalShareholderEquity: { type: Number, required: false },
      treasuryStock: { type: Number, required: false },
      retainedEarnings: { type: Number, required: false },
      commonStock: { type: Number, required: false },
      commonStockSharesOutstanding: { type: Number, required: false },
   },
   {
      timestamps: true,
   },
)

AlphaVantageBalanceSheetQuarterlyModel.index({ symbol: 1 })

AlphaVantageBalanceSheetQuarterlyModel.pre('insertMany', function (next, docs) {
   // 'docs' is an array of documents being inserted
   docs.forEach(doc => {
      for (let key in doc) {
         if (doc[key] === 'None') {
            doc[key] = null // Replace "None" with an empty string
         }
      }
   })
   next() // Proceed with the insertion
})

const AlphaVantageBalanceSheetQuarterly = mongoose.model(
   'AlphaVantageBalanceSheetQuarterly',
   AlphaVantageBalanceSheetQuarterlyModel,
)

const AlphaVantageCashFlowAnnualModel = mongoose.Schema(
   {
      key: { type: String, required: true, unique: true },
      symbol: { type: String, required: true, unique: false },
      year: { type: Number, required: false },
      sequence: { type: Number, required: false },
      fiscalDateEnding: { type: Date, required: false, unique: false },
      reportedCurrency: { type: String, required: false, unique: false },
      operatingCashflow: { type: Number, required: false, unique: false },
      paymentsForOperatingActivities: {
         type: Number,
         required: false,
         unique: false,
      },
      proceedsFromOperatingActivities: {
         type: Number,
         required: false,
         unique: false,
      },
      changeInOperatingLiabilities: {
         type: Number,
         required: false,
         unique: false,
      },
      changeInOperatingAssets: { type: Number, required: false, unique: false },
      depreciationDepletionAndAmortization: {
         type: Number,
         required: false,
         unique: false,
      },
      capitalExpenditures: { type: Number, required: false, unique: false },
      changeInReceivables: { type: Number, required: false, unique: false },
      changeInInventory: { type: Number, required: false, unique: false },
      profitLoss: { type: Number, required: false, unique: false },
      cashflowFromInvestment: { type: Number, required: false, unique: false },
      cashflowFromFinancing: { type: Number, required: false, unique: false },
      proceedsFromRepaymentsOfShortTermDebt: {
         type: Number,
         required: false,
         unique: false,
      },
      paymentsForRepurchaseOfCommonStock: {
         type: Number,
         required: false,
         unique: false,
      },
      paymentsForRepurchaseOfEquity: {
         type: Number,
         required: false,
         unique: false,
      },
      paymentsForRepurchaseOfPreferredStock: {
         type: Number,
         required: false,
         unique: false,
      },
      dividendPayout: { type: Number, required: false, unique: false },
      dividendPayoutCommonStock: {
         type: Number,
         required: false,
         unique: false,
      },
      dividendPayoutPreferredStock: {
         type: Number,
         required: false,
         unique: false,
      },
      proceedsFromIssuanceOfCommonStock: {
         type: Number,
         required: false,
         unique: false,
      },
      proceedsFromIssuanceOfLongTermDebtAndCapitalSecuritiesNet: {
         type: Number,
         required: false,
         unique: false,
      },
      proceedsFromIssuanceOfPreferredStock: {
         type: Number,
         required: false,
         unique: false,
      },
      proceedsFromRepurchaseOfEquity: {
         type: Number,
         required: false,
         unique: false,
      },
      proceedsFromSaleOfTreasuryStock: {
         type: Number,
         required: false,
         unique: false,
      },
      changeInCashAndCashEquivalents: {
         type: Number,
         required: false,
         unique: false,
      },
      changeInExchangeRate: { type: Number, required: false, unique: false },
      netIncome: { type: Number, required: false, unique: false },
   },
   {
      timestamps: true,
   },
)

AlphaVantageCashFlowAnnualModel.index({ symbol: 1 })

AlphaVantageCashFlowAnnualModel.pre('insertMany', function (next, docs) {
   // 'docs' is an array of documents being inserted
   docs.forEach(doc => {
      for (let key in doc) {
         if (doc[key] === 'None') {
            doc[key] = null // Replace "None" with an empty string
         }
      }
   })
   next() // Proceed with the insertion
})
const AlphaVantageCashFlowAnnual = mongoose.model(
   'AlphaVantageCashFlowAnnual',
   AlphaVantageCashFlowAnnualModel,
)

const AlphaVantageCashFlowQuarterlyModel = mongoose.Schema(
   {
      key: { type: String, required: true, unique: true },
      symbol: { type: String, required: true, unique: false },
      year: { type: Number, required: true, unique: false },
      quarter: { type: Number, required: false },
      sequence: { type: Number, required: false },
      fiscalDateEnding: { type: Date, required: false, unique: false },
      reportedCurrency: { type: String, required: false, unique: false },
      operatingCashflow: { type: Number, required: false, unique: false },
      paymentsForOperatingActivities: {
         type: Number,
         required: false,
         unique: false,
      },
      proceedsFromOperatingActivities: {
         type: Number,
         required: false,
         unique: false,
      },
      changeInOperatingLiabilities: {
         type: Number,
         required: false,
         unique: false,
      },
      changeInOperatingAssets: { type: Number, required: false, unique: false },
      depreciationDepletionAndAmortization: {
         type: Number,
         required: false,
         unique: false,
      },
      capitalExpenditures: { type: Number, required: false, unique: false },
      changeInReceivables: { type: Number, required: false, unique: false },
      changeInInventory: { type: Number, required: false, unique: false },
      profitLoss: { type: Number, required: false, unique: false },
      cashflowFromInvestment: { type: Number, required: false, unique: false },
      cashflowFromFinancing: { type: Number, required: false, unique: false },
      proceedsFromRepaymentsOfShortTermDebt: {
         type: Number,
         required: false,
         unique: false,
      },
      paymentsForRepurchaseOfCommonStock: {
         type: Number,
         required: false,
         unique: false,
      },
      paymentsForRepurchaseOfEquity: {
         type: Number,
         required: false,
         unique: false,
      },
      paymentsForRepurchaseOfPreferredStock: {
         type: Number,
         required: false,
         unique: false,
      },
      dividendPayout: { type: Number, required: false, unique: false },
      dividendPayoutCommonStock: {
         type: Number,
         required: false,
         unique: false,
      },
      dividendPayoutPreferredStock: {
         type: Number,
         required: false,
         unique: false,
      },
      proceedsFromIssuanceOfCommonStock: {
         type: Number,
         required: false,
         unique: false,
      },
      proceedsFromIssuanceOfLongTermDebtAndCapitalSecuritiesNet: {
         type: Number,
         required: false,
         unique: false,
      },
      proceedsFromIssuanceOfPreferredStock: {
         type: Number,
         required: false,
         unique: false,
      },
      proceedsFromRepurchaseOfEquity: {
         type: Number,
         required: false,
         unique: false,
      },
      proceedsFromSaleOfTreasuryStock: {
         type: Number,
         required: false,
         unique: false,
      },
      changeInCashAndCashEquivalents: {
         type: Number,
         required: false,
         unique: false,
      },
      changeInExchangeRate: { type: Number, required: false, unique: false },
      netIncome: { type: Number, required: false, unique: false },
   },
   {
      timestamps: true,
   },
)

AlphaVantageCashFlowQuarterlyModel.index({ symbol: 1 })

AlphaVantageCashFlowQuarterlyModel.pre('insertMany', function (next, docs) {
   // 'docs' is an array of documents being inserted
   docs.forEach(doc => {
      for (let key in doc) {
         if (doc[key] === 'None') {
            doc[key] = null // Replace "None" with an empty string
         }
      }
   })
   next() // Proceed with the insertion
})
const AlphaVantageCashFlowQuarterly = mongoose.model(
   'AlphaVantageCashFlowQuarterly',
   AlphaVantageCashFlowQuarterlyModel,
)

//----Income Statement Annual Start
const AlphaVantageIncomeStatementAnnualModel = mongoose.Schema(
   {
      key: { type: String, required: true, unique: true },
      symbol: { type: String, required: true, unique: false },
      year: { type: Number, required: false },
      sequence: { type: Number, required: false },
      fiscalDateEnding: { type: Date, required: false, unique: false },
      reportedCurrency: { type: String, required: false, unique: false },
      grossProfit: { type: Number, required: false, unique: false },
      totalRevenue: { type: Number, required: false, unique: false },
      costOfRevenue: { type: Number, required: false, unique: false },
      costofGoodsAndServicesSold: {
         type: Number,
         required: false,
         unique: false,
      },
      operatingIncome: { type: Number, required: false, unique: false },
      sellingGeneralAndAdministrative: {
         type: Number,
         required: false,
         unique: false,
      },
      researchAndDevelopment: { type: Number, required: false, unique: false },
      operatingExpenses: { type: Number, required: false, unique: false },
      investmentIncomeNet: { type: Number, required: false, unique: false },
      netInterestIncome: { type: Number, required: false, unique: false },
      interestIncome: { type: Number, required: false, unique: false },
      interestExpense: { type: Number, required: false, unique: false },
      nonInterestIncome: { type: Number, required: false, unique: false },
      otherNonOperatingIncome: { type: Number, required: false, unique: false },
      depreciation: { type: Number, required: false, unique: false },
      depreciationAndAmortization: {
         type: Number,
         required: false,
         unique: false,
      },
      incomeBeforeTax: { type: Number, required: false, unique: false },
      incomeTaxExpense: { type: Number, required: false, unique: false },
      interestAndDebtExpense: { type: Number, required: false, unique: false },
      netIncomeFromContinuingOperations: {
         type: Number,
         required: false,
         unique: false,
      },
      comprehensiveIncomeNetOfTax: {
         type: Number,
         required: false,
         unique: false,
      },
      ebit: { type: Number, required: false, unique: false },
      ebitda: { type: Number, required: false, unique: false },
      netIncome: { type: Number, required: false, unique: false },
      netIncome: { type: Number, required: false, unique: false },
   },
   {
      timestamps: true,
   },
)
AlphaVantageIncomeStatementAnnualModel.index({ symbol: 1 })

AlphaVantageIncomeStatementAnnualModel.pre('insertMany', function (next, docs) {
   // 'docs' is an array of documents being inserted
   docs.forEach(doc => {
      for (let key in doc) {
         if (doc[key] === 'None') {
            doc[key] = null // Replace "None" with an empty string
         }
      }
   })
   next() // Proceed with the insertion
})
const AlphaVantageIncomeStatementAnnual = mongoose.model(
   'AlphaVantageIncomeStatementAnnual',
   AlphaVantageIncomeStatementAnnualModel,
)
// Income Statement Annual End
//Income Statement Quarterly Start
const AlphaVantageIncomeStatementQuarterlyModel = mongoose.Schema(
   {
      key: { type: String, required: true, unique: true },
      symbol: { type: String, required: true, unique: false },
      year: { type: Number, required: true, unique: false },
      quarter: { type: Number, required: false },
      sequence: { type: Number, required: false },
      fiscalDateEnding: { type: Date, required: false, unique: false },
      reportedCurrency: { type: String, required: false, unique: false },
      grossProfit: { type: Number, required: false, unique: false },
      totalRevenue: { type: Number, required: false, unique: false },
      costOfRevenue: { type: Number, required: false, unique: false },
      costofGoodsAndServicesSold: {
         type: Number,
         required: false,
         unique: false,
      },
      operatingIncome: { type: Number, required: false, unique: false },
      sellingGeneralAndAdministrative: {
         type: Number,
         required: false,
         unique: false,
      },
      researchAndDevelopment: { type: Number, required: false, unique: false },
      operatingExpenses: { type: Number, required: false, unique: false },
      investmentIncomeNet: { type: Number, required: false, unique: false },
      netInterestIncome: { type: Number, required: false, unique: false },
      interestIncome: { type: Number, required: false, unique: false },
      interestExpense: { type: Number, required: false, unique: false },
      nonInterestIncome: { type: Number, required: false, unique: false },
      otherNonOperatingIncome: { type: Number, required: false, unique: false },
      depreciation: { type: Number, required: false, unique: false },
      depreciationAndAmortization: {
         type: Number,
         required: false,
         unique: false,
      },
      incomeBeforeTax: { type: Number, required: false, unique: false },
      incomeTaxExpense: { type: Number, required: false, unique: false },
      interestAndDebtExpense: { type: Number, required: false, unique: false },
      netIncomeFromContinuingOperations: {
         type: Number,
         required: false,
         unique: false,
      },
      comprehensiveIncomeNetOfTax: {
         type: Number,
         required: false,
         unique: false,
      },
      ebit: { type: Number, required: false, unique: false },
      ebitda: { type: Number, required: false, unique: false },
      netIncome: { type: Number, required: false, unique: false },
   },
   {
      timestamps: true,
   },
)

AlphaVantageIncomeStatementQuarterlyModel.index({ symbol: 1 })

AlphaVantageIncomeStatementQuarterlyModel.pre(
   'insertMany',
   function (next, docs) {
      // 'docs' is an array of documents being inserted
      docs.forEach(doc => {
         for (let key in doc) {
            if (doc[key] === 'None') {
               doc[key] = null // Replace "None" with an empty string
            }
         }
      })
      next() // Proceed with the insertion
   },
)
const AlphaVantageIncomeStatementQuarterly = mongoose.model(
   'AlphaVantageIncomeStatementQuarterly',
   AlphaVantageIncomeStatementQuarterlyModel,
)
//Income Statement quarterly end.

const AlphaVantageCacheModel = mongoose.Schema(
   {
      functionName: { type: String, required: true, unique: false },
      symbol: { type: String, required: true, unique: false },
      data: {
         type: mongoose.Schema.Types.Mixed,
         required: true,
         unique: false,
      },
   },
   {
      timestamps: true,
   },
)

AlphaVantageCacheModel.index({ symbol: 1, functionName: 1 })

const AlphaVantageCache = mongoose.model(
   'AlphaVantageCache',
   AlphaVantageCacheModel,
)
//----

const edgarCompanyFactsAnnual = mongoose.Schema(
   {
      symbol: { type: String, required: true },
      cik: { type: Number, required: true },
      year: { type: Number, required: true },
      InterestExpense: { type: Number, required: true },
   },
   {
      timestamps: true,
   },
)

const EdgarCompanyFactsAnnual = mongoose.model(
   'EdgarCompanyFactsAnnual',
   edgarCompanyFactsAnnual,
)

const edgarCompanyFactsQuarter = mongoose.Schema(
   {
      symbol: { type: String, required: true },
      cik: { type: Number, required: true },
      year: { type: Number, required: true },
      quarter: { type: Number, required: true },
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      InterestExpense: { type: Number, required: true },
   },
   {
      timestamps: true,
   },
)

const EgarCompanyFactsQuarter = mongoose.model(
   'EgarCompanyFactsQuarter',
   edgarCompanyFactsQuarter,
)

const edgarCikToTickerMaps = mongoose.Schema(
   {
      cikTickerMap: { type: mongoose.Schema.Types.Mixed, required: true },
   },
   {
      timestamps: true,
   },
)

const EdgarCikToTickerMaps = mongoose.model(
   'EdgarCikToTickerMaps',
   edgarCikToTickerMaps,
)

const edgarCompaniesFacts = mongoose.Schema(
   {
      key: { type: String, required: true, unique: true },
      ticker: { type: String, required: true, unique: true },
      cik: { type: String, required: true },
      companyName: { type: String, required: true },
      year: { type: Number, required: false },
      sequence: { type: Number, required: false },

      ticker: { type: String, required: true, unique: true },
      cik: { type: String, required: true },
      companyName: { type: String, required: true },
      edgarData: { type: mongoose.Schema.Types.Mixed },
   },
   {
      timestamps: true,
   },
)

const EdgarCompaniesFacts = mongoose.model(
   'EdgarCompaniesFacts',
   edgarCompaniesFacts,
)

const ValueMinerDataSourceStatusModel = mongoose.Schema(
   {
      ticker: { type: String, required: true },
      sourceVendor: { type: String, required: true },
      status: { type: Boolean, required: true },
      functionName: { type: String, required: true },
      message: { type: String, required: true },
   },
   {
      timestamps: true,
   },
)

const ValueMinerDataSourceStatus = mongoose.model(
   'ValueMinerDataSourceStatus',
   ValueMinerDataSourceStatusModel,
)

const CompanyAnnualMetricsModel = mongoose.Schema(
   {
      symbol: { type: String, required: true, unique: false },
      CIK: {
         type: Number,
         required: false,
         unique: false,
         set: value => (value === 'None' || value === '-' ? null : value),
      },
      yearStart: { type: Number, required: true, unique: false },
      yearEnd: { type: Number, required: true, unique: false },
      year10_NumberOfYearsAvailable: {
         type: Number,
         required: false,
         unique: false,
      },
      year10_growthRate: { type: Number, required: false, unique: false },
      year10_growthRateConfidence: {
         type: Number,
         required: false,
         unique: false,
      },
      latestCashFlowReported: { type: Number, required: false, unique: false },
      interestExpense: {
         type: Number,
         required: false,
         unique: false,
         set: value => (value === 'None' || value === '-' ? null : value),
      },
      interestAndDebtExpense: {
         type: Number,
         required: false,
         unique: false,
         set: value => (value === 'None' || value === '-' ? null : value),
      },
      AssetType: { type: String, required: false, unique: false },
      Description: { type: String, required: false, unique: false },

      Exchange: { type: String, required: false, unique: false },
      OfficialSite: { type: String, required: false, unique: false },
      DilutedEPSTTM: {
         type: Number,
         required: false,
         unique: false,
         set: value => (value === 'None' || value === '-' ? null : value),
      },
      QuarterlyEarningsGrowthYOY: {
         type: Number,
         required: false,
         unique: false,
         set: value => (value === 'None' || value === '-' ? null : value),
      },
      QuarterlyRevenueGrowthYOY: {
         type: Number,
         required: false,
         unique: false,
         set: value => (value === 'None' || value === '-' ? null : value),
      },
      AnalystTargetPrice: {
         type: Number,
         required: false,
         unique: false,
         set: value => (value === 'None' || value === '-' ? null : value),
      },
      AnalystRatingStrongBuy: {
         type: Number,
         required: false,
         unique: false,
         set: value => (value === 'None' || value === '-' ? null : value),
      },
      AnalystRatingBuy: {
         type: Number,
         required: false,
         unique: false,
         set: value => (value === 'None' || value === '-' ? null : value),
      },
      AnalystRatingHold: {
         type: Number,
         required: false,
         unique: false,
         set: value => (value === 'None' || value === '-' ? null : value),
      },
      AnalystRatingSell: {
         type: Number,
         required: false,
         unique: false,
         set: value => (value === 'None' || value === '-' ? null : value),
      },
      AnalystRatingStrongSell: {
         type: Number,
         required: false,
         unique: false,
         set: value => (value === 'None' || value === '-' ? null : value),
      },
      TrailingPE: {
         type: Number,
         required: false,
         unique: false,
         set: value => (value === 'None' || value === '-' ? null : value),
      },
      ForwardPE: {
         type: Number,
         required: false,
         unique: false,
         set: value => (value === 'None' || value === '-' ? null : value),
      },
      Beta: {
         type: Number,
         required: false,
         unique: false,
         set: value => (value === 'None' || value === '-' ? null : value),
      },
      SharesOutstanding: {
         type: Number,
         required: false,
         unique: false,
         set: value => (value === 'None' || value === '-' ? null : value),
      },
      latestTotalAssets: {
         type: Number,
         required: false,
         unique: false,
         set: value => (value === 'None' || value === '-' ? null : value),
      },
      latestTotalLiabilities: {
         type: Number,
         required: false,
         unique: false,
         set: value => (value === 'None' || value === '-' ? null : value),
      },
      latestGoodwill: {
         type: Number,
         required: false,
         unique: false,
         set: value => (value === 'None' || value === '-' ? null : value),
      },
      latestCashAndCashEquivalents: {
         type: Number,
         required: false,
         unique: false,
         set: value => (value === 'None' || value === '-' ? null : value),
      },

      //HERE ONWARD
      VaR_1_percent: {
         type: Number,
         required: false,
         unique: false,
         set: value => (value === 'None' || value === '-' ? null : value),
      },
      VaR_1_value: {
         type: Number,
         required: false,
         unique: false,
         set: value => (value === 'None' || value === '-' ? null : value),
      },
      VaR_2_percent: {
         type: Number,
         required: false,
         unique: false,
         set: value => (value === 'None' || value === '-' ? null : value),
      },
      VaR_2_value: {
         type: Number,
         required: false,
         unique: false,
         set: value => (value === 'None' || value === '-' ? null : value),
      },
      VaR_3_percent: {
         type: Number,
         required: false,
         unique: false,
         set: value => (value === 'None' || value === '-' ? null : value),
      },
      VaR_3_value: {
         type: Number,
         required: false,
         unique: false,
         set: value => (value === 'None' || value === '-' ? null : value),
      },
      CVaR_1_percent: {
         type: Number,
         required: false,
         unique: false,
         set: value => (value === 'None' || value === '-' ? null : value),
      },
      CVaR_1_value: {
         type: Number,
         required: false,
         unique: false,
         set: value => (value === 'None' || value === '-' ? null : value),
      },
      CVaR_2_percent: {
         type: Number,
         required: false,
         unique: false,
         set: value => (value === 'None' || value === '-' ? null : value),
      },
      CVaR_2_value: {
         type: Number,
         required: false,
         unique: false,
         set: value => (value === 'None' || value === '-' ? null : value),
      },
      CVaR_3_percent: {
         type: Number,
         required: false,
         unique: false,
         set: value => (value === 'None' || value === '-' ? null : value),
      },
      CVaR_3_value: {
         type: Number,
         required: false,
         unique: false,
         set: value => (value === 'None' || value === '-' ? null : value),
      },

      VaR_CVaR_dataPointsFound: {
         type: Number,
         required: false,
         unique: false,
         set: value => (value === 'None' || value === '-' ? null : value),
      },
   },
   {
      timestamps: true,
   },
)

CompanyAnnualMetricsModel.index({ symbol: 1 })

const CompanyAnnualMetrics = mongoose.model(
   'CompanyAnnualMetrics',
   CompanyAnnualMetricsModel,
)

//START DAILY PRICES
const AlphaVantageHistoricalDailyPricesModel = mongoose.Schema(
   {
      dailyPriceKey: { type: String, required: true, unique: true },
      symbol: { type: String, required: true, unique: false },
      priceDate: { type: Date, required: true, unique: false },
      open: { type: Number, required: false, unique: false },
      high: { type: Number, required: false, unique: false },
      low: { type: Number, required: false, unique: false },
      close: { type: Number, required: false, unique: false },
      adjustedClose: { type: Number, required: false, unique: false },
      volume: { type: Number, required: false, unique: false },
      dividendAmount: { type: Number, required: false, unique: false },
      splitCoefficient: { type: Number, required: false, unique: false },
   },
   {
      timestamps: true,
   },
)

AlphaVantageHistoricalDailyPricesModel.pre('insertMany', function (next, docs) {
   // 'docs' is an array of documents being inserted
   docs.forEach(doc => {
      for (let key in doc) {
         if (doc[key] === 'None') {
            doc[key] = null // Replace "None" with an empty string
         }
      }
   })
   next() // Proceed with the insertion
})

AlphaVantageHistoricalDailyPricesModel.index({ symbol: 1 })

const AlphaVantageHistoricalDailyPrices = mongoose.model(
   'AlphaVantageHistoricalDailyPrices',
   AlphaVantageHistoricalDailyPricesModel,
)
//END DAILY PRICES

module.exports = {
   AlphaVantageBalanceSheetAnnual,
   AlphaVantageBalanceSheetQuarterly,
   AlphaVantageCashFlowAnnual,
   AlphaVantageCashFlowQuarterly,
   AlphaVantageIncomeStatementAnnual,
   AlphaVantageIncomeStatementQuarterly,
   AlphaVantageCache,
   CompanyAnnualMetrics,
   EdgarCompanyFactsAnnual,
   EdgarCikToTickerMaps,
   EgarCompanyFactsQuarter,
   EdgarCompaniesFacts,
   ValueMinerDataSourceStatus,
   AlphaVantageHistoricalDailyPrices,
}
