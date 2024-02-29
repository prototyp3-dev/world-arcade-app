"use client"

import { useConnectWallet } from "@web3-onboard/react";
import { useContext, useState } from "react";

import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import CloseIcon from '@mui/icons-material/Close';
import { SelectedMomentsContext } from "./SelectedMomentsProvider";
import Image from "next/image";




export default function SelectedMoments() {
    const [{ wallet }] = useConnectWallet();
    const [showHistory, setShowHistory] = useState(false);

    const {selectedMoments, collectSelectedMoment} = useContext(SelectedMomentsContext);
    
    if (!wallet) return <></>;

    return(
        <>
            <div className="expand-log-btn">
                <button onClick={()=>setShowHistory(true)}>
                    <KeyboardArrowUpIcon/>
                    Picked Moments
                </button>
            </div>

            <div hidden={!showHistory} className={`absolute top-0 right-0 z-40 w-64 h-screen p-4 overflow-y-auto transition-transform bg-gray-500`}>
                <h5 className={`text-base font-semibold uppercase`}>Selected Moments</h5>
                <button type="button" onClick={()=>setShowHistory(false)} className="bg-transparent rounded-lg text-sm p-1.5 absolute top-2.5 end-2.5 inline-flex items-center hover:bg-gray-400 dark:hover:bg-gray-600" >
                    <CloseIcon/>
                    <span className="sr-only">Close menu</span>
                </button>
                <div className="pb-4 overflow-y-auto">
                    <div className={`sticky top-0 border-b border-current text-xs`}>Total: {selectedMoments.length}</div>
                    <ul className="space-y-2 font-medium">
                        {
                            selectedMoments.map((moment, index) => {
                                return (
                                    <li key={index} className="py-2 border-b hover:underline">
                                        <button className="flex w-full" onClick={() => collectSelectedMoment(index)}>
                                            <Image className="border" width={50} height={50} src={moment.cover} alt={"Cover Not found"}/>
                                            <div className="w-full flex flex-col items-start ms-2">
                                                <span className="font-bold">
                                                    {moment.gameName}
                                                </span>
                                                <span>
                                                    Frame:{moment.frame}
                                                </span>
                                            </div>
                                        </button>
                                    </li>
                                )
                            })
                        }
                    </ul>
                </div>
            </div>
        </>
    )
}