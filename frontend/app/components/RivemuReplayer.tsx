"use client"

import Script from "next/script";
import { useContext, useEffect, useState } from "react";
import { SelectedMomentsContext } from "./SelectedMomentsProvider";

import CloseIcon from '@mui/icons-material/Close';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RestartIcon from '@mui/icons-material/RestartAlt';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import { ethers } from "ethers";

export interface RivemuReplayerGameplay {
    id:string,
    log:Uint8Array,
    achievementId?:number,
    achievementFrame?:number
}

export default function RivemuReplayer({cartridgeData, gameplay}:{cartridgeData:Uint8Array, gameplay:RivemuReplayerGameplay}) {
    const [isHidden, setIsHidden] = useState(false);
    const [overallScore, setOverallScore] = useState(0);
    const [currFrame, setCurrFrame] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const {pickMoment} = useContext(SelectedMomentsContext);
    
    
    const inCard = new Uint8Array([]);
    const args = "";
    const scoreFunction = "";

    
    useEffect(() => {
        if (cartridgeData && gameplay.log) {
            setIsHidden(false);
            //rivemuReplay();
        }
    }, [gameplay])


    async function rivemuReplay() {
        console.log("rivemuReplay");

        // @ts-ignore:next-line
        if (Module.quited) {
            // restart wasm when back to page
            // @ts-ignore:next-line
            Module._main();
        }

        await rivemuHalt();
        setOverallScore(0);

        // @ts-ignore:next-line
        const cartridgeBuf = Module._malloc(cartridgeData.length);
        
        // @ts-ignore:next-line
        const rivlogBuf = Module._malloc(gameplay.log.length);
        
        // @ts-ignore:next-line
        Module.HEAPU8.set(cartridgeData, cartridgeBuf);
        
        // @ts-ignore:next-line
        Module.HEAPU8.set(gameplay.log, rivlogBuf);
        
        // @ts-ignore:next-line
        let incardBuf = Module._malloc(inCard.length);
        
        // @ts-ignore:next-line
        Module.HEAPU8.set(inCard, incardBuf);
        
        // @ts-ignore:next-line
        Module.ccall(
            "rivemu_start_replay",
            null,
            ['number', 'number', 'number', 'number', 'string', 'number', 'number'],
            [
                cartridgeBuf,
                cartridgeData.length,
                incardBuf,
                inCard.length,
                args,
                rivlogBuf,
                gameplay.log.length
            ]
        );
        // @ts-ignore:next-line
        Module._free(cartridgeBuf);
        // @ts-ignore:next-line
        Module._free(rivlogBuf);
        // @ts-ignore:next-line
        Module._free(incardBuf);
    }

    async function rivemuHalt() {
        // @ts-ignore:next-line
        if (Module.ccall('rivemu_stop')) {
            await waitEvent('rivemu_on_shutdown');
        }
    }

    function waitEvent(name: string) {
        return new Promise((resolve) => {
            const listener = (e: any) => {
                window.removeEventListener(name, listener);
                resolve(e);
            }
            window.addEventListener(name, listener);
        })
    }

    async function rivemuStop(close?:boolean) {
        console.log("rivemuStop");
        rivemuHalt();
        if (close) setIsHidden(true);
        setIsPlaying(false);
    }

    if (typeof window !== "undefined") {
        var decoder = new TextDecoder("utf-8");

        // @ts-ignore:next-line
        window.rivemu_on_begin = function (width: number, height: number, target_fps: number, total_frames: number) {
            console.log("rivemu_on_begin");
            setIsPlaying(true);
        };
        
        // @ts-ignore:next-line
        window.rivemu_on_frame = function (
            outcard: ArrayBuffer,
            frame: number,
            fps: number,
            mips: number,
            cpu_usage: number,
            cycles: number
        ) {
            let score = 0;
            if (decoder.decode(outcard.slice(0,4)) == 'JSON') {
                const outcard_str = decoder.decode(outcard);
                const outcard_json = JSON.parse(outcard_str.substring(4));
                score = outcard_json.score;
            }
            setOverallScore(score);
            setCurrFrame(frame);
        };

        // @ts-ignore:next-line
        window.rivemu_on_finish = function (
            rivlog: ArrayBuffer,
            outcard: ArrayBuffer,
            outhash: string
        ) {
            rivemuStop();
            console.log("rivemu_on_finish")
        };
    }
    
    return (
        <div hidden={isHidden}>
            <section className='gameplay-screen fixed z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'>
                <div className='relative bg-gray-500 p-2 text-center'>
                    <span>Score: {overallScore} | Current Frame: {currFrame} {gameplay.achievementFrame? `| Achievement Frame: ${gameplay.achievementFrame}`:""}</span>
                    <button className="bg-gray-700 text-white absolute top-1 end-2.5 border border-gray-700 hover:border-black"
                        onKeyDown={() => null} onKeyUp={() => null}
                        onClick={() => isPlaying? rivemuStop(true): setIsHidden(true)}
                    >
                        <CloseIcon/>
                    </button>
                </div>

                <div className='bg-black max-h-full max-w-full'
                    >
                    <div className='flex justify-center gameplay-screen max-h-full max-w-full'>
                        <canvas
                            className='max-h-full max-w-full'
                            id="canvas"
                            height={768}
                            width={768}
                            onContextMenu={(e) => e.preventDefault()}
                            tabIndex={-1}
                            style={{
                                imageRendering: "pixelated",
                                objectFit: "contain"
                            }}
                        />
                    </div>
                </div>
                <div className="flex bg-gray-500">
                    <button className="bg-gray-700 text-white border border-gray-700 hover:border-black"
                        onKeyDown={() => null} onKeyUp={() => null}
                        onClick={rivemuReplay}>
                            {
                                isPlaying?
                                    <RestartIcon/>
                                :
                                    <PlayArrowIcon/>
                            }
                    </button>
                    
                    {
                        isPlaying?
                            <button className="bg-gray-700 text-white border border-gray-700 hover:border-black"
                            onKeyDown={() => null} onKeyUp={() => null}
                            onClick={() => pickMoment({
                                    gameplay_id: gameplay.id,
                                    frame: currFrame,
                                    args: args,
                                    in_card: ethers.utils.hexlify(inCard),
                                    outcard_hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
                                    user_achievement: gameplay.achievementId? gameplay.achievementId: 0,
                                    log: ethers.utils.hexlify(gameplay.log)
                                })
                            }>
                                <ThumbUpIcon/>
                            </button>
                        :
                            ""
                    }
                </div>
                <Script src="/rivemu.js?" strategy="lazyOnload" />
            </section>
            <div className="opacity-60 fixed inset-0 z-0 bg-black" onClick={() => close()}></div>
        </div>
    );
}