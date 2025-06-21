/** @format */

const { j } = require('../utils/Logger')
const {
   saveDynamicModelToDB,
   convertDataTypeToMongoSchemaDataType,
} = require('../utils/mongoDbHelper')
const { LogManager, L3 } = require('./LogManager')
const mongoose = require('mongoose')
const Schema = mongoose.Schema

class MongoDBManager {
   constructor(collection) {
      this.collection = mongoose.model(collection)
      this.log = new LogManager('MongoDBManager.js', 'constructor')
   }

   isDeletedEx(result, msg) {
      if (!result || !result.acknowledged) {
         throw new Error(msg)
      }
   }

   isDeletedCheck(result, msg) {
      this.log.setFunctionName('isDeletedCheck')
      if (!result || !result.acknowledged) {
         this.log.LogThis(msg, L3)
         return false
      }
   }

   async saveWithEx() {
      try {
         this.log.setFunctionName('saveWithEx')
         const savedDocument = await this.collection.save()
         this.log.HasDataException(
            savedDocument,
            `Couldn't save ${this.collection.modelName}`,
         )
         return savedDocument
      } catch (error) {
         throw new Error(
            `Couldn't save document ${this.collection.modelName}; ${j(
               this.collection,
            )}; ${j(this.log.logSettings)}; error=${error.message}`,
         )
      }
   }

   async deleteManyWithCheck(filterByField, identifiersList) {
      this.log.setFunctionName('deleteManyWithCheck')
      const filter = {}
      filter[filterByField] = { $exists: true, $in: identifiersList }

      const result = await this.collection.deleteMany(filter)
      this.isDeletedEx(
         result,
         `Error deleting documents from collection ${this.collection.modelName} matching by field ${filterByField} for the values list ${identifiersList}`,
      )
      return result
   }
   validateResultsSavedEx(collectionList, results) {
      if (collectionList.length != results.length) {
         throw new Error(
            `Not all values could be saved for collectionList: ${j(
               collecitonList,
            )}, results:${j(results)}`,
         )
      }
   }

   async insertMany(collectionList) {
      this.log.HasDataException(collectionList, `Collection List is empty`)

      const results = await this.collection.insertMany(collectionList)

      this.validateResultsSavedEx(collectionList, results)

      return results
   }

   useCollection(collection) {
      this.collection = mongoose.model(collection.modelName)
      this.listOfObjectIdFieldsInModel = null
      return this.collection
   }
   useCollectionByStringName(collectionName) {
      this.collection = mongoose.model(collectionName)
      this.listOfObjectIdFieldsInModel = null
      return this.collection
   }

   async createDynamicCollectionFromFields(modelName, modelFields) {
      const collections = await mongoose.connection.db
         .listCollections({ name: modelName })
         .toArray()

      const collInfo = collections.find(
         collection => collection.name === modelName,
      )
      if (collInfo) {
         this.log.LogThis(`dropping modelName`, L3)
         let surveyOutputCollection = await mongoose.connection.collection(
            modelName,
         )

         await surveyOutputCollection.drop()

         this.log.LogThis(`dropped modelName`, L3)

         delete mongoose.models[modelName]
         this.log.LogThis(`deleted models`, L3)
      }

      let surveyOutputColumns = {}

      modelFields.forEach(column => {
         this.log.LogThis(
            `output Layout Field column=${JSON.stringify(column)}`,
            L3,
         )
         surveyOutputColumns[column.fieldName] =
            convertDataTypeToMongoSchemaDataType(column.dataType)
      })

      const surveyOutputCollectionSchema = new mongoose.Schema(
         surveyOutputColumns,
      )

      const surveyOutputCollection = mongoose.model(
         modelName,
         surveyOutputCollectionSchema,
      )
      await saveDynamicModelToDB(modelName, surveyOutputColumns)
   }

   /**
    * This function returns an array of all the fields in the model schema that are references to other models, usually ObjectIds
    * @returns An array of all the fields in the model schema that are references to other models, usually ObjectIds
    */
   getListOfObjectIdFieldsInCollection() {
      this.log.HasDataException(
         this.collection?.schema,
         `The collection or the collectionschema are undefined, cannot get list of ObjectId fields from it`,
      )
      const modelSchema = this.collection.schema
      //if(!this.log.HasData(this.listOfObjectIdFieldsInModel)){
      if (!this.log.HasData(this.listOfObjectIdFieldsInModel)) {
         this.listOfObjectIdFieldsInModel = Object.keys(
            modelSchema.paths,
         ).filter(path => {
            const schemaType = modelSchema.paths[path].instance
            return (
               schemaType === 'ObjectID' ||
               (schemaType === 'Array' &&
                  modelSchema.paths[path].caster.instance === 'ObjectID')
            )
         })
      }
      return this.listOfObjectIdFieldsInModel
   }

   /**
    * This function takes a collectionList (mongoose models) which usually have a lot of functions and non trivial values from mongoose, and converts it into plain Javascript objects that are more easily readable. I also converts the ObjectIds into plan strings.
    * @param {*} collectionList The Collection List of mongoose model objects (in an array, usually as retured by the mongoose.find or insertMany functions)
    * @returns The return object is a plan Javascript object without the noise introduced by mongoose, and is usually more readable and manageable.
    */
   leanCollectionList(collectionList) {
      const listOfObjectIdFields = this.getListOfObjectIdFieldsInCollection()
      let leanList = collectionList.map(collection =>
         collection.toObject({
            virtuals: true,
            getters: true,
            //This transform can also be done at the Schema level when the Schema is created you can use a set function with the first parameter set to either `toObject or toJSON', see the mongoose documentation on how to do this, but for now we will keep it here to have better control of when the transform is needed in the code, otherwise mongoose will always apply the transform.
            transform: (collection, field) => {
               if (this.log.HasData(listOfObjectIdFields)) {
                  listOfObjectIdFields.forEach(
                     refField => (field[refField] = field[refField].toString()),
                  )
               }
            },
         }),
      )
      //leanList = j(leanList)
      return leanList
   }

   async findSortedAsc(filter) {
      //this.log.HasDataException(collectionList, `Collection List is empty`)
      this.log.setFunctionName('findSortedAsc')

      const results = await this.collection.find(filter).sort({ position: 1 })

      return results
   }

   async findByFilter(filter) {
      //this.log.HasDataException(collectionList, `Collection List is empty`)
      this.log.setFunctionName('findByFilter')

      const results = await this.collection.find(filter)

      return results
   }
}

module.exports = MongoDBManager
