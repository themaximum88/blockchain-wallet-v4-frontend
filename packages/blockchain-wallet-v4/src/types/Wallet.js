import Bigi from 'bigi'
import Base58 from 'bs58'
import Either from 'data.either'
import Task from 'data.task'
import Maybe from 'data.maybe'
import Bitcoin from 'bitcoinjs-lib'
import memoize from 'fast-memoize'
import BIP39 from 'bip39'
import {
  compose,
  curry,
  map,
  is,
  pipe,
  __,
  concat,
  split,
  isNil,
  flip
} from 'ramda'
import { traversed, traverseOf, over, view, set } from 'ramda-lens'

import { promiseToTask, returnTask, taskToPromise } from '../utils/functional'
import * as crypto from '../walletCrypto'
import { shift, shiftIProp } from './util'
import Type from './Type'
import * as HDWallet from './HDWallet'
import * as HDAccount from './HDAccount'
import * as Address from './Address'
import * as AddressMap from './AddressMap'
import * as AddressLabelMap from './AddressLabelMap'
import * as HDWalletList from './HDWalletList'
import * as HDAccountList from './HDAccountList'
import * as AddressBook from './AddressBook'
import * as TXNames from './TXNames'
import * as TXNotes from './TXNotes'
import * as Options from './Options'

/* Wallet :: {
  guid :: String
  sharedKey :: String
  double_encryption :: Bool
  metadataHDNode :: String
  options :: Options
  address_book :: [{ [addr]: String }]
  tx_notes :: [{ txhash: String }]
  tx_names :: []
  addresses :: {Address}
  hd_wallets :: [HDWallet]
} */

export class Wallet extends Type {}

export const isWallet = is(Wallet)

export const guid = Wallet.define('guid')
export const sharedKey = Wallet.define('sharedKey')
export const doubleEncryption = Wallet.define('double_encryption')
export const metadataHDNode = Wallet.define('metadataHDNode')
export const options = Wallet.define('options')
export const addresses = Wallet.define('addresses')
export const dpasswordhash = Wallet.define('dpasswordhash')
export const hdWallets = Wallet.define('hd_wallets')
export const txNotes = Wallet.define('tx_notes')
export const txNames = Wallet.define('tx_names')
export const addressBook = Wallet.define('address_book')

export const hdwallet = compose(
  hdWallets,
  HDWalletList.hdwallet
)
export const accounts = compose(
  hdwallet,
  HDWallet.accounts
)

export const selectGuid = view(guid)
export const selectSharedKey = view(sharedKey)
export const selectOptions = view(options)
export const selectmetadataHDNode = view(metadataHDNode)
export const selectTxNotes = view(txNotes)
export const selectTxNames = view(txNames)
export const selectAddressBook = view(addressBook)
export const selectIterations = compose(
  Options.selectPbkdf2Iterations,
  selectOptions
)

export const selectAddresses = view(addresses)
export const selectHdWallets = view(hdWallets)
export const isDoubleEncrypted = compose(
  Boolean,
  view(doubleEncryption)
)

export const selectAddrContext = compose(
  AddressMap.selectContext,
  AddressMap.selectActive,
  selectAddresses
)
export const selectArchivedContext = compose(
  AddressMap.selectContext,
  AddressMap.selectActive,
  selectAddresses
)
export const selectXpubsContext = compose(
  HDWallet.selectContext,
  HDWalletList.selectHDWallet,
  selectHdWallets
)
export const selectSpendableAddrContext = compose(
  AddressMap.selectContext,
  AddressMap.selectSpendable,
  selectAddresses
)
export const selectUnspendableAddrContext = compose(
  AddressMap.selectContext,
  AddressMap.selectUnspendable,
  AddressMap.selectActive,
  selectAddresses
)
export const selectContext = w =>
  selectAddrContext(w).concat(selectXpubsContext(w))
export const selectHDAccounts = w =>
  selectHdWallets(w).flatMap(HDWallet.selectAccounts)
