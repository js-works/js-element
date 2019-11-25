require('dotenv').config()

module.exports = async ({ config }) => {
  //if (process.env.DISABLE_HMR === 'true') {
    //config.entry = config.entry.filter(singleEntry => !singleEntry.includes('webpack-hot-middleware'))
  //}

  return config
}
