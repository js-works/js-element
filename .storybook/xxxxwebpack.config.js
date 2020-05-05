module.exports = ({ config }) => {
  config.module.rules.unshift({
    test: /\.(js|jsx)$/,
     exclude: /node_modules/,
     use: ['babel-loader']
  })
console.log(config.module.rules)
  return config
}
