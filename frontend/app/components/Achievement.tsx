"use client"

import Image from "next/image";
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import { AchievementInfo } from "@/app/libs/achievements/ifaces";
import { cache, useState } from "react";

import { cartridge as CartridgeData, getOutputs } from '../libs/app/lib';
import { envClient } from "../utils/clientEnv";
import RivemuReplayer from "./RivemuReplayer";
import { RivemuReplayerGameplay } from "./RivemuReplayer";

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


export default function Achievement({achievement}:{achievement:AchievementInfo}) {
    const [cartridgeData, setCartridgeData] = useState<Uint8Array | null>(null);
    const [gameplayData, setGameplayData] = useState<RivemuReplayerGameplay | null>(null);
    let obtainedPercentage:number = 0.0;

    if (achievement.users && achievement.total_cartridge_players) {
        obtainedPercentage = (achievement.users.length / achievement.total_cartridge_players) *100;
    }

    async function playReplay(gameplayId:string, achievementId:number, achievementFrame:number) {
        const snakeCartridgeId = "b8544d95861d5d47094e743fc291e7bc2c30ca662ff7b1daf91c66157f6165ce";
        let data;
        if (!cartridgeData) {
            // change to achievement.cartridge_id later
            data = await getCartridgeData(snakeCartridgeId);
            setCartridgeData(data);
        }

        // change to achievement.cartridge_id later
        const gameplayData = await getGameplayLog(gameplayId);
        setGameplayData({id: gameplayId, log:gameplayData, achievementId: achievementId, achievementFrame: achievementFrame});
    }

    return (
        <div className="element rounded p-4 flex flex-col justify-center">
            <div className="flex space-x-12">
                <div className="relative h-80 w-80">
                    <Image src={achievement.icon? `data:image/png;base64,${achievement.icon}`:"/made_it_symbol_trans.png"}
                        className="border-4 rounded-full"
                        alt={"Achievement Image"}
                        fill
                    />
                </div>

                
                <div className="flex flex-col">
                    <div className="flex flex-col mb-6">
                        <span className="text-6xl">{achievement.name}</span>
                        <span className="text-sm font-light">Creator: {achievement.created_by}</span>
                    </div>

                    <span className="">{achievement.description}</span>
                </div>
            </div>

            <div className="w-80 bg-gray-200 rounded-full h-4 my-4">
                <div className="element-inside h-4 rounded-full flex justify-center items-center" style={{width: `${obtainedPercentage}%`}}>
                    {`${obtainedPercentage}%`}
                </div>
            </div>


            <div className="w-full flex justify-center">
                <table className="w-max text-center">
                    <thead className="font-bold">
                        <tr className="border-b">
                            <th className="px-12 py-3">
                                ID
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
                            achievement.users?.map((userAchievement, index) => {
                                return (
                                    <tr className={`${index < achievement.users!.length-1? "border-b":"" }`} key={userAchievement.index}>
                                        <td className="px-12 py-4">
                                            {userAchievement.index}
                                        </td>
                                        <td className="px-12 py-4">
                                            {userAchievement.user_address}
                                        </td>
                                        <td className="px-12 py-4">
                                            {new Date(userAchievement.timestamp*1000).toLocaleString()}
                                        </td>
                                        <td className="px-12 py-4">
                                            {
                                                userAchievement.gameplay_id && userAchievement.gameplay_id.length > 0?
                                                    <button title='Play Log' className='hover:text-gray-500' onClick={() => playReplay(userAchievement.gameplay_id!, userAchievement.id, userAchievement.frame)}><span><OndemandVideoIcon/></span></button>
                                                :
                                                    <></>
                                            }
                                        </td>
                                    </tr>
                                )
                            })
                        }
                    </tbody>
                </table>
            </div>

            {
                cartridgeData && gameplayData?
                    <RivemuReplayer cartridgeData={cartridgeData} gameplay={gameplayData} />
                :
                    <></>
            }
        </div>
    );
}