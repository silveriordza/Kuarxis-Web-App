/** @format */

const formatDate = inputDate => {
   const date = new Date(inputDate)

   const year = date.getFullYear()
   const month = (date.getMonth() + 1).toString().padStart(2, '0')
   const day = date.getDate().toString().padStart(2, '0')
   const hours = date.getHours().toString().padStart(2, '0')
   const minutes = date.getMinutes().toString().padStart(2, '0')

   return `${year}-${month}-${day} ${hours}:${minutes}`
}

const validateHasData = (log, dataToCheck, errorMessage) => {
   if (
      !(
         dataToCheck &&
         ((Array.isArray(dataToCheck) && dataToCheck.length > 0) ||
            typeof dataToCheck == 'object')
      )
   ) {
      throw new Error(errorMessage)
   }
}

const addDecimals = num => {
   return (Math.round(num * 100) / 100).toFixed(2)
}

const applyStringCriteriaToValue = (criteria, value) => {
   //const functionName = 'applyStringCriteriaToValue'

   //const log = new LoggerSettings('Functions.js', 'applyStringCriteriaToValue')

   const parseCriteria = criteria.split(' ')
   let newValue = parseInt(value)
   if (typeof newValue != 'number' || newValue == null || isNaN(newValue)) {
      newValue = 0
   }
   //LogThis(log, `parseCriteria=${JSON.stringify(parseCriteria)}`, L3)
   switch (parseCriteria[0]) {
      case '>':
         if (newValue > parseCriteria[1]) {
            return parseCriteria[3]
         } else {
            return parseCriteria[5]
         }
      case '==':
         if (newValue == parseCriteria[1]) {
            //   LogThis(
            //       log,
            //       `TRUE Criteria newValue=${newValue}==${parseCriteria[1]}=>${parseCriteria[3]}`,
            //       L3,
            //    )
            return parseCriteria[3]
         } else {
            // LogThis(
            //    log,
            //    `FALSE Criteria newValue=${newValue}==${parseCriteria[1]}=>=>${parseCriteria[5]}`,
            //    L3,
            // )
            return parseCriteria[5]
         }
      default:
         // LogThis(
         //    log,
         //    `Criteria must start with > : criteria=${criteria}; value=${value}`,
         //    L0,
         // )
         throw new Error(
            `Criteria must start with > : criteria=${criteria}; value=${value}`,
         )
   }
}

const addPropertyValueInArray = (objectsList, fieldNameToAdd, value) => {
   objectsList.forEach(object => (object[fieldNameToAdd] = value))
}

const addPropertyMatchingValueInArray = (
   objectsList,
   fieldNameToAdd,
   matchingField,
   externalIdField,
   matchingValueArray,
) => {
   console.log(`start again`)
   objectsList.forEach(object => {
      let idFound = matchingValueArray.find(matchingValue => {
         // console.log(
         //    `${object[matchingField]}; ${matchingValue[matchingField]} ;${
         //       object['fieldName']
         //    }; condition: ${
         //       object[matchingField].toLowerCase() ===
         //       matchingValue[matchingField].toLowerCase()
         //    }`,
         // )
         return (
            object[matchingField].toLowerCase() ===
            matchingValue[matchingField].toLowerCase()
         )
      })
      //if (idFound) {
      console.log(
         `object=${JSON.stringify(object)}; idFound=${JSON.stringify(idFound)}`,
      )
      object[fieldNameToAdd] = idFound[externalIdField]
      //}
   })
}

function getValueByPath(obj, path) {
   const keys = path.split('.')
   let currentObj = obj

   for (const key of keys) {
      if (currentObj && typeof currentObj === 'object' && key in currentObj) {
         currentObj = currentObj[key]
      } else {
         // Property not found, return a default value or handle the case as needed
         return undefined
      }
   }

   return currentObj
}

function getCloneObjectExceptionFieldsList(exceptingFieldsList) {
   const finalList = ['createdAt', 'updatedAt', '__v', ...exceptingFieldsList]
   return finalList
}
//This function will take a javascript object and copy all its attributes and values into a new object. This function is useful because there is not an out of the box function in javascript that can copy an object that has attributes with a level deeper than 1, by level we mean the attribues hierarchy and having embbeded attributes over embbedded attributes.
//Note that this function will not copy or clone the MongoDB fields createdAt, updatedAt and __v, because those introduce noise when processing the Survey elements.
function cloneObject(
   object,
   exceptingFieldsList = ['createdAt', 'updatedAt', '__v'],
) {
   if (object === null || typeof object !== 'object') {
      // Base case: return primitive values and null as is
      return object
   }

   if (Array.isArray(object)) {
      // If the object is an array, recursively copy its elements
      return object.map(item => cloneObject(item))
   }

   // If the object is a plain object, recursively copy its properties
   const clonedObject = {}
   for (const key in object) {
      if (object.hasOwnProperty(key)) {
         //if (key != 'createdAt' && key != 'updatedAt' && key != '__v') {
         if (!exceptingFieldsList.includes(key)) {
            clonedObject[key] = cloneObject(object[key])
         } else {
            cloneObject(object[key])
         }
      }
   }

   return clonedObject
}

function insertValueInNestedObjectPath(paths, nestedObject, valueToInsert) {
   if (paths.length == 1) {
      nestedObject[paths.shift()] = valueToInsert
      return nestedObject
   }

   let path = paths.shift()
   nestedObject[path] = {}

   insertValueInNestedObjectPath(paths, nestedObject[path], valueToInsert)
}

function insertValueInObjectPath(pathWithDots, nestedObject, valueToInsert) {
   let paths = pathWithDots.split('.')
   insertValueInNestedObjectPath(paths, nestedObject, valueToInsert)
}

module.exports = {
   formatDate,
   addDecimals,
   applyStringCriteriaToValue,
   validateHasData,
   addPropertyValueInArray,
   addPropertyMatchingValueInArray,
   cloneObject,
   getCloneObjectExceptionFieldsList,
   insertValueInNestedObjectPath,
   insertValueInObjectPath,
}
