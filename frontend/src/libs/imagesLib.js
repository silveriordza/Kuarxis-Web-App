import html2Canvas from 'html2canvas'
import { LogThis, LoggerSettings, L0, L1, L2, L3, OFF } from '../libs/Logger'

const srcFileName = 'imageLib.js'

export const convert = ({ file, width, height, type, watermarkText }) => {
  console.log(3)
  return new Promise((resolve, reject) => {
    let allow = ['jpg', 'gif', 'bmp', 'png', 'jpeg', 'svg']
    try {
      if (
        file.name &&
        file.name.split('.').reverse()[0] &&
        allow.includes(file.name.split('.').reverse()[0].toLowerCase()) &&
        file.size &&
        file.type
      ) {
        let imageType = type ? type : 'jpeg'
        const imgWidth = width ? width : 500
        const imgHeight = height ? height : 300
        const fileName = file.name

        const img = new Image()
        img.onload = () => {
          const elem = document.createElement('canvas')
          elem.width = imgWidth
          elem.height = imgHeight
          const ctx = elem.getContext('2d')
          ctx.drawImage(img, 0, 0, imgWidth, imgHeight)
          console.log(5)
          ctx.font = 'bold 10px Arial'
          ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'
          ctx.fillText(watermarkText, imgWidth * 0.05, imgHeight * 0.05)
          ctx.fillText(watermarkText, imgWidth * 0.6, imgHeight * 0.05)
          ctx.fillText(watermarkText, imgWidth * 0.3, imgHeight * 0.5)
          ctx.fillText(watermarkText, imgWidth * 0.05, imgHeight * 0.9)
          ctx.fillText(watermarkText, imgWidth * 0.6, imgHeight * 0.9)
          ctx.canvas.toBlob(
            (blob) => {
              const newFile = new File([blob], fileName, {
                type: `image/${imageType.toLowerCase()}`,
                lastModified: Date.now(),
              })
              resolve(newFile)
            },
            'image/jpeg',
            1
          )
        }
        img.src = URL.createObjectURL(file)
      } else {
        reject('File not supported!')
      }
    } catch (error) {
      reject(error)
    }
  })
}

export const convertHtmlElementToImage = async (elementId) => {
 
 const log = new LoggerSettings(srcFileName, 'convertHtmlElementToImage')

 LogThis(log, `Entering`, L3)
LogThis(log, `elementId=${elementId}`, L3)
  let reference = document.getElementById(elementId)
  if (!reference) {
    LogThis(log, `elementId not found`, L3)
     return null
  }
LogThis(log, `elementId Found`, L3)
  const canvas = await html2Canvas(reference)
  LogThis(log, `canvas convertion done`, L3)
  
  const dataUrl = canvas.toDataURL()
  LogThis(log, `dataURL extracted from Canvas`, L3)
  const img = new Image()
  img.src = dataUrl
  LogThis(log, `img.src updated with new Image with URL`, L3)
  return img
  
}


