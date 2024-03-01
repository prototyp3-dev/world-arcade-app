"use client"

import React, { useState, useEffect, cache } from 'react'

import { useConnectWallet } from "@web3-onboard/react";
import { useRouter } from "next/navigation";

import Dashboard from "../components/Dashboard";

export default function DashboardPage() {
    const [{ wallet } ] = useConnectWallet();
    const router = useRouter();

    // wallet not connected, push to homepage
    if (!wallet || wallet.accounts.length == 0) {
        router.push("/");
        return;
    }
    
    return (
        <main>
            <section>
                {/* Dashboard Page for {wallet?.accounts[0].address} */}
                <Dashboard wallet={wallet}/>
            </section>
        </main>
    )
}