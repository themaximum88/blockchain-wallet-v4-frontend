// Functions that require sensitive information to perform (e.g., password,
// seed, and sharedKey).  Think of this module as similar to a Hardware Security
// Module.

import BIP39 from 'bip39'
import Bitcoin from 'bitcoinjs-lib'
import * as ed25519 from 'ed25519-hd-key'

import {
  getDefaultHDWallet,
  getMainPassword,
  getSharedKey
} from '../redux/wallet/selectors'

import Core from './core'
import { HDWallet } from '../types'
import { taskToPromise } from '../utils/functional'
import * as crypto from '../walletCrypto'

const core = Core({ BIP39, Bitcoin, crypto, ed25519, taskToPromise })

export default ({ http, rootUrl, store }) => {
  const computeSecondPasswordHash = ({ iterations, password }) => {
    const state = store.getState()
    const sharedKey = getSharedKey(state)
    return core.computeSecondPasswordHash({ iterations, password, sharedKey })
  }

  const credentialsEntropy = ({ guid }) => {
    const state = store.getState()
    const password = getMainPassword(state)
    const sharedKey = getSharedKey(state)
    return core.credentialsEntropy({ guid, password, sharedKey })
  }

  const decryptWithSecondPassword = ({ iterations, password }, cipherText) => {
    const state = store.getState()
    const sharedKey = getSharedKey(state)

    return taskToPromise(
      crypto.decryptSecPass(sharedKey, iterations, password, cipherText)
    )
  }

  const encryptWithSecondPassword = ({ iterations, password }, plaintext) => {
    const state = store.getState()
    const sharedKey = getSharedKey(state)

    return taskToPromise(
      crypto.encryptSecPass(sharedKey, iterations, password, plaintext)
    )
  }

  const getSeed = async secondCredentials => {
    const state = store.getState()
    const cipherText = HDWallet.selectSeedHex(getDefaultHDWallet(state))
    const sharedKey = getSharedKey(state)

    const entropy = await core.decryptEntropy(
      { ...secondCredentials, sharedKey },
      cipherText
    )

    return core.entropyToSeed(entropy)
  }

  const deriveBIP32Key = async (
    { iterations, secondPassword },
    { network, path }
  ) => {
    const seed = await getSeed({ iterations, secondPassword })
    return core.deriveBIP32Key({ network, path, seed })
  }

  const deriveSLIP10ed25519Key = async (
    { iterations, secondPassword },
    { path }
  ) => {
    const seed = await getSeed({ iterations, secondPassword })
    return core.deriveSLIP10ed25519Key({ path, seed })
  }

  const getSettings = guid => {
    const state = store.getState()
    const sharedKey = getSharedKey(state)

    return http.post({
      url: rootUrl,
      endPoint: '/wallet',
      data: { guid, sharedKey, method: 'get-info', format: 'json' }
    })
  }

  const updateSettings = (guid, method, payload, querystring = '') => {
    const state = store.getState()
    const sharedKey = getSharedKey(state)

    return http.post({
      url: rootUrl,
      endPoint: querystring ? `/wallet?${querystring}` : '/wallet',
      data: { guid, sharedKey, method, payload, length: (payload + '').length }
    })
  }

  return {
    computeSecondPasswordHash,
    credentialsEntropy,
    decryptWithSecondPassword,
    encryptWithSecondPassword,
    deriveBIP32Key,
    deriveSLIP10ed25519Key,
    getSettings,
    updateSettings
  }
}
