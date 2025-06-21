const OFF = -1
const L0 = 0
const L1 = 1
const L2 = 2
const L3 = 3

        
class LogManager {
    constructor(fileName = '', functionName = ''){
        this.logSettings = {
            fileName : fileName,
        functionName: functionName
    }
    }

 j ( value)  {
   return JSON.stringify(value, null, 1)
}



setLogSettings(fileName = '', functionName = '') {
   this.logSettings.fileName = fileName
   this.logSettings.functionName = functionName
}

setFunctionName(functionName = '') {
    this.logSettings.functionName = functionName
 }

LogThis  (logMessage, level = L3)  {
   if (level != OFF && process.env.LOG_LEVEL != OFF) {
      const LOG_LEVEL = process.env.LOG_LEVEL

      if (
         (isNaN(LOG_LEVEL) && LOG_LEVEL === level) ||
         process.env.LOG_LEVEL >= level
      ) {
         !this.logSettings
            ? console.log('%s: %s', new Date().toLocaleTimeString(), logMessage)
            : console.log(
                 '%s: %s, %s: %s',
                 new Date().toLocaleTimeString(),
                 this.logSettings.fileName ?? 'NA',
                 this.logSettings.functionName ?? 'NA',
                 logMessage,
              ) 
      }
   }
}

validateVars (logLevel, varNamesIn, vars)  {
   let varNames = null
   if (varNamesIn && varNamesIn != '' && vars && vars.length > 0) {
      const varNamesClean = varNamesIn.replace(/\s/g, '')
      varNames = varNamesClean.split(',')
      if (varNames.length != vars.length) {
         LogThis(
            `Var names count does not match vars count varNamesIn=${varNamesIn}; varNames=${varNames}; vars=${j(
               vars,
            )}`,
            logLevel,
         )
         throw new Error(`Var names count does not match vars count`)
      }
   } else {
      LogThis(
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
 LogVars  (msg, level, varNamesIn, ...vars)  {
   //const logLocal = new LoggerSettings(srcFileName, 'LogVars')

   const varMap = {}

   let varNames = this.validateVars(level, varNamesIn, vars)

   for (let i = 0; i < varNames.length; i++) {
      varMap[varNames[i]] = vars[i]
   }
   this.LogThis(`${msg}: vars=${this.j(varMap)}`, level)
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
 LogVarsFilter (
   msg,
   filterBy,
   filterValue,
   level,
   varNamesIn,
   ...vars
)  {

   this.LogThis(
      `filterBy=${filterBy}; filterValue=${filterValue}; condition=${
         filterBy == filterValue
      }`,
   )
   if (filterBy == filterValue) {
      this.LogVars(msg, level, varNamesIn, ...vars)
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
 LogThisFilter (msg, filterBy, filterValue, level = L0) {
   if (filterBy == filterValue) {
      this.LogThis(msg, level)
   }
}

/**
 *
 * @param {*} dataToCheck - could be an array, object, string or number, it will check if it contains data.
 * @returns - true if the value has data, false otherwise.
 */
 HasData (dataToCheck)  {
   const typeOfData = typeof dataToCheck
   if ( dataToCheck &&
         ((Array.isArray(dataToCheck) && dataToCheck.length > 0) ||
            ((dataToCheck instanceof Map) && (dataToCheck.size) > 0) ||
            (typeOfData === 'string' && dataToCheck != '') ||
            (typeOfData === 'number' && Number.isFinite(dataToCheck)) ||
            (typeOfData === 'bigint' && Number.isFinite(dataToCheck)) ||
            typeOfData === 'function' ||
            typeOfData === 'boolean' ||
            typeOfData === 'object')
      
   ) {
      return true
   }
   return false
}

/**
 * Throws an exception with the message and log settings provided if the dataToCheck variable does not have data.
 * @param {*} dataToCheck
 * @param {*} logMessage
 */
 HasDataException (dataToCheck, logMessage='')  {
   if (!this.HasData(dataToCheck)) {
      throw new Error(
         `${new Date().toLocaleTimeString()} ${this.logSettings?.fileName ?? 'NA'} ${
            this.logSettings?.functionName ?? 'NA'
         } ${logMessage}`,
      )
   }
}

 HasDataMultipeEx (varNamesIn, ...vars) {
   const varNames = this.validateVars(L0, varNamesIn, vars)
   for (let i = 0; i < varNames.length; i++) {
      this.HasDataException(
         vars[i],
         `${new Date().toLocaleTimeString()} ${this.logSettings.fileName ?? 'NA'} ${
            this.logSettings.functionName ?? 'NA'
         } the variable ${varNames[i]} is empty`
      )
   }
}

 SetDebugSection(debugSectionNumber = process.env.LOG_LEVEL)  {
   process.env.LOG_LEVEL = debugSectionNumber
}
}

module.exports = {
    LogManager,
    OFF,
    L0,
    L1,
    L2,
    L3,
 }