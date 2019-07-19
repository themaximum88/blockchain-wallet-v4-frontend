export default ({ securityModule }) => {
  const updateEmail = (guid, email) =>
    securityModule.updateSettings(guid, 'update-email', email)

  const sendConfirmationCodeEmail = (guid, email) =>
    securityModule.updateSettings(guid, 'send-verify-email-mail', email)

  const sendEmailConfirmation = (guid, email) =>
    securityModule.updateSettings(guid, 'update-email', email)

  const resendVerifyEmail = (guid, email) =>
    securityModule.updateSettings(guid, 'resend-verify-email', email)

  const verifyEmail = (guid, code) =>
    securityModule.updateSettings(guid, 'verify-email-code', code)

  const updateMobile = (guid, mobile) =>
    securityModule.updateSettings(guid, 'update-sms', mobile)

  const verifyMobile = (guid, code) =>
    securityModule.updateSettings(guid, 'verify-sms', code)

  const updateLanguage = (guid, language) =>
    securityModule.updateSettings(guid, 'update-language', language)

  const updateCurrency = (guid, currency) =>
    securityModule.updateSettings(guid, 'update-currency', currency)

  const updateLastTxTime = (guid, time) =>
    securityModule.updateSettings(guid, 'update-last-tx-time', time)

  const updateLoggingLevel = (guid, loggingLevel) =>
    securityModule.updateSettings(guid, 'update-logging-level', loggingLevel)

  const updateIpLock = (guid, ipLock) =>
    securityModule.updateSettings(guid, 'update-ip-lock', ipLock)

  const updateIpLockOn = (guid, ipLockOn) =>
    securityModule.updateSettings(guid, 'update-ip-lock-on', ipLockOn)

  const updateBlockTorIps = (guid, blockTorIps) =>
    securityModule.updateSettings(guid, 'update-block-tor-ips', blockTorIps)

  const updateHint = (guid, hint) =>
    securityModule.updateSettings(guid, 'update-password-hint1', hint)

  const updateAuthType = (guid, authType) =>
    securityModule.updateSettings(guid, 'update-auth-type', authType)

  const updateAuthTypeNeverSave = (guid, authTypeNeverSave) =>
    securityModule.updateSettings(
      guid,
      'update-never-save-auth-type',
      authTypeNeverSave
    )

  const getGoogleAuthenticatorSecretUrl = guid =>
    securityModule.updateSettings(guid, 'generate-google-secret', '')

  const enableGoogleAuthenticator = (guid, code) =>
    securityModule.updateSettings(guid, 'update-auth-type', '4', `code=${code}`)

  const enableYubikey = (guid, code) =>
    securityModule.updateSettings(guid, 'update-yubikey', code)

  const enableNotifications = (guid, value) =>
    securityModule.updateSettings(guid, 'update-notifications-on', value)

  const updateNotificationsType = (guid, value) =>
    securityModule.updateSettings(guid, 'update-notifications-type', value)

  return {
    updateEmail,
    sendEmailConfirmation,
    resendVerifyEmail,
    verifyEmail,
    updateMobile,
    verifyMobile,
    updateLanguage,
    updateLastTxTime,
    updateCurrency,
    updateLoggingLevel,
    updateIpLock,
    updateIpLockOn,
    updateBlockTorIps,
    updateHint,
    updateAuthType,
    updateAuthTypeNeverSave,
    getGoogleAuthenticatorSecretUrl,
    enableGoogleAuthenticator,
    enableYubikey,
    sendConfirmationCodeEmail,
    enableNotifications,
    updateNotificationsType
  }
}
