import analytics from './analytics'
import bch from './bch'
import btc from './btc'
import delegate from './delegate'
import eth from './eth'
import kvStore from './kvStore'
import kyc from './kyc'
import lockbox from './lockbox'
import misc from './misc'
import profile from './profile'
import rates from './rates'
import shapeShift from './shapeShift'
import sfox from './sfox'
import trades from './trades'
import wallet from './wallet'
import xlm from './xlm'
import apiAuthorize from './apiAuthorize'

export default ({
  http,
  options,
  getAuthCredentials,
  reauthenticate,
  networks
} = {}) => {
  const authorizedHttp = apiAuthorize(http, getAuthCredentials, reauthenticate)
  const apiUrl = options.domains.api
  const horizonUrl = options.domains.horizon
  const ledgerUrl = options.domains.ledger
  const nabuUrl = `${apiUrl}/nabu-gateway`
  const rootUrl = options.domains.root
  const shapeShiftApiKey = options.platforms.web.shapeshift.config.apiKey

  return {
    ...analytics({ rootUrl, ...http }),
    ...bch({ rootUrl, apiUrl, ...http }),
    ...btc({ rootUrl, apiUrl, ...http }),
    ...delegate({ rootUrl, apiUrl, ...http }),
    ...eth({ rootUrl, apiUrl, ...http }),
    ...kvStore({ apiUrl, networks, ...http }),
    ...kyc({
      nabuUrl,
      authorizedGet: authorizedHttp.get,
      authorizedPost: authorizedHttp.post,
      authorizedPut: authorizedHttp.put,
      ...http
    }),
    ...lockbox({ ledgerUrl, ...http }),
    ...misc({ rootUrl, apiUrl, ...http }),
    ...profile({
      rootUrl,
      nabuUrl,
      authorizedPut: authorizedHttp.put,
      authorizedGet: authorizedHttp.get,
      ...http
    }),
    ...sfox(),
    ...shapeShift({ shapeShiftApiKey, ...http }),
    ...rates({ nabuUrl, ...authorizedHttp }),
    ...trades({ nabuUrl, ...authorizedHttp }),
    ...wallet({ rootUrl, ...http }),
    ...xlm({ apiUrl, horizonUrl, network: networks.xlm, ...http })
  }
}
