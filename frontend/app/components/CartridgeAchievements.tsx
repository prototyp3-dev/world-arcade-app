import AddIcon from '@mui/icons-material/Add';
import Image from "next/image";
import { cache } from 'react';

import { achievements } from '../libs/achievements/lib';
import { AchievementInfo } from '../libs/achievements/ifaces';
import { envClient } from '../utils/clientEnv';


const getAchievements = cache(async(id:string) => {
    let achievementList:Array<AchievementInfo>;
    if (id.length == 0) {
        // get all achievements
        achievementList = (await achievements({}, {cartesiNodeUrl: envClient.CARTESI_NODE_URL, decode: true})).data;
    } else {
        // get achievements for a specific cartridge
        achievementList = (await achievements({cartridge_id: id}, {cartesiNodeUrl: envClient.CARTESI_NODE_URL, decode: true})).data;
    }

    return achievementList;
})



export default async function CartridgeAchievements({cartridge_id}:{cartridge_id?:string}) {
    const selectedCartridgeId = cartridge_id || "";
    const achievements = await getAchievements(selectedCartridgeId);


    return (
        <div className="element rounded grid grid-cols-6 items-center justify-items-center">
            <a className="flex flex-col items-center p-4 text-center hover-color" href={`/achievement/create/${selectedCartridgeId}`}>
                <div className="border-4 rounded-full">
                    <AddIcon style={{width: "128px", height: "128px"}}/>
                </div>
                <span className="text-2xl">Create Achievement</span>
            </a>

            {
                achievements.map((achievement, index) => {
                    return (
                        <a key={achievement.id} className="flex flex-col items-center p-4 text-center hover-color" href={`/achievement/${achievement.id}`}>
                            <Image className="rounded-full border-4"
                                alt={achievement.name}
                                src={achievement.icon? `data:image/png;base64,${achievement.icon}`:"/made_it_symbol_trans.png"}
                                width={128}
                                height={128}
                            />
                            <span className="text-2xl">{achievement.name}</span>
                        </a>
                    )
                })
            }
        </div>
    )
}