export const selectSpendableContext = w =>
  selectSpendableAddrContext(w).concat(selectXpubsContext(w))
export const selectUnspendableContext = w => selectUnspendableAddrContext(w)

const shiftWallet = compose(
  shiftIProp('keys', 'addresses'),
  shift
)

export const fromJS = x => {
  if (is(Wallet, x)) {
    return x
  }
  const walletCons = compose(
    over(hdWallets, HDWalletList.fromJS),
    over(addresses, AddressMap.fromJS),
    over(options, Options.fromJS),
    over(txNames, TXNames.fromJS),
    over(txNotes, TXNotes.fromJS),
    over(addressBook, AddressBook.fromJS),
    w => shiftWallet(w).forward()
  )
  return walletCons(new Wallet(x))
}

export const toJS = pipe(
  Wallet.guard,
  wallet => {
    const walletDecons = compose(
      w => shiftWallet(w).back(),
      over(options, Options.toJS),
      over(txNotes, TXNotes.toJS),
      over(txNames, TXNames.toJS),
      over(hdWallets, HDWalletList.toJS),
      over(addresses, AddressMap.toJS),
      over(addressBook, AddressBook.toJS)
    )
    return walletDecons(wallet).toJS()
  }
)

export const reviver = jsObject => {
  return new Wallet(jsObject)
}

export const spendableActiveAddresses = wallet => {
  let isSpendableActive = a => !Address.isWatchOnly(a) && !Address.isArchived(a)
  return selectAddresses(wallet)
    .filter(isSpendableActive)
    .map(a => a.addr)
}

// fromEncryptedPayload :: String -> String -> Task Error Wallet
export const fromEncryptedPayload = curry((password, payload) => {
  return Task.of(payload)
    .chain(crypto.decryptWallet(password))
    .map(fromJS)
})

// toEncryptedPayload :: String -> Wallet -> Task Error String
export const toEncryptedPayload = curry(
  (password, pbkdf2Iterations, wallet) => {
    Wallet.guard(wallet)
    return compose(
      crypto.encryptWallet(__, password, pbkdf2Iterations, 3.0),
      JSON.stringify,
      toJS
    )(wallet)
  }
)

export const isValidSecondPwd = curry(
  async (securityModule, password, wallet) => {
    if (isDoubleEncrypted(wallet)) {
      if (!is(String, password)) {
        return false
      }
      let iterations = selectIterations(wallet)
      let storedHash = view(dpasswordhash, wallet)

      let computedHash = await securityModule.computeSecondPasswordHash({
        iterations,
        password
      })

      return storedHash === computedHash
    } else {
      return true
    }
  }
)

// getAddress :: String -> Wallet -> Maybe Address
export const getAddress = curry((addr, wallet) => {
  let address = AddressMap.selectAddress(addr, wallet.addresses)
  return Maybe.fromNullable(address)
})

// getAccount :: Integer -> Wallet -> Maybe HDAccount
export const getAccount = curry((index, wallet) =>
  compose(
    Maybe.fromNullable,
    selectHdWallets
  )(wallet)
    .chain(
      compose(
        Maybe.fromNullable,
        HDWalletList.selectHDWallet
      )
    )
    .chain(
      compose(
        Maybe.fromNullable,
        HDWallet.selectAccount(index)
      )
    )
)

const applyCipher = curry(
  returnTask(async (securityModule, wallet, password, f, value) => {
    let it = selectIterations(wallet)
    switch (true) {
      case !isDoubleEncrypted(wallet):
        return value
      case await isValidSecondPwd(securityModule, password, wallet):
        return taskToPromise(f(it, securityModule, password, value))
      default:
        throw new Error('INVALID_SECOND_PASSWORD')
    }
  })
)

