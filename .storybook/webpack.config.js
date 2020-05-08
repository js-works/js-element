module.exports = ({ config }) => {
  config.module.rules.push({
    test: /\.(ts|tsx)$/,

    use: [
      {
        loader: require.resolve('awesome-typescript-loader'),
      },
    ],
  })

  //config.resolve.alias.preact = 'preact/debug'
  config.resolve.extensions.push('.ts', '.tsx')

  return config
}
