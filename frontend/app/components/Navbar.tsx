'use client'

import Link from 'next/link'
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from 'react'
import { useConnectWallet } from '@web3-onboard/react';
function Navbar() {
    const pathname = usePathname();
    const [{ wallet, connecting }, connect, disconnect] = useConnectWallet();
    const [connectButtonTxt, setConnectButtonTxt] = useState("Connect");


    useEffect(() => {
        if (connecting) {
            setConnectButtonTxt('Connecting');
        } else if (wallet) {
            setConnectButtonTxt('Disconnect');
        } else {
            setConnectButtonTxt('Connect');
        }
    }, [connecting, wallet])

    return (
        <header className='navbar'>
            <Link href={"/"} className={`invisible md:visible h-full grid grid-cols-1 items-center navbar-item ${pathname === "/" ? "navbar-item-active" : "" }`}>
                Games
            </Link>

            <Link href={"/gameplays"} className={`invisible md:visible h-full grid grid-cols-1 items-center navbar-item ${pathname === "/gameplays" ? "navbar-item-active" : "" }`}>
                Gameplays
            </Link>

            <Link href={"/moments"} className={`invisible md:visible h-full grid grid-cols-1 items-center navbar-item ${pathname === "/moments" ? "navbar-item-active" : "" }`}>
                Moments
            </Link>

            <Link href={"/achievements"} className={`invisible md:visible h-full grid grid-cols-1 items-center navbar-item ${pathname === "/achievements" ? "navbar-item-active" : "" }`}>
                Achievements
            </Link>

            <div className='flex-1 flex justify-end'>
                <button className='navbar-item' disabled={connecting}
                    onClick={() => (wallet ? disconnect(wallet) : connect())}
                >
                    {connectButtonTxt}
                </button>
            </div>
        </header>
    )
}

export default Navbar