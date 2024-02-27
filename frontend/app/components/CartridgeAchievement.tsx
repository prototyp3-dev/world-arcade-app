"use client"

import Image from "next/image";
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import { AchievementInfo } from "@/app/libs/achievements/ifaces";

export default function CartridgeAchievement({achievement}:{achievement:AchievementInfo}) {
    function playReplay(userAchievement: any): void {
        throw new Error("Function not implemented.");
    }

    console.log(achievement.users?.length, achievement.total_cartridge_players)

    let obtainedPercentage:number = 0.0;

    if (achievement.users && achievement.total_cartridge_players) {
        obtainedPercentage = (achievement.users.length / achievement.total_cartridge_players) *100;
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
                <table className="w-max">
                    <thead className="font-bold">
                        <tr className="border-b">
                            <th className="px-12 py-3">
                                ID
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
                                            {new Date(userAchievement.timestamp*1000).toLocaleString()}
                                        </td>
                                        <td className="px-12 py-4">
                                            <button title='Play Log' className='hover:text-gray-500' onClick={() => playReplay(userAchievement.gameplay_id)}><span><OndemandVideoIcon/></span></button>
                                        </td>
                                    </tr>
                                )
                            })
                        }
                    </tbody>
                </table>
            </div>


        </div>
    );
}