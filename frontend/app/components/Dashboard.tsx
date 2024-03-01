"use client"

import { Tab } from "@headlessui/react";
import CollectionsIcon from '@mui/icons-material/Collections';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useConnectWallet } from "@web3-onboard/react";
import type { WalletState } from '@web3-onboard/core';


import { CartridgeInfo } from "@/app/libs/app/ifaces";
import { Suspense, useState } from "react";

import Moments from "./Moments";
import { ContractReceipt, ethers } from "ethers";
import { MomentInfo, releaseMoment } from "../libs/achievements/lib";
import { ReleaseMomentPayload } from "../libs/achievements/ifaces";
import { envClient } from "../utils/clientEnv";
import Account from "./Account";

function loadingFallback() {
    return (
        <div className="btn w-full p-4 flex justify-center element">
            <div className='w-16 h-16 border border-r-transparent animate-spin'></div>
        </div>
    )
}


export default function Dashboard({wallet}:{wallet:WalletState|null}) {
    // if (!wallet || wallet.accounts.length == 0) return <></>;

    const releaseFunction = (moment: MomentInfo) => {

        if (!moment){
            alert("No moment selected.");
            return;
        }
        if (!wallet) {
            alert("Connect wallet first to release the moment.");
            return
        }

        console.log(moment)
        const signer = new ethers.providers.Web3Provider(wallet.provider, 'any').getSigner();
        const inputData: ReleaseMomentPayload = {
            id:+moment.id
        }

        releaseMoment(signer, envClient.DAPP_ADDR, inputData, {sync:false, cartesiNodeUrl: envClient.CARTESI_NODE_URL}).then(
            (res) => {
                const receipt = res as ContractReceipt;

                if (receipt == undefined || receipt.events == undefined)
                throw new Error("Couldn't send transaction");

                const inputEvent = receipt.events[0];
                const inputIndex = inputEvent.args && inputEvent.args[1];
                if (inputIndex == undefined)
                    throw new Error("Couldn't get input index");
        }).catch( (error) => {
            alert(error);
        });
    }
    
    return (
        <Tab.Group>
            <Tab.List className="tabs-header">
                <Tab
                    className={({selected}) => {return selected?"tabs-option-selected":"tabs-option"}}
                    >
                        <span className='flex justify-center items-center text-xl'>
                            <CollectionsIcon/>
                            <span className="ms-1">Collected Moments</span>
                        </span>
                </Tab>

                <Tab
                    className={({selected}) => {return selected?"tabs-option-selected":"tabs-option"}}
                    >
                        <span className='flex justify-center items-center text-xl'>
                            <AccountCircleIcon/>
                            <span className="ms-1">Account</span>
                        </span>
                </Tab>

            </Tab.List>

            <Tab.Panels className="tab-content">
                <Tab.Panel className="">
                    <Suspense fallback={loadingFallback()}>
                        <Moments propos={{user_address:wallet?.accounts[0].address}} releaseFunction={releaseFunction}/>
                    </Suspense>
                </Tab.Panel>
    
                <Tab.Panel className="">
                    <Account wallet={wallet}/>
                    
                </Tab.Panel>

            </Tab.Panels>
        </Tab.Group>
    );
}