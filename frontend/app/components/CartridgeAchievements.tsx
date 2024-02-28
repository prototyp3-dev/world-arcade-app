"use client"


import AddIcon from '@mui/icons-material/Add';
import Link from 'next/link'
import Image from "next/image";
import { cache, useEffect, useState } from 'react';

import { achievements } from '../libs/achievements/lib';
import { AchievementInfo, AchievementsPayload } from '../libs/achievements/ifaces';
import { envClient } from '../utils/clientEnv';
import { useConnectWallet } from '@web3-onboard/react';


const getAchievements = cache(async(id:string, user:string) => {
    let parameters:AchievementsPayload = {};
    if (id.length > 0) parameters.cartridge_id = id;
    if (user.length > 0) parameters.player = user;

    const achievementList:Array<AchievementInfo> = (await achievements(parameters, {cartesiNodeUrl: envClient.CARTESI_NODE_URL, decode: true})).data;

    return achievementList;
})



export default function CartridgeAchievements({cartridge_id}:{cartridge_id?:string}) {
    const [achievements, setAchievements] = useState<Array<AchievementInfo>|null>(null);
    const [{ wallet }] = useConnectWallet();

    const selectedCartridgeId = cartridge_id || "";
    const user = wallet? wallet.accounts[0].address: "";

    useEffect(() => {
        getAchievements(selectedCartridgeId, user).then((achievementList) => setAchievements(achievementList));
    }, [wallet?.accounts[0]])


    return (
        <div className="element rounded grid grid-cols-6 items-center justify-items-center">
            <Link className="flex flex-col items-center p-4 text-center hover-color" href={`/achievement/create/${selectedCartridgeId}`}>
                <div className="border-4 rounded-full">
                    <AddIcon style={{width: "128px", height: "128px"}}/>
                </div>
                <span className="text-2xl">Create Achievement</span>
            </Link>

            {
                !achievements?
                    <div className="btn w-full p-4 flex justify-center element">
                        <div className='w-16 h-16 border-2 rounded-full border-current border-r-transparent animate-spin'></div>
                    </div>
                :
                    achievements.map((achievement, index) => {
                        const obtainedPercentage = (achievement.total_players_achieved / achievement.total_cartridge_players)*100;
                        return (
                            <Link key={achievement.id} className={`flex flex-col items-center p-4 text-center hover-color ${achievement.player_achieved? "": "opacity-50" }`} href={`/achievement/${achievement.id}`}>
                                <Image className="rounded-full border-4"
                                    alt={achievement.name}
                                    src={achievement.icon? `data:image/png;base64,${achievement.icon}`:"/made_it_symbol_trans.png"}
                                    width={128}
                                    height={128}
                                />
                                <span className="text-2xl">{achievement.name}</span>
                                <div className="w-[128px] bg-gray-200 rounded-full h-4 my-4">
                                    <div className="element-inside h-4 rounded-full flex justify-center items-center" style={{width: `${obtainedPercentage}%`}}>
                                        {`${obtainedPercentage}%`}
                                    </div>
                                </div>
                            </Link>
                        )
                    })
            }
        </div>
    )
}