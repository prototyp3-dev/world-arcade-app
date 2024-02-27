"use client"

import { Tab } from "@headlessui/react";
import GamesIcon from '@mui/icons-material/Games';
import MovieIcon from '@mui/icons-material/Movie';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import VideogameAssetIcon from '@mui/icons-material/VideogameAsset';


import { CartridgeInfo } from "@/app/libs/app/ifaces";
import CartridgeAchievements from "./CartridgeAchievements";
import { Suspense } from "react";
import Rivemu from "@/app/components/Rivemu";


function loadingFallback() {
    return (
        <div className="btn w-full p-4 flex justify-center element">
            <div className='w-16 h-16 border-2 rounded-full border-current border-r-transparent animate-spin'></div>
        </div>
    )
}

export default function CartridgeOptions({cartridge}:{cartridge:CartridgeInfo}) {
    return (
        <Tab.Group>
            <Tab.List className="tabs-header">
                <Tab
                    className={({selected}) => {return selected?"tabs-option-selected":"tabs-option"}}
                    >
                        <span className='flex justify-center items-center text-xl'>
                            <EmojiEventsIcon/>
                            <span className="ms-1">Achievements</span>
                        </span>
                </Tab>

                <Tab
                    className={({selected}) => {return selected?"tabs-option-selected":"tabs-option"}}
                    >
                        <span className='flex justify-center items-center text-xl'>
                            <GamesIcon/>
                            <span className="ms-1">Gameplays</span>
                        </span>
                </Tab>

                <Tab
                    className={({selected}) => {return selected?"tabs-option-selected":"tabs-option"}}
                    >
                        <span className='flex justify-center items-center text-xl'>
                            <MovieIcon/>
                            <span className="ms-1">Moments</span>
                        </span>
                </Tab>

                <Tab
                    className={({selected}) => {return selected?"tabs-option-selected":"tabs-option"}}
                    >
                        <span className='flex justify-center items-center text-xl'>
                            <VideogameAssetIcon/>
                            <span className="ms-1">Play</span>
                        </span>
                </Tab>

            </Tab.List>

            <Tab.Panels className="tab-content">
                <Tab.Panel className="">
                    <Suspense fallback={loadingFallback()}>
                        <CartridgeAchievements cartridge_id={cartridge.id}/>
                    </Suspense>
                </Tab.Panel>
    
                <Tab.Panel className="">
                    List of Gameplays for {cartridge.name}
                </Tab.Panel>

                <Tab.Panel className="">
                    List of Moments for {cartridge.name}
                </Tab.Panel>

                <Tab.Panel className="">
                    <Rivemu cartridge={cartridge}/>
                </Tab.Panel>

            </Tab.Panels>
        </Tab.Group>
    );
}