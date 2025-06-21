/** @format */

//const { j } = require('./Functions')

const OFF = -1
const L0 = 0
const L1 = 1
const L2 = 2
const L3 = 3

const srcFileName = 'Logger.js'

const j = value => {
   return JSON.stringify(value, null, 1)
}

const initLogSettings = (fileName = '', functionName = '') => {
   return {
      sourceFilename: fileName,
      sourceFunction: functionName,
   }
}

function LoggerSettings(fileName = '', functionName = '') {
   this.fileName = fileName || ''
   this.functionName = functionName || ''
}

const LogThis = (logSettings, logMessage, level = L3) => {
   if (level != OFF && process.env.LOG_LEVEL != OFF) {
      const LOG_LEVEL = process.env.LOG_LEVEL

      if (
         (isNaN(LOG_LEVEL) && LOG_LEVEL === level) ||
         process.env.LOG_LEVEL >= level
      ) {
         !logSettings
            ? console.log('%s: %s', new Date().toLocaleTimeString(), logMessage)
            : console.log(
                 '%s: %s, %s: %s',
                 new Date().toLocaleTimeString(),
                 logSettings.fileName ?? 'NA',
                 logSettings.functionName ?? 'NA',
                 logMessage,
              )
      }
   }
}

const cleanSpaces = data => {
   return
}

const validateVars = (logLocal, logLevel, varNamesIn, vars) => {
   if (varNamesIn && varNamesIn != '' && vars && vars.length > 0) {
      varNamesClean = varNamesIn.replace(/\s/g, '')
      varNames = varNamesClean.split(',')
      if (varNames.length != vars.length) {
         LogThis(
            logLocal,
            `Var names count does not match vars count varNamesIn=${varNamesIn}; varNames=${varNames}; vars=${j(
               vars,
            )}`,
            logLevel,
         )
         throw new Error(`Var names count does not match vars count`)
      }
   } else {
      LogThis(
         logLocal,
         `varNamesIn or vars is empty varNamesIn=${varNamesIn}; vars=${j(
            args,
         )}`,
         logLevel,
      )
      throw new Error(`varNamesIn or vars is empty`)
   }
   return varNames
}

/**
 * - LogVars function to log one or more variables at once with names
 * @param {*} log - LoggerSettings object same as LogThis
 * @param {*} level - Level of logging for this log message
 * @param {*} msg - Log message
 * @param {*} varNamesIn - String comma separated list of variable names
 * @param  {...any} vars - The variables themselves
 */
const LogVars = (log, msg, level, varNamesIn, ...vars) => {
   const logLocal = new LoggerSettings(srcFileName, 'LogVars')

   const varMap = {}

   let varNames = validateVars(log, level, varNamesIn, vars)

   for (let i = 0; i < varNames.length; i++) {
      varMap[varNames[i]] = vars[i]
   }
   LogThis(log, `${msg}: vars=${j(varMap)}`, level)
}

/**
 * Function that filters log messages for multipe variables, will show message only when filterBy variable matches with the filterValue.
 * @param {*} log - LogSettings value to specify source file and function name.
 * @param {*} msg - Text message to displayin the log
 * @param {*} filterBy - Variable to filter the log messages.
 * @param {*} filterValue - Log messages will be logged when filterBy variable value matches with filterValue.
 * @param {*} level - Log level when when this log message will show up, default is L0.
 * @param {*} varNamesIn - String comma separated list of how you want the vars elements to be named, position should match the position of the vars elements.
 * @param  {...any} vars - List of variables to display, position should match with the position in varNamesIn
 */
const LogVarsFilter = (
   log,
   msg,
   filterBy,
   filterValue,
   level,
   varNamesIn,
   ...vars
) => {
   const logLocal = new LoggerSettings('Logger.js', 'LogVarsFilter')

   LogThis(
      logLocal,
      `filterBy=${filterBy}; filterValue=${filterValue}; condition=${
         filterBy == filterValue
      }`,
   )
   if (filterBy == filterValue) {
      LogVars(log, msg, level, varNamesIn, ...vars)
   }
}

/**
 * Function that filters log messages for single message, will show message only when filterBy variable matches with the filterValue.
 * @param {*} log - LogSettings value to specify source file and function name.
 * @param {*} msg - Text message to displayin the log
 * @param {*} filterBy - Variable to filter the log messages.
 * @param {*} filterValue - Log messages will be logged when filterBy variable value matches with filterValue.
 * @param {*} level - Log level when when this log message will show up, default is L0.
 */
const LogThisFilter = (log, msg, filterBy, filterValue, level = L0) => {
   if (filterBy == filterValue) {
      LogThis(log, msg, level)
   }
}

const LogThisLegacy = (logSettings = null, logMessage) => {
   if (process.env.LOG_LEVEL >= 1) {
      !logSettings
         ? console.log('%s: %s', new Date().toLocaleTimeString(), logMessage)
         : console.log(
              '%s: %s, %s: %s',
              new Date().toLocaleTimeString(),
              logSettings.sourceFilename,
              logSettings.sourceFunction,
              logMessage,
           )
   }
}
/**
 *
 * @param {*} dataToCheck - could be an array, object, string or number, it will check if it contains data.
 * @returns - true if the value has data, false otherwise.
 */
const HasData = dataToCheck => {
   if (
      !(
         dataToCheck &&
         ((Array.isArray(dataToCheck) && dataToCheck.length > 0) ||
            (typeof dataToCheck === 'string' && dataToCheck != '') ||
            (typeof dataToCheck === 'number' && Number.isFinite(dataToCheck)) ||
            typeof dataToCheck === 'object')
      )
   ) {
      return false
   }
   return true
}

/**
 * Throws an exception with the message and log settings provided if the dataToCheck variable does not have data.
 * @param {*} dataToCheck
 * @param {*} logMessage
 * @param {*} logSettings - Same as LoggerSettings used for LogThis function
 */
const HasDataException = (dataToCheck, logMessage, logSettings) => {
   if (!HasData(dataToCheck)) {
      //LogThis(logSettings, errorMessage, L0)
      throw new Error(
         `${new Date().toLocaleTimeString()} ${logSettings?.fileName ?? 'NA'} ${
            logSettings?.functionName ?? 'NA'
         } ${logMessage}`,
      )
   }
}

const HasDataMultipeEx = (logLocal, varNamesIn, ...vars) => {
   const varNames = validateVars(logLocal, L0, varNamesIn, vars)
   for (let i = 0; i < varNames.length; i++) {
      HasDataException(
         vars[i],
         `${new Date().toLocaleTimeString()} ${logLocal.fileName ?? 'NA'} ${
            logLocal.functionName ?? 'NA'
         } the variable ${varName[i]} is empty`,
         logLocal,
      )
   }
}

const LogDebugSection = (debugSectionNumber = process.env.LOG_LEVEL) => {
   process.env.LOG_LEVEL = debugSectionNumber
}

module.exports = {
   LogThis,
   LogThisFilter,
   LogVars,
   LogVarsFilter,
   HasData,
   HasDataException,
   HasDataMultipeEx,
   LogThisLegacy,
   initLogSettings,
   LoggerSettings,
   LogDebugSection,
   j,
   OFF,
   L0,
   L1,
   L2,
   L3,
}
