import { cache } from "react"
import { achievementInfo } from "@/app/libs/achievements/lib";
import { AchievementInfo } from "@/app/libs/achievements/ifaces";
import { envClient } from "@/app/utils/clientEnv";
import Achievement from "@/app/components/Achievement";

const getAchievement = cache(async (id:string) => {
    const achievement = await achievementInfo({id: id}, {cartesiNodeUrl: envClient.CARTESI_NODE_URL, decode: true});
    return achievement;
})

export default async function AchievementPage({ params }: { params: { id: string } }) {
    const achievement:AchievementInfo = await getAchievement(params.id);

    return (
        <main>
            <section>
                <Achievement achievement={achievement} />
            </section>
        </main>
    )
}