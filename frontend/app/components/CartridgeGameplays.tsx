"use client"

import { cache, useEffect, useState } from "react";
import { GameplayInfo } from "../libs/achievements/ifaces";

import { GameplaysPayload } from "../libs/achievements/ifaces";
import { envClient } from "../utils/clientEnv";
import { useConnectWallet } from "@web3-onboard/react";
import { gameplays, getOutputs } from "../libs/achievements/lib";
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import RivemuReplayer, { RivemuReplayerGameplay } from "./RivemuReplayer";
import { cartridge as CartridgeData } from '../libs/app/lib';

const getGameplays = cache(async(id:string, user:string) => {
    let parameters:GameplaysPayload = {};
    if (id.length > 0) parameters.cartridge_id = id;
    if (user.length > 0) parameters.user_address = user;

    const gameplayList:Array<GameplayInfo> = (await gameplays(parameters, {cartesiNodeUrl: envClient.CARTESI_NODE_URL, decode: true})).data;

    return gameplayList;
})

const getCartridgeData = cache(async (id:string) => {
	const data = await CartridgeData({id:id},{decode:true,decodeModel:"bytes", cartesiNodeUrl: envClient.CARTESI_NODE_URL, cache:"force-cache"});

    return data;
})

const getGameplayLog = cache(async (gameplayId:string) => {
    const gameplayLog:Array<Uint8Array> = await getOutputs(
        {
            tags: [ "replay", gameplayId ],
            output_type: 'report'
        },
        {cartesiNodeUrl: envClient.CARTESI_NODE_URL}
    );

    if (gameplayLog.length > 0) {
        return gameplayLog[0];
    }

    return new Uint8Array();
})

export default function CartridgeGameplays({cartridge_id}:{cartridge_id?:string}) {
    const [cartridgeData, setCartridgeData] = useState<Uint8Array | null>(null);
    const [gameplayData, setGameplayData] = useState<RivemuReplayerGameplay | null>(null);

    const [gameplays, setGameplays] = useState<Array<GameplayInfo>|null>(null);
    const [{ wallet }] = useConnectWallet();

    const selectedCartridgeId = cartridge_id || "";
    const user = wallet? wallet.accounts[0].address.toLocaleLowerCase(): "";

    useEffect(() => {
        // get gameplays from all users
        getGameplays(selectedCartridgeId, "").then((gameplaysList) => setGameplays(gameplaysList))
    }, [])

    async function playReplay(gameplayId:string, cartridgeId:string) {
        let data;
        if (!cartridgeData) {
            data = await getCartridgeData(cartridgeId);
            setCartridgeData(data);
        }

        const gameplayData = await getGameplayLog(gameplayId);
        setGameplayData({id: gameplayId, log:gameplayData});
    }

    return (
        <div className="">
            {
                !gameplays?
                    <div className="btn w-full p-4 place-self-center flex justify-center element">
                        <div className='w-16 h-16 border-2 rounded-full border-current border-r-transparent animate-spin'></div>
                    </div>
                :
                <div className="w-full flex justify-center">
                    <table className="w-max text-center">
                        <thead className="font-bold">
                            <tr className="border-b">
                                <th className="px-12 py-3">
                                    Gameplay ID
                                </th>
                                <th className="px-12 py-3">
                                    User
                                </th>
                                <th className="px-12 py-3">
                                    Date
                                </th>
                                <th className="px-12 py-3">
                                    Replay
                                </th>
                            </tr>
                        </thead>
                        
                        <tbody>
                            {
                                gameplays.map((gameplay, index) => {
                                    return (
                                        <tr className={`${index < gameplays.length-1? "border-b":"" }`} key={gameplay.id}>
                                            <td title={gameplay.id} className="px-12 py-4 break-all">
                                                {gameplay.id.substring(0, 6)}...{gameplay.id.substring(gameplay.id.length-6)}
                                            </td>
                                            <td title={gameplay.user_address} className="px-12 py-4">
                                                {
                                                    user === gameplay.user_address.toLowerCase()?
                                                        "You"
                                                    :
                                                    gameplay.user_address.substring(0, 6)+"..."+gameplay.user_address.substring(gameplay.user_address.length-6)
                                                }
                                            </td>
                                            <td className="px-12 py-4">
                                                {new Date(gameplay.timestamp*1000).toLocaleString()}
                                            </td>
                                            <td className="px-12 py-4">
                                                <button title='Play Log' className='hover:text-gray-500' onClick={() => playReplay(gameplay.id, gameplay.cartridge_id)}><span><OndemandVideoIcon/></span></button>
                                            </td>
                                        </tr>
                                    );
                                })
                            }

                        </tbody>
                    </table>
                </div>
            }

            {
                cartridgeData && gameplayData?
                    <RivemuReplayer cartridgeData={cartridgeData} gameplay={gameplayData} />
                :
                    <></>
            }

        </div>
    );
}