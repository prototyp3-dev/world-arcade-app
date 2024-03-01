"use client"


import type { WalletState } from '@web3-onboard/core';
import ReplayIcon from '@mui/icons-material/Replay';

import { envClient } from '../utils/clientEnv';
import { useEffect, useState } from 'react';
import { ContractReceipt, ethers } from 'ethers';
import { balance, depositErc20 } from '../libs/wallet/lib';
import AccountWalletOperations from './AccountWalletOperations';


export default function Account({wallet}:{wallet:WalletState|null}) {
    const [currentBalance, setBalance] = useState(0);
    const [depositValue, setDepositValue] = useState(0);
    const [reloadCount, setReloadCount] = useState(0);

    if (!wallet || wallet.accounts.length == 0) return <></>;

    const depositTokens =() => {

        if (!wallet) {
            alert("Connect wallet first to deposit.");
            return
        }

        const signer = new ethers.providers.Web3Provider(wallet.provider, 'any').getSigner();

        depositErc20(signer, envClient.DAPP_ADDR, envClient.ACCPTED_TOKEN,depositValue,
            {sync:false, cartesiNodeUrl: envClient.CARTESI_NODE_URL,decimals:Number(envClient.ACCPTED_TOKEN_DECIMALS)}).then(
                (res) => {
                    const receipt = res as ContractReceipt;
                  
                    if (receipt == undefined || receipt.events == undefined)
                        throw new Error("Couldn't send transaction");

        }).catch( (error) => {
            alert(error);
        });
        
    }

    const reloadBalance = () => {
        if (!wallet) {
            alert("Connect wallet first to get balance.");
            return
        }

        const signer = new ethers.providers.Web3Provider(wallet.provider, 'any').getSigner();

        signer.getAddress().then((userAddress: string) =>{
            balance({address:userAddress},{cartesiNodeUrl: envClient.CARTESI_NODE_URL, decode: true}).then(
                (walletBalance) => {
                    if (walletBalance.hasOwnProperty('erc20') && walletBalance['erc20'].hasOwnProperty(envClient.ACCPTED_TOKEN.toLocaleLowerCase()))
                        setBalance(walletBalance['erc20'][envClient.ACCPTED_TOKEN.toLocaleLowerCase()]);
                    else setBalance(0);
                    setReloadCount(reloadCount+1);
                }
            );
        });
    }


    useEffect( () => {
        reloadBalance();
    },[]);
    
    return (
        <div className="grid grid-cols-2">
            
            <span className="text-2xl">Balance: {ethers.utils.formatUnits(`${currentBalance}`,envClient.ACCPTED_TOKEN_DECIMALS).toString()}</span>
            <div className="flex items-center justify-end pb-2 pr-6">
                <button
                    className={`uppercase text-sm px-6 py-2 ml-1 hover:bg-transparent`}
                    type="button"
                    onClick={() => reloadBalance()}
                ><ReplayIcon/>
                </button>
            </div>
            <fieldset className={`relative my-6 px-6 flex-auto h-full`}>
                <div >
                    <legend>
                        Deposit Tokens
                    </legend>
                    <input className="text-black" type="number" value={depositValue} onChange={e => setDepositValue(Number(e.target.value))} />
                </div>
            </fieldset>
            <div className="flex items-center justify-end pb-2 pr-6">
                <button
                    className={`uppercase text-sm px-6 py-2 ml-1 hover:bg-transparent`}
                    type="button"
                    onClick={() => depositTokens()}
                    >Deposit
                </button>
            </div>
            <AccountWalletOperations user_address={wallet.accounts[0].address} reload={reloadCount} />
        </div>
    );
}
