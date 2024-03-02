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
    const [reloadCount, setReloadCount] = useState(0);

    useEffect( () => {
        if (!wallet) {
            return
        }

        balance({address:wallet.accounts[0].address},{cartesiNodeUrl: envClient.CARTESI_NODE_URL, decode: true}).then(
            (walletBalance) => {
                if (walletBalance.hasOwnProperty('erc20') && walletBalance['erc20'].hasOwnProperty(envClient.ACCEPTED_TOKEN.toLocaleLowerCase()))
                    setBalance(walletBalance['erc20'][envClient.ACCEPTED_TOKEN.toLocaleLowerCase()]);
                else setBalance(0);
                setReloadCount(1);
            }
        );
    },[wallet]);
    
    if (!wallet || wallet.accounts.length == 0) return <></>;

    const depositTokens =() => {

        if (!wallet) {
            alert("Connect wallet first to deposit.");
            return
        }

        const signer = new ethers.providers.Web3Provider(wallet.provider, 'any').getSigner();

        depositErc20(signer, envClient.DAPP_ADDR, envClient.ACCEPTED_TOKEN,depositValue,
            {sync:false, cartesiNodeUrl: envClient.CARTESI_NODE_URL,decimals:Number(envClient.ACCEPTED_TOKEN_DECIMALS)}).then(
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

        balance({address:wallet.accounts[0].address},{cartesiNodeUrl: envClient.CARTESI_NODE_URL, decode: true}).then(
            (walletBalance) => {
                if (walletBalance.hasOwnProperty('erc20') && walletBalance['erc20'].hasOwnProperty(envClient.ACCEPTED_TOKEN.toLocaleLowerCase()))
                    setBalance(walletBalance['erc20'][envClient.ACCEPTED_TOKEN.toLocaleLowerCase()]);
                else setBalance(0);
                setReloadCount(reloadCount+1);
            }
        );
    }


    return (
        <div className="flex flex-col p-4">            
            <div className="flex items-center justify-end pb-2 pr-6">
                <button
                    className={`uppercase text-sm px-6 py-2 ml-1 hover-color`}
                    type="button"
                    onClick={() => reloadBalance()}
                ><ReplayIcon/>
                </button>
            </div>
            
            <span className="text-2xl">
                Balance: {ethers.utils.formatUnits(`${currentBalance}`,envClient.ACCPTED_TOKEN_DECIMALS).toString()}
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
            </div> */}
            <span className="text-2xl mb-4">
                Balance: {ethers.utils.formatUnits(`${currentBalance}`,envClient.ACCEPTED_TOKEN_DECIMALS).toString()}
                <span className='ms-2'>USDC</span>
            </span>
            <AccountWalletOperations  user_address={wallet.accounts[0].address} reload={reloadCount} />
        </div>
    );
}
