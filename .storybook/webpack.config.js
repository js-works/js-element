const path = require('path')

module.exports = ({ config }) => {
  config.module.rules.push({
    test: /\.(ts|tsx)$/,

    use: [
      {
        loader: require.resolve('awesome-typescript-loader')
      }
    ]
  })

  const alias = (config.resolve && config.resolve.alias) || {}

  alias['js-element$'] = path.resolve(__dirname, '../src/main/js-element.ts')
  alias['js-element/hooks$'] = path.resolve(
    __dirname,
    '../src/main/js-element-hooks.ts'
  )
  alias['js-element/utils$'] = path.resolve(
    __dirname,
    '../src/main/js-element-utils.ts'
  )
  config.resolve.alias = alias
  config.resolve.extensions.push('.ts', '.tsx')

  return config
}
