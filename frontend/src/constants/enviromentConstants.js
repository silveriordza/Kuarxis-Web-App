/** @format */

const LOCAL = 'LOCAL'
const ONCARE_LOCAL = 'ONCARE_LOCAL'
const ONCARE_DEV = 'ONCARE_DEV'
const ONCARE_RED = 'ONCARE_RED'
const ONCARE_QA = 'ONCARE_QA'
const ARTPIXANDEV = 'ARTPIXANDEV'
const ARTPIXANPROD = 'ARTPIXANPROD'
const ENVIRONMENT = ONCARE_DEV

// LOCALHOST DEV VARIABLES

const OFF = -1
const L0 = 0
const L1 = 1
const L2 = 2
const L3 = 3

const local_debug_level = L3
const dev_debug_level = L3
const red_debug_level = L0
const qa_debug_level = L0
const artpixanprod_debug_level = OFF
const LOCAL_CURRENT_VERSION = `v1.0.8.3-2025-06-21-15:03`

let V_LOG_LEVEL = null
let V_CURRENT_VERSION = null
let V_BACKEND_ENDPOINT = null
let V_KUARSIS_PUBLIC_STATIC_FOLDER = null
// let V_KUARSIS_PUBLIC_STATIC_IMG_FOLDER = null
// let V_KUARSIS_PUBLIC_STATIC_MODELS_FOLDER = null
let V_KUARSIS_BANNER_MAIN_LOGO = null
let V_KUARSIS_PUBLIC_BUCKET_URL = null
let V_KUARSIS_DB_SURVEY_ANSWERS_BATCH_SIZE = 200

