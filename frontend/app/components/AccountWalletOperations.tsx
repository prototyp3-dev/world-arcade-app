"use client"

import React, { useEffect, useState } from "react";

import { envClient } from '../utils/clientEnv';
import { genericGetOutputs } from "../libs/cartesapp/lib";
import { Erc20Event, decodeToModel } from "../libs/wallet/lib";
import { ethers, BigNumber } from "ethers";
import LineChart from "@/app/components/LineChart";

function AccountWalletOperations({user_address, reload}:{user_address:string, reload:number}) {
    const [erc20events,setErc20events] = useState<Erc20Event[]>();
        
    const doReload = () => {
        genericGetOutputs(
            {
                tags: ["wallet","erc20",envClient.ACCEPTED_TOKEN.toLocaleLowerCase(),user_address],
                output_type: 'notice'
            },
            decodeToModel,
            {cartesiNodeUrl: envClient.CARTESI_NODE_URL}
        ).then(
            (evs: Erc20Event[]) => {
                setErc20events(evs);
            }
        );
    }

    useEffect( () => {
        doReload();
    },[reload]);

    
    if (!erc20events) return <></>;
    
    const sortedErc20Events = erc20events.sort((a,b)=>{
        if (!a._timestamp || !b._timestamp) return 0;
        return a._timestamp - b._timestamp;
    })
    
    return (
        <div className="flex justify-between">
            <div className="flex flex-col h-min element-inside rounded p-4 max-h-96 overflow-y-auto">
                <span className="text-xl">Receipt</span>
            {
                sortedErc20Events.map((ev: Erc20Event, index: number) => {
                    return (
                        <div key={index} className="grid grid-cols-2 space-x-4">
                            <div className={`text-md ${BigNumber.from(ev.mod_amount).toBigInt() < 0 ? "text-red-500" : "text-green-500"}`}>
                                <span>{(new Date(Number(ev._timestamp)*1000)).toLocaleString()}</span>
                            </div>
                            <div className={`text-md ${BigNumber.from(ev.mod_amount).toBigInt() < 0 ? "text-red-500" : "text-green-500"}`}>
                                <span>{ethers.utils.formatUnits(`${ev.mod_amount}`,envClient.ACCEPTED_TOKEN_DECIMALS).toString()}</span>
                            </div>
                        </div>
                    )
                })
            }
            </div>
            <LineChart balances={sortedErc20Events}/>
        </div>
    );
}


const arePropsEqual = (prevProps:{user_address:string, reload:number}, nextProps:{user_address:string, reload:number}) => {
    // change cartridge || log validated reload or reload btn
    if ((prevProps.user_address !== nextProps.user_address) || (prevProps.reload !== nextProps.reload)) {
        return false                                   // will re-render
    }
    return true                                      // donot re-render
}

export default React.memo(AccountWalletOperations, arePropsEqual)