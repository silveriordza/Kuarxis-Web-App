let mongoose = require('mongoose')
let bcrypt = require('bcryptjs')

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      required: true,
      default: false,
    },
    hasSurveyOutputAccess: {
      type: Boolean,
      required: true,
      default: false,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    address: {
      type: String,
      required: true,
    },
    internalNumber: {
      type: String,
      required: false,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    postalCode: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    
  },
  {
    timestamps: true,
  }
)

// Method in schema used to confirm if password matches using bcrypt
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

//This is the way to create a middleware in Mongoose, in this case we are using it to encrypt the password only when the password is modified and before saving it into the database.
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next()
  }

  //This is the way to encrypt the password with bcrypt first you get the salt, and then call the bcrypt hash with the password and the salt to encrypt it.
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

const User = mongoose.model('User', userSchema)

module.exports = User