export const importLegacyAddress = curry(
  (
    wallet,
    key,
    createdTime,
    password,
    bipPass,
    { network, api, securityModule }
  ) => {
    let checkIfExists = address =>
      getAddress(address.addr, wallet)
        .map(existing =>
          Address.isWatchOnly(existing) && !Address.isWatchOnly(address)
            ? Task.of(existing)
            : Task.rejected(new Error('present_in_wallet'))
        )
        .map(aE => aE.map(set(Address.priv, address.priv)))
        .getOrElse(Task.of(address))

    let appendAddress = address =>
      over(addresses, as => as.set(address.addr, address), wallet)

    return Address.fromString(key, createdTime, null, bipPass, { network, api })
      .chain(checkIfExists)
      .chain(applyCipher(securityModule, wallet, password, Address.encrypt))
      .map(appendAddress)
  }
)

export const upgradeToHd = curry(
  (securityModule, mnemonic, firstLabel, password, network, wallet) => {
    return newHDWallet(mnemonic, password, wallet).chain(
      newHDAccount(securityModule, firstLabel, password, network)
    )
  }
)

export const newHDWallet = curry(
  (securityModule, mnemonic, password, wallet) => {
    let hdWallet = HDWallet.createNew(mnemonic)
    let appendHdWallet = curry((w, hd) =>
      over(hdWallets, list => list.push(hd), w)
    )
    return applyCipher(
      securityModule,
      wallet,
      password,
      HDWallet.encrypt,
      hdWallet
    ).map(appendHdWallet(wallet))
  }
)

export const newHDAccount = curry(
  (securityModule, label, password, network, wallet) => {
    let hdWallet = HDWalletList.selectHDWallet(selectHdWallets(wallet))
    let index = hdWallet.accounts.size
    let appendAccount = curry((w, account) => {
      let accountsLens = compose(
        hdWallets,
        HDWalletList.hdwallet,
        HDWallet.accounts
      )
      let accountWithIndex = set(HDAccount.index, index, account)
      return over(accountsLens, accounts => accounts.push(accountWithIndex), w)
    })

    const credentials = {
      iterations: selectIterations(wallet),
      secondPassword: password
    }

    return promiseToTask(
      HDWallet.generateAccount(
        curry(securityModule.deriveBIP32Key)(credentials),
        index,
        label,
        network
      )
    )
      .chain(applyCipher(securityModule, wallet, password, HDAccount.encrypt))
      .map(appendAccount(wallet))
  }
)

// setLegacyAddressLabel :: String -> String -> Wallet -> Wallet
export const setLegacyAddressLabel = curry((address, label, wallet) => {
  const addressLens = compose(
    addresses,
    AddressMap.address(address)
  )
  const eitherW = Either.try(over(addressLens, Address.setLabel(label)))(wallet)
  return eitherW.getOrElse(wallet)
})

export const getPrivateKeyForAddress = curry(
  (securityModule, wallet, password, addr) => {
    let address = AddressMap.selectAddress(addr, selectAddresses(wallet))
    return applyCipher(
      securityModule,
      wallet,
      password,
      Address.decrypt,
      address
    ).map(a => a.priv)
  }
)

// setLegacyAddressLabel :: String -> Bool -> Wallet -> Wallet
export const setAddressArchived = curry((address, archived, wallet) => {
  const addressLens = compose(
    addresses,
    AddressMap.address(address)
  )
  return over(addressLens, Address.setArchived(archived), wallet)
})

// deleteLegacyAddress :: String -> Wallet -> Wallet
export const deleteLegacyAddress = curry((address, wallet) => {
  return over(addresses, AddressMap.deleteAddress(address), wallet)
})

// deleteHdAddressLabel :: Number -> Number -> Wallet -> Wallet
export const deleteHdAddressLabel = curry((accountIdx, addressIdx, wallet) => {
  const lens = compose(
    hdWallets,
    HDWalletList.hdwallet,
    HDWallet.accounts,
    HDAccountList.account(accountIdx),
    HDAccount.addressLabels
  )
  const eitherW = Either.try(
    over(lens, AddressLabelMap.deleteLabel(addressIdx))
  )(wallet)
  return eitherW.getOrElse(wallet)
})

