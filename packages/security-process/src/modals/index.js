import React from 'react'

import { Confirm, PromptInput } from './Generic'
import { MobileNumberChange, MobileNumberVerify } from './Mobile'
import QRCode from './QRCode'
import {
  ConfirmDisable2FA,
  SecondPassword,
  TwoStepGoogleAuthenticator,
  TwoStepSetup,
  TwoStepYubico
} from './Settings'
import { PairingCode } from './Wallet'

const Modals = () => (
  <div>
    <Confirm />
    <ConfirmDisable2FA />
    <MobileNumberChange />
    <MobileNumberVerify />
    <PairingCode />
    <PromptInput />
    <QRCode />
    <SecondPassword />
    <TwoStepGoogleAuthenticator />
    <TwoStepSetup />
    <TwoStepYubico />
  </div>
)

export default Modals
