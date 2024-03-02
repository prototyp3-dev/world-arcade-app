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
                <span className='ms-2'>USDC</span>
            </span>
            <AccountWalletOperations  user_address={wallet.accounts[0].address} reload={reloadCount} />
        </div>
    );
}
