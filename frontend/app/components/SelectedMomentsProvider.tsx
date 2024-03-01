'use client'


import { cache, createContext, useState } from 'react';
import { CollectMomentPayload, GameplayInfo } from "@/app/libs/achievements/ifaces";
import { CartridgeInfo } from "@/app/libs/app/ifaces";
import { cartridgeInfo } from '../libs/app/lib';
import { envClient } from '../utils/clientEnv';
import { collectMoment, gameplayInfo } from '../libs/achievements/lib';
import { useConnectWallet } from '@web3-onboard/react';
import { ethers } from 'ethers';

const getCartridge = cache(async (id:string) => {
	const cartridge:CartridgeInfo = await cartridgeInfo({id: id},{decode:true, cartesiNodeUrl: envClient.CARTESI_NODE_URL, cache:"force-cache"});

    return cartridge;
})

const getCartridgeId = cache(async (gameplayId:string) => {
    const gameplay:GameplayInfo = await gameplayInfo({id: gameplayId}, {decode:true, cartesiNodeUrl: envClient.CARTESI_NODE_URL});
    
    return gameplay;
})


export interface CollectMomentExtended extends CollectMomentPayload {
    cartridge_id:string
}
export const SelectedMomentsContext = createContext<{
    selectedMoments: Array<SelectedMoment>, pickMoment(moment:CollectMomentExtended):void, collectSelectedMoment(momentIndex:number):void
}>({selectedMoments: [], pickMoment: (moment:CollectMomentExtended) => null, collectSelectedMoment: (momentIndex:number) => null});


export interface SelectedMoment extends CollectMomentExtended {
    gameName:string,
    cover:string
}


export function SelectedMomentsProvider({ children }:{ children: React.ReactNode }) {
    const [selectedMoments, setSelectedMoments] = useState<Array<SelectedMoment>>([]);
    const [{ wallet }] = useConnectWallet();
    const [cartridgesName,setCartridgesName] = useState(new Map<string,string>())

    const pickMoment = async (moment:CollectMomentExtended) => {
        const canvas = document.getElementById("canvas");
        let coverImage = "";
        if (canvas) {
            coverImage = (canvas as HTMLCanvasElement).toDataURL('image/jpeg');
        }

        if (!cartridgesName.has(moment.cartridge_id)) {
            const cartridge = await getCartridge(moment.cartridge_id);
            cartridgesName.set(moment.cartridge_id, cartridge.name);
            setCartridgesName(cartridgesName);
        }

        setSelectedMoments([...selectedMoments, {...moment, cover:coverImage, gameName: cartridgesName.get(moment.cartridge_id)||""}]);
    }

    const collectSelectedMoment = async (momentIndex:number) => {
        if (!wallet) {
            alert("Connect a wallet first");
            return;
        }

        const signer = new ethers.providers.Web3Provider(wallet.provider, 'any').getSigner();

        const selectedMoment = selectedMoments[momentIndex];

        try {
            const receipt = await collectMoment(signer, envClient.DAPP_ADDR, {
                gameplay_id: "0x" + selectedMoment.gameplay_id,
                frame: selectedMoment.frame,
                log: selectedMoment.log,
                user_achievement: selectedMoment.user_achievement,
                args: selectedMoment.args,
                in_card: selectedMoment.in_card,
                outcard_hash: selectedMoment.outcard_hash
            }, {cartesiNodeUrl: envClient.CARTESI_NODE_URL});    

            setSelectedMoments(selectedMoments.filter((moment, index) => index !== momentIndex))
        } catch(error) {
            alert((error as Error).message);
        }
    }
 
    
    return (
        <SelectedMomentsContext.Provider value={ {selectedMoments, pickMoment, collectSelectedMoment} }>
            { children }
        </SelectedMomentsContext.Provider>
    );
}