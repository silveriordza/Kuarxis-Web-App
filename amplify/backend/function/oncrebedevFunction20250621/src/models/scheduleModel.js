let mongoose = require('mongoose')

const scheduleSchema = mongoose.Schema(
  {
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Product',
    },
    scheduleData: {
        type: mongoose.Schema.Types.Mixed
    },
    paymentMethod: {
      type: String,
      required: false,
    },
    paymentResult: {
      id: { type: String },
      status: { type: String },
      update_time: { type: String },
      email_address: { type: String },
    },
    itemsPrice:  {
      type: Number,
      required: false,
      default: 0.0,
    },
    taxPrice: {
      type: Number,
      required: false,
      default: 0.0,
    },
    totalPrice: {
      type: Number,
      required: false,
      default: 0.0,
    },
    isPaid: {
      type: Boolean,
      required: false,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    isServiceProvided: {
      type: Boolean,
      required: false,
      default: false,
    },
    serviceProvidedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
)

const Schedule = mongoose.model('Schedule', scheduleSchema)


const providerBlockedScheduleSchema = mongoose.Schema(
  {
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    scheduleData: {
        type: mongoose.Schema.Types.Mixed
    },
  },
  {
    timestamps: true,
  }
)

const ProviderBlockedSchedule = mongoose.model('ProviderBlockedSchedule', providerBlockedScheduleSchema)

module.exports = {Schedule, ProviderBlockedSchedule}
