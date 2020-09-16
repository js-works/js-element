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

  alias['js-elements$'] = path.resolve(__dirname, '../src/main/js-elements.ts')
  alias['js-elements/hooks$'] = path.resolve(
    __dirname,
    '../src/main/js-elements-hooks.ts'
  )

  config.resolve.alias = alias
  config.resolve.extensions.push('.ts', '.tsx')

  return config
}
