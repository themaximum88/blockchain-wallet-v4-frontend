import { all, call, delay, fork, put } from 'redux-saga/effects'
import { coreSagasFactory, coreRootSagaFactory } from 'blockchain-wallet-v4/src'
import * as actions from './actions'
import alerts from './alerts/sagaRegister'
import analytics from './analytics/sagaRegister'
import auth from './auth/sagaRegister'
import components from './components/sagaRegister'
import middleware from './middleware/sagaRegister'
import modules from './modules/sagaRegister'
import preferences from './preferences/sagaRegister'
import goals from './goals/sagaRegister'
import router from './router/sagaRegister'
import wallet from './wallet/sagaRegister'
import { tryParseLanguageFromUrl } from 'services/LanguageService'

const logLocation = 'data/rootSaga'

const languageInitSaga = function * ({ imports }) {
  try {
    yield delay(250)
    const lang = tryParseLanguageFromUrl(imports)
    if (lang.language) {
      yield put(actions.preferences.setLanguage(lang.language, false))
      if (lang.cultureCode) {
        yield put(actions.preferences.setCulture(lang.cultureCode))
      }
    }
  } catch (e) {
    yield put(actions.logs.logErrorMessage(logLocation, 'languageInitSaga', e))
  }
}

export default function * rootSaga ({
  api,
  bchSocket,
  btcSocket,
  ethSocket,
  imports,
  ratesSocket,
  networks,
  options,
  securityModule
}) {
  const coreSagas = coreSagasFactory({
    api,
    imports,
    networks,
    options,
    securityModule
  })

  yield all([
    fork(alerts),
    fork(analytics({ api })),
    fork(auth({ api, coreSagas })),
    fork(components({ api, coreSagas, imports, networks, options })),
    fork(modules({ api, coreSagas, imports, networks })),
    fork(preferences({ imports })),
    fork(goals({ api })),
    fork(wallet({ coreSagas })),
    fork(middleware({ api, bchSocket, btcSocket, ethSocket, ratesSocket })),
    fork(coreRootSagaFactory({ api, imports, networks, options })),
    fork(router()),
    call(languageInitSaga, { imports })
  ])
}
