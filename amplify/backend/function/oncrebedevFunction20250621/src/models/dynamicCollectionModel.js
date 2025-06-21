/** @format */

let mongoose = require("mongoose");

const dynamicCollectionSchema = mongoose.Schema({
  collectionName: {
    type: String,
    required: true,
    unique: true,
  },
  schemaDefinition: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
});

const DynamicCollection = mongoose.model(
  "DynamicCollection",
  dynamicCollectionSchema
);

module.exports = { DynamicCollection };
