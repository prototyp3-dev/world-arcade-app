"use client"


import { cache, useEffect, useState } from 'react'
import { Dialog } from '@headlessui/react'
import { envClient } from '../utils/clientEnv';
import { useConnectWallet } from '@web3-onboard/react';
import { BigNumber, ContractReceipt, ethers } from 'ethers';
import WarningIcon from '@mui/icons-material/Warning';
import { depositErc20 } from '../libs/wallet/lib';


const DAI_ADDR = "0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357";
const USDC_ADDR = "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8";



const getQuote = cache(async function getPrice(sellTokenAddr:string, buyTokenAddr:string, amount:number){
    // amount = amount * 10**18;    
    let correctedAmount = BigNumber.from(amount);
    correctedAmount = ethers.utils.parseUnits(`${amount}`,18);

      
    // This is a placeholder. Get your live API key from the 0x Dashboard (https://dashboard.0x.org/apps)
    const headers = {"0x-api-key": "a89700a3-518d-4e73-8125-d5a1a44b2527"};
    
    // Fetch the swap price.
    const response = await fetch(
    `https://sepolia.api.0x.org/swap/v1/price?sellToken=${sellTokenAddr}&buyToken=${buyTokenAddr}&sellAmount=${correctedAmount.toString()}`, { headers }
    );

    if (response.status !== 200) {console.log("0x quote obtained"); return null;}

    const response_json = await response.json();
    return response_json;
})


interface Quote {
    buyAmount: number,
    estimatedGas: number,
    allowanceTarget: string
}


export enum MODAL_OPTIONS {
    SWAP,
    DEPOSIT
}

