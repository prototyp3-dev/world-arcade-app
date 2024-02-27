import { init } from '@web3-onboard/react'
import injectedModule from '@web3-onboard/injected-wallets'


const chain = {
  id: "0x7A69"
}


const chains = [chain]

const wallets = [injectedModule()]

const appMetadata = {
  name: 'Achievements',
  description: 'Gotta get them all.',
  recommendedInjectedWallets: [
    { name: 'MetaMask', url: 'https://metamask.io' },
    { name: 'Coinbase', url: 'https://wallet.coinbase.com/' }
  ]
}

// initialize and export Onboard
const web3Onboard = init({
  wallets,
  chains,
  appMetadata,
  connect: {
    autoConnectLastWallet: true
  },
  accountCenter: {desktop: {enabled: false}, mobile: {enabled: false}}
})

export default web3Onboard;