"use client"

import React, { useEffect, useState } from "react";

import { envClient } from '../utils/clientEnv';
import { genericGetOutputs } from "../libs/cartesapp/lib";
import { Erc20Event, decodeToModel } from "../libs/wallet/lib";
import { ethers, BigNumber } from "ethers";
import LineChart from "@/app/components/LineChart";
import DepositModal, { MODAL_OPTIONS } from "@/app/components/DepositModal";
import { Dialog } from "@headlessui/react";


function AccountWalletOperations({user_address, reload}:{user_address:string, reload:number}) {
    const [erc20events,setErc20events] = useState<Erc20Event[]>();
    const [modalOption, setModalOption] = useState({show: false, option: MODAL_OPTIONS.DEPOSIT});

    const swapDisabled = envClient.DAPP_ADDR.toLowerCase() === "0x70ac08179605AF2D9e75782b8DEcDD3c22aA4D0C".toLowerCase();
        
    const doReload = () => {
        genericGetOutputs(
            {
                tags: ["wallet","erc20",envClient.ACCPTED_TOKEN.toLocaleLowerCase(),user_address],
                output_type: 'notice'
            },
            decodeToModel,
            {cartesiNodeUrl: envClient.CARTESI_NODE_URL}
        ).then(
            (evs: Erc20Event[]) => {
                console.log(evs)
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
            <div className="flex flex-col">
                <div className="h-min element-inside rounded p-4 max-h-96 overflow-y-auto">
                        <span className="text-xl">Receipt</span>
                    {
                        sortedErc20Events.map((ev: Erc20Event, index: number) => {
                            return (
                                <div key={index} className="grid grid-cols-2 space-x-4">
                                    <div className={`text-md ${BigNumber.from(ev.mod_amount).toBigInt() < 0 ? "text-red-500" : "text-green-500"}`}>
                                        <span>{(new Date(Number(ev._timestamp)*1000)).toLocaleString()}</span>
                                    </div>
                                    <div className={`text-md ${BigNumber.from(ev.mod_amount).toBigInt() < 0 ? "text-red-500" : "text-green-500"}`}>
                                        <span>{ethers.utils.formatUnits(`${ev.mod_amount}`,envClient.ACCPTED_TOKEN_DECIMALS).toString()}</span>
                                    </div>
                                </div>
                            )
                        })
                    }
                    
                </div>

                {
                    !swapDisabled?
                        <button className="mt-4 p-2 border hover-color" onClick={() => setModalOption({show: true, option: MODAL_OPTIONS.SWAP})}>
                            0x Swap
                        </button>
                    :
                        <></>
                }

                <button className="mt-2 p-2 border hover-color" onClick={() => setModalOption({show: true, option: MODAL_OPTIONS.DEPOSIT})}>
                    Deposit
                </button>
            </div>
            <LineChart balances={sortedErc20Events}/>



            <Dialog open={modalOption.show} onClose={() => setModalOption({show: false, option: modalOption.option})}>
                <Dialog.Panel className={"rounded max-w-md absolute z-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-4 element-inside"}>
                    <DepositModal option={modalOption.option}/>
                </Dialog.Panel>
            </Dialog>
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