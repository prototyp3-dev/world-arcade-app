import { cartridgeInfo } from "@/app/libs/app/lib";
import CartridgeOptions from "@/app/components/CartridgeOptions";
import { cache } from "react";
import { CartridgeInfo } from "@/app/libs/app/ifaces";
import { envClient } from "@/app/utils/clientEnv";
import CartridgeAchievements from "@/app/components/CartridgeAchievements";



const getCartridge = cache(async (id:string) => {
	const cartridge:CartridgeInfo = await cartridgeInfo({id: id},{decode:true, cartesiNodeUrl: envClient.CARTESI_NODE_URL,cache:"force-cache"});

    return cartridge;
})


export default async function Cartridge({ params }: { params: { id: string } }) {
    const cartridge = await getCartridge(params.id);

    if (!cartridge) return <></>;

    const props = {
        cartridge:cartridge,
        children:{achievements:<CartridgeAchievements cartridge_id={cartridge.id} />}
    }

    return (
        <main>
            <section>
                <div className="text-6xl mb-4">
                    {cartridge.name}
                </div>

                
                <CartridgeOptions props={props} >
                    
                </CartridgeOptions>
            </section>
        </main>
    )
}