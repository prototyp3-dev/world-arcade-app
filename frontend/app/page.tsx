import Image from "next/image";
import { cartridgeMockList } from "./utils/mocks";
import Link from 'next/link'

export default function Home() {
    return (
        <main>
            <section>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {
                        cartridgeMockList.map((cartridge, index) => {
                            return (
                                <Link key={cartridge.id} href={`/cartridge/${cartridge.id}`}>
                                    <div className="p-4 element border border-transparent hover:border-white">
                                        <div className="text-lg">
                                            {cartridge.name.toUpperCase()}
                                        </div>
                                        
                                        <div className="relative h-64 w-full">
                                            <Image 
                                                alt={cartridge.name}
                                                src={`/${cartridge.cover}`}
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