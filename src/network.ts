import * as qtum from "qtumjs-lib"
import * as bip39 from "bip39"

import { Wallet } from "./Wallet"
import { Insight } from "./Insight"

export interface INetworkInfo {
  name: string

  messagePrefix: string
  bech32: string

  // HDWallet https://en.bitcoin.it/wiki/BIP_0032
  bip32: {
    public: number,
    private: number,
  }

  pubKeyHash: number
  scriptHash: number
  wif: number
}

export enum NetworkNames {
  MAINNET = "qtum",
  TESTNET = "qtum_testnet",
}

export const networksInfo: { [key: string]: INetworkInfo } = {
  [NetworkNames.MAINNET]: {
    name: NetworkNames.MAINNET,
    messagePrefix: "\u0018Qtum Signed Message:\n",
    bech32: "bc",
    bip32: { public: 76067358, private: 76066276 },
    pubKeyHash: 58,
    scriptHash: 50,
    wif: 128,
  },
  [NetworkNames.TESTNET]: {
    name: NetworkNames.TESTNET,
    messagePrefix: "\u0018Qtum Signed Message:\n",
    bech32: "tb",
    bip32: { public: 70617039, private: 70615956 },
    pubKeyHash: 120,
    scriptHash: 110,
    wif: 239,
  },
}

export class Network {
  constructor(public info: INetworkInfo) {
  }

  /**
   * Restore a HD-wallet address from mnemonic & password
   *
   * @param mnemonic
   * @param password
   *
   */
  public fromMnemonic(
    mnemonic: string,
    password?: string,
  ): Wallet {
    // if (bip39.validateMnemonic(mnemonic) == false) return false
    const seedHex = bip39.mnemonicToSeedHex(mnemonic, password)
    const hdNode = qtum.HDNode.fromSeedHex(seedHex, this.info)
    const account = hdNode.deriveHardened(88).deriveHardened(0).deriveHardened(0)
    const keyPair = account.keyPair
    return new Wallet(keyPair, this.info)
  }

  /**
   * Restore 10 wallet addresses exported from QTUM's mobile clients. These
   * wallets are 10 sequential addresses rooted at the HD-wallet path
   * `m/88'/0'/0'` `m/88'/0'/1'` `m/88'/0'/2'`, and so on.
   *
   * @param mnemonic
   * @param network
   */
  public fromMobile(
    mnemonic: string,
  ) {
    const seedHex = bip39.mnemonicToSeedHex(mnemonic)
    const hdNode = qtum.HDNode.fromSeedHex(seedHex, this.info)
    const account = hdNode.deriveHardened(88).deriveHardened(0)
    const wallets: Wallet[] = []
    for (let i = 0; i < 10; i++) {
      const hdnode = account.deriveHardened(i)
      const wallet = new Wallet(hdnode.keyPair, this.info)

      wallets.push(wallet)
    }
    return wallets
  }

  /**
   * Restore wallet from private key specified in WIF format:
   *
   * See: https://en.bitcoin.it/wiki/Wallet_import_format
   *
   * @param wif
   * @param network
   */
  public fromWIF(
    wif: string,
  ) {
    const keyPair = qtum.ECPair.fromWIF(wif, this.info)
    return new Wallet(keyPair, this.info)
  }

  public insight(): Insight {
    return Insight.forNetwork(this.info)
  }
}

const mainnet = new Network(networksInfo[NetworkNames.MAINNET])
const testnet = new Network(networksInfo[NetworkNames.TESTNET])

export const networks = {
  mainnet,
  testnet,
}