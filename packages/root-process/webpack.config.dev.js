'use strict'

const fs = require(`fs`)
const mockWalletOptions = require('../../config/mocks/wallet-options-v4.json')
const PATHS = require('../../config/paths')

const envConfig = require(PATHS.envConfig + `/${process.env.NODE_ENV}` + '.js')

const sslEnabled = process.env.DISABLE_SSL
  ? false
  : fs.existsSync(PATHS.sslConfig + '/key.pem') &&
    fs.existsSync(PATHS.sslConfig + '/cert.pem')

const port = 8080

const localhostUrl = sslEnabled
  ? `https://localhost:${port}`
  : `http://localhost:${port}`

const optionsHandler = (request, response) => {
  // combine wallet options base with custom environment config
  const domains = {
    root: envConfig.ROOT_URL,
    api: envConfig.API_DOMAIN,
    webSocket: envConfig.WEB_SOCKET_URL,
    walletHelper: envConfig.WALLET_HELPER_DOMAIN,
    veriff: envConfig.VERIFF_URL,
    comWalletApp: envConfig.COM_WALLET_APP,
    comRoot: envConfig.COM_ROOT,
    ledgerSocket: envConfig.LEDGER_SOCKET_URL,
    ledger: localhostUrl + '/ledger', // will trigger reverse proxy
    horizon: envConfig.HORIZON_URL
  }

  if (process.env.NODE_ENV === 'testnet') {
    mockWalletOptions.platforms.web.btc.config.network = 'testnet'
    mockWalletOptions.platforms.web.coinify.config.partnerId = 35
    mockWalletOptions.platforms.web.sfox.config.apiKey =
      '6fbfb80536564af8bbedb7e3be4ec439'
  }

  response.json({ ...mockWalletOptions, domains })
}

module.exports = {
  devServer: {
    before (app) {
      app.get('/Resources/wallet-options-v4.json', optionsHandler)
    },

    contentBase: `./src`,

    // This creates a security vulnerabillity:
    // https://webpack.js.org/configuration/dev-server/#devserverdisablehostcheck
    disableHostCheck: true,

    historyApiFallback: true,
    port
  },
  devtool: 'inline-source-map',
  mode: 'development'
}
