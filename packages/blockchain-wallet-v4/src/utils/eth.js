import * as Exchange from '../exchange'
import { prop, path } from 'ramda'
import EthHd from 'ethereumjs-wallet/hdkey'
import EthUtil from 'ethereumjs-util'
import BigNumber from 'bignumber.js'

/**
 * @param {string} address - The ethereum address
 */
export const isValidAddress = address => /^0x[a-fA-F0-9]{40}$/.test(address)

/**
 * @param {function} deriveBIP32Key
 * @param {integer} index
 */
export const getPrivateKey = async ({ deriveBIP32Key, index }) => {
  const key = await deriveBIP32Key({
    path: `m/44'/60'/0'/0/${index}`
  })

  return EthHd.fromExtendedKey(key)
    .getWallet()
    .getPrivateKey()
}

// Derivation error using seedHex directly instead of seed derived from mnemonic derived from seedHex
export const getLegacyPrivateKey = seedHex => {
  return deriveChildLegacy(0, seedHex)
    .getWallet()
    .getPrivateKey()
}

const deriveChildLegacy = (index, seed) => {
  const derivationPath = "m/44'/60'/0'/0"
  return EthHd.fromMasterSeed(seed)
    .derivePath(derivationPath)
    .deriveChild(index)
}

export const privateKeyToAddress = pk =>
  EthUtil.toChecksumAddress(EthUtil.privateToAddress(pk).toString('hex'))

export const deriveAddress = async (...args) =>
  privateKeyToAddress(await getPrivateKey(...args))

export const deriveAddressFromXpub = xpub => {
  const ethPublic = EthHd.fromExtendedKey(xpub)
    .getWallet()
    .getPublicKey()
  return EthUtil.toChecksumAddress(
    EthUtil.publicToAddress(ethPublic).toString('hex')
  )
}

export const calculateFee = (gasPrice, gasLimit) => {
  const feeGWei = new BigNumber(gasPrice)
    .multipliedBy(new BigNumber(gasLimit))
    .toString()
  return Exchange.convertEtherToEther({
    value: feeGWei,
    fromUnit: 'GWEI',
    toUnit: 'WEI'
  }).value
}

export const calculateEffectiveBalance = (balance, fee, isErc20) => {
  const balanceB = new BigNumber(balance)
  if (isErc20) return balanceB.toString()
  const feeB = new BigNumber(fee)
  const effectiveBalanceB = balanceB.minus(feeB)
  const zeroB = new BigNumber('0')
  return effectiveBalanceB.isLessThan(zeroB)
    ? zeroB.toString()
    : effectiveBalanceB.toString()
}

export const calculateTransactionAmount = (amount, fee) => {
  return new BigNumber.sum(amount, new BigNumber(fee)).toString()
}

export const convertGweiToWei = amount => {
  return new BigNumber(amount).multipliedBy('1000000000').toString()
}

export const convertFeeToWei = fees => ({
  gasLimit: prop('gasLimit', fees),
  priority: convertGweiToWei(prop('priority', fees)),
  regular: convertGweiToWei(prop('regular', fees)),
  limits: {
    min: convertGweiToWei(path(['limits', 'min'], fees)),
    max: convertGweiToWei(path(['limits', 'max'], fees))
  }
})
