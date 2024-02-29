"use client"


import { useConnectWallet } from "@web3-onboard/react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
    const [{ wallet } ] = useConnectWallet();
    const router = useRouter()


    // wallet not connected, push to homepage
    if (!wallet || wallet.accounts.length == 0) router.push("/");
    
    return (
        <main>
            <section>
                Dashboard Page for {wallet?.accounts[0].address}
            </section>
        </main>
    )
}