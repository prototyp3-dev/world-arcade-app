import { str, envsafe, url } from 'envsafe';


export const envClient = envsafe({
  DAPP_ADDR: str({
    input: process.env.NEXT_PUBLIC_DAPP_ADDR,
    desc: "Cartesi DApp ETH address."
  }),
  CARTESI_NODE_URL: url({
    input: process.env.NEXT_PUBLIC_CARTESI_NODE_URL,
    desc: "Cartesi Node URL."
  }),
  ACCPTED_TOKEN: str({
    input: process.env.NEXT_PUBLIC_ACCPTED_TOKEN,
    desc: "Token used in application."
  }),
  ACCPTED_TOKEN_DECIMALS: str({
    input: process.env.NEXT_PUBLIC_ACCPTED_TOKEN_DECIMALS,
    desc: "Number of decimals of token."
  })
})