// setHdAddressLabel :: Number -> Number -> String -> Wallet -> Wallet
export const setHdAddressLabel = curry(
  (accountIdx, addressIdx, label, wallet) => {
    const lens = compose(
      hdWallets,
      HDWalletList.hdwallet,
      HDWallet.accounts,
      HDAccountList.account(accountIdx),
      HDAccount.addressLabels
    )
    const eitherW = Either.try(
      over(lens, AddressLabelMap.setLabel(addressIdx, label))
    )(wallet)
    return eitherW.getOrElse(wallet)
  }
)

// setAccountLabel :: Number -> String -> Wallet -> Wallet
export const setAccountLabel = curry((accountIdx, label, wallet) => {
  let lens = compose(
    accounts,
    HDAccountList.account(accountIdx),
    HDAccount.label
  )
  return set(lens, label, wallet)
})

// setAccountArchived :: Number -> Bool -> Wallet -> Wallet
export const setAccountArchived = curry((index, archived, wallet) => {
  let lens = compose(
    accounts,
    HDAccountList.account(index),
    HDAccount.archived
  )
  return set(lens, archived, wallet)
})

// setDefaultAccountIdx :: Number -> Wallet -> Wallet
export const setDefaultAccountIdx = curry((index, wallet) => {
  return set(
    compose(
      hdwallet,
      HDWallet.defaultAccountIdx
    ),
    index,
    wallet
  )
})
export const setTxNote = curry((txHash, txNote, wallet) => {
  return set(
    compose(
      txNotes,
      TXNotes.note(txHash)
    ),
    txNote,
    wallet
  )
})

// traversePrivValues :: Monad m => (a -> m a) -> (String -> m String) -> Wallet -> m Wallet
export const traverseKeyValues = curry((of, f, wallet) => {
  const trAddr = traverseOf(
    compose(
      addresses,
      traversed,
      Address.priv
    ),
    of,
    f
  )
  const trSeed = traverseOf(
    compose(
      hdWallets,
      traversed,
      HDWallet.seedHex
    ),
    of,
    f
  )
  const trXpriv = traverseOf(
    compose(
      hdWallets,
      traversed,
      HDWallet.accounts,
      traversed,
      HDAccount.xpriv
    ),
    of,
    f
  )
  return of(wallet)
    .chain(trAddr)
    .chain(trSeed)
    .chain(trXpriv)
})

export const encrypt = curry(
  returnTask(async (securityModule, password, wallet) => {
    if (isDoubleEncrypted(wallet)) {
      return wallet
    } else {
      let iterations = selectIterations(wallet)

      let enc = returnTask(
        curry(securityModule.encryptWithSecondPassword)({
          iterations,
          password
        })
      )

      let hash = await securityModule.computeSecondPasswordHash({
        iterations,
        password
      })

      let setFlag = over(doubleEncryption, () => true)
      let setHash = over(dpasswordhash, () => hash)

      return taskToPromise(
        traverseKeyValues(Task.of, enc, wallet).map(
          compose(
            setHash,
            setFlag
          )
        )
      )
    }
  })
)

export const decrypt = curry((securityModule, password, wallet) => {
  if (isDoubleEncrypted(wallet)) {
    let iterations = selectIterations(wallet)

    let dec = curry(returnTask(securityModule.decryptWithSecondPassword))({
      iterations,
      password
    })

    let setFlag = over(doubleEncryption, () => false)
    let setHash = over(Wallet.lens, x => x.delete('dpasswordhash'))

    return validateSecondPwd(securityModule, password, wallet)
      .chain(traverseKeyValues(Task.of, dec))
      .map(
        compose(
          setHash,
          setFlag
        )
      )
  } else {
    return Task.of(wallet)
  }
})

const validateSecondPwd = returnTask(
  async (securityModule, password, wallet) => {
    if (await isValidSecondPwd(securityModule, password, wallet)) {
      return wallet
    } else {
      throw new Error('INVALID_SECOND_PASSWORD')
    }
  }
)