switch (ENVIRONMENT) {
   case LOCAL:
      //CONSTANTS FOR LOCAL DEVELOPMENT ENVIRONMENT
      V_LOG_LEVEL = local_debug_level
      V_CURRENT_VERSION = LOCAL_CURRENT_VERSION
      V_BACKEND_ENDPOINT = 'http://localhost:5000'
      V_KUARSIS_PUBLIC_STATIC_FOLDER = 'http://localhost:3000/images'
      V_KUARSIS_BANNER_MAIN_LOGO = '/ArtPixanLogo256px.png'
      V_KUARSIS_PUBLIC_BUCKET_URL =
         'https://kuarsis-products-s3-public-dev.s3.amazonaws.com/'

      break
   case ONCARE_LOCAL:
      //CONSTANTS FOR LOCAL DEVELOPMENT ENVIRONMENT
      V_LOG_LEVEL = local_debug_level
      V_CURRENT_VERSION = LOCAL_CURRENT_VERSION
      V_BACKEND_ENDPOINT = 'http://localhost:5000'
      V_KUARSIS_PUBLIC_STATIC_FOLDER = 'http://localhost:3000/images'
      V_KUARSIS_BANNER_MAIN_LOGO = '/OnCareLogo256px.png'
      V_KUARSIS_PUBLIC_BUCKET_URL =
         'https://kuarsis-products-s3-public-dev.s3.amazonaws.com/'
      break
   case ONCARE_DEV:
      //CONSTANTS FOR ONCAREDEV.KUARXIS.COM (DEV) ENVIRONMENT

      V_LOG_LEVEL = dev_debug_level
      V_CURRENT_VERSION = LOCAL_CURRENT_VERSION
      V_BACKEND_ENDPOINT =
         'https://mosr0biyrb.execute-api.us-east-1.amazonaws.com/oncbedev'
      V_KUARSIS_PUBLIC_STATIC_FOLDER = 'https://oncaredev.kuarxis.com/images'
      V_KUARSIS_BANNER_MAIN_LOGO = 'OnCareLogo256px.png'
      V_KUARSIS_PUBLIC_BUCKET_URL =
         'https://kuarsis-products-s3-public-dev.s3.amazonaws.com/'
      break
   case ONCARE_RED:
      //CONSTANTS FOR ONCAREDEV.KUARXIS.COM (DEV) ENVIRONMENT

      V_LOG_LEVEL = red_debug_level
      V_CURRENT_VERSION = LOCAL_CURRENT_VERSION
      V_BACKEND_ENDPOINT =
         'https://qfainlabh5.execute-api.us-east-1.amazonaws.com/oncrebered'
      V_KUARSIS_PUBLIC_STATIC_FOLDER = 'https://oncarered.kuarxis.com/images'
      V_KUARSIS_BANNER_MAIN_LOGO = 'OnCareLogo256px.png'
      V_KUARSIS_PUBLIC_BUCKET_URL =
         'https://kuarsis-products-s3-public-dev.s3.amazonaws.com/'
      break
   case ONCARE_QA:
      //CONSTANTS FOR ONCAREQA.KUARXIS.COM (DEV) ENVIRONMENT
      V_LOG_LEVEL = qa_debug_level
      V_CURRENT_VERSION = LOCAL_CURRENT_VERSION
      V_BACKEND_ENDPOINT =
         'https://gnhlcq59x6.execute-api.us-east-1.amazonaws.com/oncrebeqa'
      V_KUARSIS_PUBLIC_STATIC_FOLDER = 'https://oncareqa.kuarxis.com/images'
      V_KUARSIS_BANNER_MAIN_LOGO = 'OnCareLogo256px.png'
      V_KUARSIS_PUBLIC_BUCKET_URL =
         'https://kuarsis-products-s3-public-dev.s3.amazonaws.com/'
      break
   case ARTPIXANDEV:
      //CONSTANTS FOR ARTPIXANDEV.KUARXIS.COM (DEV) ENVIRONMENT

      V_LOG_LEVEL = dev_debug_level
      V_CURRENT_VERSION = `v1.0.0.7-2023-08-29-20:22`
      V_BACKEND_ENDPOINT =
         'https://o3dzma966j.execute-api.us-east-1.amazonaws.com/kuarxbedev'
      V_KUARSIS_PUBLIC_STATIC_FOLDER = 'https://artpixandev.kuarxis.com/images'
      V_KUARSIS_BANNER_MAIN_LOGO = 'ArtPixanLogo256px.png'
      V_KUARSIS_PUBLIC_BUCKET_URL =
         'https://kuarsis-products-s3-public-dev.s3.amazonaws.com/'
      break
   case ARTPIXANPROD:
      //CONSTANTS FOR ARTPIXAN.KUARXIS.COM (PROD) ENVIRONMENT

      V_LOG_LEVEL = artpixanprod_debug_level
      V_BACKEND_ENDPOINT =
         'https://we568vitke.execute-api.us-east-1.amazonaws.com/kuarxbeprd'
      V_KUARSIS_PUBLIC_STATIC_FOLDER = 'https://artpixan.kuarxis.com/images'
      V_KUARSIS_BANNER_MAIN_LOGO = 'ArtPixanLogo256px.png'
      V_KUARSIS_PUBLIC_BUCKET_URL =
         'https://kuarsis-products-s3-public.s3.amazonaws.com'
      break
   default:
      break
}

export const LOG_LEVEL = V_LOG_LEVEL
export const CURRENT_VERSION = V_CURRENT_VERSION
export const BACKEND_ENDPOINT = V_BACKEND_ENDPOINT
export const KUARSIS_PUBLIC_STATIC_FOLDER = V_KUARSIS_PUBLIC_STATIC_FOLDER
// const KUARSIS_PUBLIC_STATIC_IMG_FOLDER = V_KUARSIS_PUBLIC_STATIC_IMG_FOLDER
// const KUARSIS_PUBLIC_STATIC_MODELS_FOLDER = V_KUARSIS_PUBLIC_STATIC_MODELS_FOLDER
export const KUARSIS_BANNER_MAIN_LOGO = V_KUARSIS_BANNER_MAIN_LOGO
export const KUARSIS_PUBLIC_BUCKET_URL = V_KUARSIS_PUBLIC_BUCKET_URL
export const KUARSIS_DB_SURVEY_ANSWERS_BATCH_SIZE =
   V_KUARSIS_DB_SURVEY_ANSWERS_BATCH_SIZE

//KUARXIS BROWSER CACHE CONSTANTS (FOR DEXIE PACKAGE)
export const KUARXIS_BROWSER_CACHE_DEXIE_DB_NAME =
   'KUARXIS_SURVEY_SYTEM_DATABASE'
