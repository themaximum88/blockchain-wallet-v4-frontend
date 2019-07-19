export default ({ BIP39, Bitcoin, crypto, ed25519, taskToPromise }) => {
  const computeSecondPasswordHash = ({ iterations, password, sharedKey }) =>
    crypto.hashNTimes(iterations, sharedKey + password).toString(`hex`)

  const credentialsEntropy = ({ guid, password, sharedKey }) =>
    crypto.sha256(Buffer.from(guid + sharedKey + password))

  const decryptEntropy = async (
    { iterations, secondPassword, sharedKey },
    cipherText
  ) =>
    secondPassword
      ? taskToPromise(
          crypto.decryptSecPass(
            sharedKey,
            iterations,
            secondPassword,
            cipherText
          )
        )
      : cipherText

  const deriveBIP32Key = ({ network, path, seed }) =>
    Bitcoin.HDNode.fromSeedBuffer(seed, network)
      .derivePath(path)
      .toBase58()

  const deriveSLIP10ed25519Key = ({ path, seed }) =>
    ed25519.derivePath(path, seed.toString(`hex`))

  const entropyToSeed = entropy =>
    BIP39.mnemonicToSeed(BIP39.entropyToMnemonic(entropy))

  return {
    computeSecondPasswordHash,
    credentialsEntropy,
    decryptEntropy,
    deriveBIP32Key,
    deriveSLIP10ed25519Key,
    entropyToSeed
  }
}