export default function DepositModal({option}:{option:MODAL_OPTIONS}) {
    const [{ wallet }] = useConnectWallet();
    const [sellAmount, setSellAmount] = useState<number>();
    const [lastQuote, setLastQuote] = useState<Quote>();
    const [depositValue, setDepositValue] = useState<number>();
    const [isLoading, setIsLoading] = useState(false);


    const handleAmountChange = (event:React.FormEvent<HTMLInputElement>) => {
        setSellAmount(Number(event.currentTarget.value));
    }

    const handleQuote = () => {
        if (!sellAmount) return;
        getQuote(DAI_ADDR, USDC_ADDR, sellAmount).then((res) => {
            console.log(res)
            setLastQuote({
                buyAmount: parseFloat(ethers.utils.formatUnits(BigNumber.from(res.buyAmount),envClient.ACCPTED_TOKEN_DECIMALS)),
                estimatedGas: res.estimatedGas,
                allowanceTarget: res.allowanceTarget
            });
        })
    }


    const approveAndSwap = async () => {
        if (!wallet) {
            alert("Connect a wallet first");
            return;
        }

        if (!sellAmount || !lastQuote) {
            alert("Quote the prices first");
            return;
        }
        let correctedSellAmount = BigNumber.from(sellAmount);
        correctedSellAmount = ethers.utils.parseUnits(`${sellAmount}`,18);

        const erc20abi= [{ "inputs": [ { "internalType": "string", "name": "name", "type": "string" }, { "internalType": "string", "name": "symbol", "type": "string" }, { "internalType": "uint256", "name": "max_supply", "type": "uint256" } ], "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "owner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "spender", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" } ], "name": "Approval", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" } ], "name": "Transfer", "type": "event" }, { "inputs": [ { "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "spender", "type": "address" } ], "name": "allowance", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "approve", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "account", "type": "address" } ], "name": "balanceOf", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "burn", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "account", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "burnFrom", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "decimals", "outputs": [ { "internalType": "uint8", "name": "", "type": "uint8" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "subtractedValue", "type": "uint256" } ], "name": "decreaseAllowance", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "addedValue", "type": "uint256" } ], "name": "increaseAllowance", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "name", "outputs": [ { "internalType": "string", "name": "", "type": "string" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "symbol", "outputs": [ { "internalType": "string", "name": "", "type": "string" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "totalSupply", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "recipient", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "transfer", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "sender", "type": "address" }, { "internalType": "address", "name": "recipient", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "transferFrom", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" }]
        const signer = new ethers.providers.Web3Provider(wallet.provider, 'any').getSigner();
        const sellTokenContract = new ethers.Contract(DAI_ADDR, erc20abi, signer);

        // // allowance
        try {
            const signerAddress = await signer.getAddress();
            const allowance = await sellTokenContract.allowance(
                signerAddress,
                DAI_ADDR
            );
            if (allowance.lt(correctedSellAmount)) {
                setIsLoading(true);
                const allowanceApproveAmount = correctedSellAmount.sub(allowance);
                const approveTx = await sellTokenContract.approve(lastQuote.allowanceTarget, allowanceApproveAmount);
                const approveReceipt = await approveTx.wait();
                console.log(approveReceipt);
                setIsLoading(false);
            }
        } catch(error) {
            console.log((error as Error).message);
            return;
        }

        // swap
        // const amount = sellAmount * 10 ** 18;
        // This is a placeholder. Get your live API key from the 0x Dashboard (https://dashboard.0x.org/apps)
        const headers = {"0x-api-key": "a89700a3-518d-4e73-8125-d5a1a44b2527"};
        const response = await fetch(
            `https://sepolia.api.0x.org/swap/v1/quote?sellToken=${DAI_ADDR}&buyToken=${USDC_ADDR}&sellAmount=${correctedSellAmount.toString()}`, { headers }
        );

        const response_json = await response.json();
        console.log(response_json);

        setIsLoading(true);
        const swapTx = await  signer.sendTransaction({
            chainId: response_json.chainId,
            from: response_json.from,
            gasPrice: response_json.gasPrice,
            to: response_json.to,
            data: response_json.data            
        });
        const  swapReceipt = await swapTx.wait();
        setIsLoading(false);
        console.log(swapReceipt);
    }
    
    const depositTokens =() => {

        if (!wallet) {
            alert("Connect wallet first to deposit.");
            return
        }

        if (!depositValue) {
            alert("Choose a deposit value");
            return;
        }

        setIsLoading(true);
        const signer = new ethers.providers.Web3Provider(wallet.provider, 'any').getSigner();

        depositErc20(signer, envClient.DAPP_ADDR, envClient.ACCEPTED_TOKEN,depositValue,
            {sync:false, cartesiNodeUrl: envClient.CARTESI_NODE_URL,decimals:Number(envClient.ACCPTED_TOKEN_DECIMALS)}).then(
                (res) => {
                    const receipt = res as ContractReceipt;
                  
                    if (receipt == undefined || receipt.events == undefined)
                        throw new Error("Couldn't send transaction");

        }).catch( (error) => {
            alert(error);
        });
        
        setIsLoading(false);
    }

    if (isLoading) {
        return (
            <div className="btn w-full p-4 place-self-center flex justify-center element">
                <div className='w-16 h-16 border-2 rounded-full border-current border-r-transparent animate-spin'></div>
            </div>
        )
    }

    return (
        <div>
            {/* <Dialog.Title className={"font-bold text-xl"}>{status === DEPOSIT_STATUS.SWAP?"0x Token Swap":"Deposit"}</Dialog.Title> */}

            {
                option === MODAL_OPTIONS.SWAP?
                    <div> 
                        <Dialog.Description className={"flex"}>
                            <WarningIcon className='text-yellow-500 me-2'/> <span className='text-sm font-light'>Rives only accepts USDC tokens, swap your tokens.</span>
                        </Dialog.Description>

                        <form className='flex flex-col'>
                            <div className='grid grid-cols-2 py-2'>
                                <span className='place-self-center'>DAI</span>
                                <input type='number' id='sellToken' className='rounded w-sm text-black' value={sellAmount} onChange={handleAmountChange}></input>
                            </div>

                            <div className='grid grid-cols-2 py-2'>
                                <span className='place-self-center'>USDC</span>
                                <input disabled id='buyToken' className='rounded w-sm text-black' value={lastQuote?.buyAmount}></input>
                            </div>
                        </form>

                        <div className='flex flex-col space-y-2'>
                            <span>Estimated Gas: {lastQuote?.estimatedGas}</span>

                            
                            <div className='grid grid-cols-2 space-x-2'>
                                <button disabled={!sellAmount || sellAmount === 0} className='p-2 border hover-color' onClick={handleQuote}>
                                    Quote
                                </button>
                                
                                <button disabled={!lastQuote} className='p-2 border hover-color' onClick={approveAndSwap}>
                                    Swap
                                </button>
                            </div>
                        </div>
                    </div>
                :
                    <>
                        <fieldset className={`relative my-6 px-6 flex-auto h-full`}>
                            <div >
                                <legend>
                                    Deposit USDC Tokens
                                </legend>
                                <input className="text-black" type="number" value={depositValue} onChange={e => setDepositValue(Number(e.target.value))} />
                            </div>
                        </fieldset>
                        <div className="flex items-center justify-end pb-2 pr-6">
                            <button
                                className={`p-2 border element hover-color`}
                                type="button"
                                onClick={() => depositTokens()}
                                >Deposit
                            </button>
                        </div>
                    </>
            }
        </div>
    )
}