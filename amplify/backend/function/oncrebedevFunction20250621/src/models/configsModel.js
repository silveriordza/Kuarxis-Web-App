let mongoose = require('mongoose')

const configsSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
  }
)

const Configs = mongoose.model('Configs', configsSchema)

module.exports = Configs
