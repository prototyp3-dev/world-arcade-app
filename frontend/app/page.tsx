import Image from "next/image";
import Link from 'next/link'

import { cartridges as cartridgerequest } from "@/app/libs/app/lib";
import { CartridgeInfo } from "./libs/app/ifaces";
import { cache } from "react";
import { envClient } from "./utils/clientEnv";

const getCartridges = cache(async () => {
	const cartridges:Array<CartridgeInfo> = (await cartridgerequest({},{decode:true, cartesiNodeUrl: envClient.CARTESI_NODE_URL,cache:"force-cache"})).data;

    return cartridges;
})

export default async function Home() {
    const cartridges = await getCartridges();

    return (
        <main>
            <section>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {
                        cartridges.map((cartridge) => {
                            return (
                                <Link key={cartridge.id} href={`/cartridge/${cartridge.id}`}>
                                    <div className="p-4 element border border-transparent hover:border-white">
                                        <div className="text-lg">
                                            {cartridge.name.toUpperCase()}
                                        </div>
                                        
                                        <div className="relative h-64 w-full">
                                            <Image 
                                                alt={cartridge.name}
                                                src={cartridge.cover? `data:image/png;base64,${cartridge.cover}`:""}
                                                fill={true}
                                            />
                                        </div>
                                    </div>                                
                                </Link>
                            )
                        })
                    }
                </div>
            </section>
        </main>
    );
}