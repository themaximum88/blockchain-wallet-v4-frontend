module.exports = (api, baseDirectory = `.`) => {
  // api isn't set when called from Webpack.
  if (api) {
    api.cache.forever()
  }

  const babelPlugins = [
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-object-rest-spread',
    'babel-plugin-styled-components',
    [
      'module-resolver',
      {
        root: [`${baseDirectory}/src`],
        alias: { data: `${baseDirectory}/src/data` }
      }
    ]
  ]

  return {
    presets: ['@babel/preset-env', '@babel/preset-react'],
    plugins: babelPlugins.concat([
      [
        'react-intl',
        { messagesDir: `${baseDirectory}/build/extractedMessages` }
      ]
    ]),
    ignore: [],
    env: {
      production: {
        presets: [
          ['@babel/preset-env', { modules: false }],
          '@babel/preset-react'
        ],
        plugins: babelPlugins.concat([
          [
            'react-intl',
            { messagesDir: `${baseDirectory}/build/extractedMessages` }
          ]
        ])
      },
      development: {
        presets: [
          ['@babel/preset-env', { modules: false }],
          '@babel/preset-react'
        ],
        plugins: babelPlugins.concat('react-hot-loader/babel')
      }
    }
  }
}
