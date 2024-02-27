import { Suspense } from "react";
import CartridgeAchievements from "../components/CartridgeAchievements";


function loadingFallback() {
    return (
        <div className="btn w-full p-4 flex justify-center element">
            <div className='w-16 h-16 border-2 rounded-full border-current border-r-transparent animate-spin'></div>
        </div>
    )
}

export default function Achievements() {
    return (
        <main>
            <section>
                <div className="element rounded p-4">
                    <Suspense fallback={loadingFallback()}>
                        <CartridgeAchievements />
                    </Suspense>
                </div>
            </section>
        </main>
    );
}