const _derivePrivateKey = (network, xpriv, chain, index) =>
  Bitcoin.HDNode.fromBase58(xpriv, network)
    .derive(chain)
    .derive(index)

export const derivePrivateKey = memoize(_derivePrivateKey)

export const getHDPrivateKeyWIF = curry(
  (securityModule, keypath, secondPassword, network, wallet) => {
    let [accId, chain, index] = map(parseInt, split('/', keypath))
    if (isNil(accId) || isNil(chain) || isNil(index)) {
      return Task.rejected('WRONG_PATH_KEY')
    }
    let xpriv = compose(
      HDAccount.selectXpriv,
      HDWallet.selectAccount(accId),
      HDWalletList.selectHDWallet,
      selectHdWallets
    )(wallet)
    if (isDoubleEncrypted(wallet)) {
      return validateSecondPwd(securityModule, secondPassword, wallet)
        .chain(() =>
          crypto.decryptSecPass(
            selectSharedKey(wallet),
            selectIterations(wallet),
            secondPassword,
            xpriv
          )
        )
        .map(xp => derivePrivateKey(network, xp, chain, index).keyPair.toWIF())
    } else {
      return Task.of(xpriv).map(xp =>
        derivePrivateKey(network, xp, chain, index).keyPair.toWIF()
      )
    }
  }
)

// TODO :: find a proper place for that
const fromBase58toKey = (string, address, network) => {
  var key = new Bitcoin.ECPair(Bigi.fromBuffer(Base58.decode(string)), null, {
    network
  })
  if (key.getAddress() === address) return key
  key.compressed = !key.compressed
  return key
}

export const getLegacyPrivateKey = curry(
  (securityModule, address, secondPassword, network, wallet) => {
    let priv = compose(
      Address.selectPriv,
      AddressMap.selectAddress(address),
      selectAddresses
    )(wallet)
    if (isDoubleEncrypted(wallet)) {
      return validateSecondPwd(securityModule, secondPassword, wallet)
        .chain(() =>
          crypto.decryptSecPass(
            selectSharedKey(wallet),
            selectIterations(wallet),
            secondPassword,
            priv
          )
        )
        .map(pk => fromBase58toKey(pk, address, network))
    } else {
      return Task.of(priv).map(pk => fromBase58toKey(pk, address, network))
    }
  }
)

export const getLegacyPrivateKeyWIF = curry(
  (securityModule, address, secondPassword, network, wallet) => {
    return getLegacyPrivateKey(
      securityModule,
      address,
      secondPassword,
      network,
      wallet
    ).map(ecpair => ecpair.toWIF())
  }
)

export const getSeedHex = curry((securityModule, secondPassword, wallet) => {
  const seedHex = compose(
    HDWallet.selectSeedHex,
    HDWalletList.selectHDWallet,
    selectHdWallets
  )(wallet)
  if (isDoubleEncrypted(wallet)) {
    return validateSecondPwd(securityModule, secondPassword, wallet).chain(() =>
      crypto.decryptSecPass(
        selectSharedKey(wallet),
        selectIterations(wallet),
        secondPassword,
        seedHex
      )
    )
  } else {
    return Task.of(seedHex)
  }
})

export const getMnemonic = curry((securityModule, secondPassword, wallet) => {
  const eitherToTask = e => e.fold(Task.rejected, Task.of)
  const entropyToMnemonic = compose(
    eitherToTask,
    Either.try(BIP39.entropyToMnemonic)
  )
  const seedHex = getSeedHex(securityModule, secondPassword, wallet)
  return seedHex.chain(entropyToMnemonic)
})

export const js = (
  guid,
  sharedKey,
  label,
  mnemonic,
  xpub,
  nAccounts,
  network
) => ({
  guid: guid,
  sharedKey: sharedKey,
  tx_names: [],
  tx_notes: {},
  double_encryption: false,
  address_book: [],
  keys: [],
  hd_wallets: [HDWallet.js(label, mnemonic, xpub, nAccounts, network)],
  options: Options.js()
})
