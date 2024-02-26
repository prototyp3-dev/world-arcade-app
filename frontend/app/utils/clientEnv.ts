import { str, envsafe, url } from 'envsafe';


export const envClient = envsafe({
  CARTESI_NODE_URL: url({
    input: process.env.NEXT_PUBLIC_CARTESI_NODE_URL,
    desc: "Cartesi Node URL."
  })
})