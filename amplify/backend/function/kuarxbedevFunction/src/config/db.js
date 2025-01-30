/** @format */

let mongoose = require('mongoose')
let colors = require('colors')
let { LogThis, LoggerSettings, L0 } = require('../utils/Logger')
const connectDB = async () => {
   const log = new LoggerSettings('db.js', 'connectDB')

   LogThis(
      log,
      `MongoDB connecting to URI process.env.MONGO_URI=${process.env.MONGO_URI}`,
      L0,
   )
   try {
      const conn = await mongoose.connect(process.env.MONGO_URI, {
         useUnifiedTopology: true,
         useNewUrlParser: true,
      })

      //the cyan underline, comes from the colors library that got installed with npm i colors
      LogThis(log, `MongoDB Connected: ${conn.connection.host}`, L0)
   } catch (error) {
      console.error(`Error: ${error.message}`.red.underline.bold)
      process.exit(1) //Exit with failure.
   }
}
module.exports = connectDB
