import AddIcon from '@mui/icons-material/Add';
import Link from 'next/link'
import Image from "next/image";
import { achievementsMockDict } from '../utils/mocks';
import { delay } from '../utils/util';


const getAchievements = async(id:string) => {
    delay(1500);

    return achievementsMockDict.get(id);
}



export default async function CartridgeAchievements({cartridge_id}:{cartridge_id:string}) {
    const achievements = await getAchievements(cartridge_id);


    return (
        <div className="element rounded grid grid-cols-6 items-center justify-items-center">
            <Link className="flex flex-col items-center p-4 text-center hover-color" href={`/achievement/create/${cartridge_id}`}>
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
                                alt={cartridge_id}
                                src={`/achievement-trophy.jpg`}
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