'use client'


import { cache, createContext, useState } from 'react';
import { CollectMomentPayload, GameplayInfo } from "@/app/libs/achievements/ifaces";
import { CartridgeInfo } from "@/app/libs/app/ifaces";
import { cartridgeInfo } from '../libs/app/lib';
import { envClient } from '../utils/clientEnv';
import { gameplayInfo } from '../libs/achievements/lib';

const getCartridge = cache(async (id:string) => {
	const cartridge:CartridgeInfo = await cartridgeInfo({id: id},{decode:true, cartesiNodeUrl: envClient.CARTESI_NODE_URL, cache:"force-cache"});

    return cartridge;
})

const getCartridgeId = cache(async (gameplayId:string) => {
    const gameplay:GameplayInfo = await gameplayInfo({id: gameplayId}, {decode:true, cartesiNodeUrl: envClient.CARTESI_NODE_URL, cache:"force-cache"});
    
    return gameplay;
})

export const SelectedMomentsContext = createContext<{
    selectedMoments: Array<SelectedMoment>, pickMoment(moment:CollectMomentPayload):void
}>({selectedMoments: [], pickMoment: (moment:CollectMomentPayload) => null});

export interface SelectedMoment extends CollectMomentPayload {
    gameName:string,
    cover:string
}


export function SelectedMomentsProvider({ children }:{ children: React.ReactNode }) {
    const [selectedMoments, setSelectedMoments] = useState<Array<SelectedMoment>>([]);

    const pickMoment = async (moment:CollectMomentPayload) => {
        const canvas = document.getElementById("canvas");
        let coverImage = "";
        if (canvas) {
            coverImage = (canvas as HTMLCanvasElement).toDataURL('image/jpeg');
        }

        const gameplay = await getCartridgeId(moment.gameplay_id);
        const cartridge = await getCartridge(gameplay.cartridge_id);

        setSelectedMoments([...selectedMoments, {...moment, cover:coverImage, gameName: cartridge.name}]);
    }
 
    
    return (
        <SelectedMomentsContext.Provider value={ {selectedMoments, pickMoment} }>
            { children }
        </SelectedMomentsContext.Provider>
    );
}