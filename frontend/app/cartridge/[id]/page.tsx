
import { cartridgeMockList, achievementsMockDict } from "@/app/utils/mocks"
import { delay } from "@/app/utils/util"
import CartridgeOptions from "@/app/components/CartridgeOptions";


const getCartridge = async(id:string) => {
    delay(1500);

    for (let i = 0; i < cartridgeMockList.length; i++) {
        if (cartridgeMockList[i].id == id)
            return cartridgeMockList[i];
    }
}



export default async function Cartridge({ params }: { params: { id: string } }) {
    const cartridge = await getCartridge(params.id);

    if (!cartridge) return <></>;

    return (
        <main>
            <section>
                <div className="text-6xl mb-4">
                    {cartridge.name}
                </div>

                
                <CartridgeOptions cartridge={cartridge} />            
            </section>
        </main>
    )
}