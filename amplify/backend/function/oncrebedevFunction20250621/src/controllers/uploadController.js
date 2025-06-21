let asyncHandler = require('express-async-handler')
let path = require('node:path')
let formidable = require('formidable')
let awsS3Services = require('../awsServices/awsS3Services')

// @desc    Create new order
// @route   POST /upload
// @access  Private
const uploadProduct = asyncHandler(async (req, res) => {
  const formData = await readFormDataFromRequest(req)
  try {
    console.log('uploadController: formData')
    var uploadData = await awsS3Services.uploadKuarsisProductToS3(formData.file)
    console.log('uploadcontroller: after uploadKuarsisProductToS3')
    res.status(200).send(uploadData.Key)
  } catch (ex) {
    console.log(ex)
    res.status(404)
    throw new Error('File not uploaded')
  }
})

async function readFormDataFromRequest(req) {
  return new Promise((resolve) => {
    const dataObj = {}
    var form = new formidable.IncomingForm()
    form.parse(req)
    form.on('file', (name, file) => {
      dataObj.name = name
      dataObj.file = file
    })

    form.on('end', () => {
      resolve(dataObj)
    })
  })
}

const listProducts = asyncHandler(async (req, res) => {
  try {
    var data = await awsS3Services.listKuarsisProducts()
    res.status(200).json(data)
  } catch (ex) {
    console.log(ex)
    res.status(404)
    throw new Error('Error reading bucket')
  }
})

const getUploadPublicPrivatePresignedURL = asyncHandler(async (req, res) => {
  try {
    console.log('uploadController.getPublicURL START')
    // const { key } = req.params
    // console.log(key)
    const response = await awsS3Services.getUploadPublicPrivatePresignedURL()

    console.log('uploadController.getPublicURL response: ', response)
    res.status(201).json({
      preSignedPublicURL: response.preSignedPublicURL,
      preSignedPrivateURL: response.preSignedPrivateURL,
      fileS3Name: response.fileS3Name,
    })
  } catch (ex) {
    console.log('uploadController.getPublicURL Exception: ', ex)
    req.send('')
  }
})
module.exports = {
  uploadProduct,
  listProducts,
  getUploadPublicPrivatePresignedURL,
}
