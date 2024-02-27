import AddIcon from '@mui/icons-material/Add';
import Link from 'next/link'
import Image from "next/image";
import { achievementsMockDict } from '../utils/mocks';
import { delay } from '../utils/util';


const getAchievements = async(id:string) => {
    await delay(1500);

    if (id.length == 0) {
        // get all achievements
    } else {
        // get achievements for a specific cartridge
    }

    return achievementsMockDict.get(id);
}



export default async function CartridgeAchievements({cartridge_id}:{cartridge_id?:string}) {
    const selectedCartridgeId = cartridge_id || "";
    const achievements = await getAchievements(selectedCartridgeId);


    return (
        <div className="element rounded grid grid-cols-6 items-center justify-items-center">
            <Link className="flex flex-col items-center p-4 text-center hover-color" href={`/achievement/create/${selectedCartridgeId}`}>
                <div className="border-4 rounded-full">
                    <AddIcon style={{width: "128px", height: "128px"}}/>
                </div>
                <span className="text-2xl">Create Achievement</span>
            </Link>

            {
                achievements?.map((achievement, index) => {
                    return (
                        <Link className="flex flex-col items-center p-4 text-center hover-color" href={`/achievement/${achievement.id}`}>
                            <Image className="rounded-full border-4"
                                alt={achievement.name}
                                src={`/made_it_symbol_trans.jpg`}
                                width={128}
                                height={128}
                            />
                            <span className="text-2xl">{achievement.name}</span>
                        </Link>
                    )
                })
            }
        </div>
    )
}