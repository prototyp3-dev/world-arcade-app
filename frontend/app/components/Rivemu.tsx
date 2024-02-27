"use client"


import React, { useState, useEffect, cache } from 'react'
import Script from "next/script";
import {Parser} from 'expr-eval';


import { CartridgeInfo } from "@/app/libs/app/ifaces";
import { cartridge as CartridgeData } from '../libs/app/lib';
import { envClient } from '../utils/clientEnv';

import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import StopIcon from '@mui/icons-material/Stop';
import ReplayIcon from '@mui/icons-material/Replay';


const getCartridgeData = cache(async (id:string) => {
	const data = await CartridgeData({id:id},{decode:true,decodeModel:"bytes", cartesiNodeUrl: envClient.CARTESI_NODE_URL, cache:"force-cache"});

    return data;
})


interface Gameplay {
    gameplayLog:Uint8Array,
    outcard:Uint8Array,
    outhash:string
}

function Rivemu({cartridge, inCard, args, selectedScoreFunction}:
    {cartridge:CartridgeInfo,inCard?:Uint8Array, args?:string, selectedScoreFunction?:string}) {
    const [overallScore, setOverallScore] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isReplaying, setIsReplaying] = useState(false);
    const [cancelled, setCancelled] = useState(false);
    const [playedOnce, setPlayedOnce] = useState(false);
    // const [replayLog, setReplayLog] = useState<Uint8Array|undefined>(undefined);
    const [freshOpen, setFreshOpen] = useState(true);


    const [cartridgeData, setCartridgeData] = useState<Uint8Array | null>(null);
    const [cartridgeGameplay, setCartridgeGameplay] = useState<Gameplay | null>(null);

    useEffect(() => {
        if (cartridge) initialize();
    }
    ,[cartridge])

    // useEffect(() => {
    //     if (!isPlaying) {
    //         rivemuReplay();
    //     }
    // }, [replayLog])

    // useEffect(() => {
    //     if (cancelled) {
    //         setIsPlaying(false);
    //         rivemuHalt();
    //         setOverallScore(0);
    //         stopCartridge();
    //     }
    // }, [cancelled])

    // useEffect(() => {
    //     interface keyboardEvent {key:string}
    //     const escPressed = (event: keyboardEvent) => {
    //         console.log(event, isPlaying);
    //         if (event.key === "Escape" && !isPlaying) {
    //             stopCartridge();
    //         }
    //     }

    //     document.addEventListener("keydown", escPressed);

    // })

    async function initialize() {
        if (!cartridgeData) {
            setIsPlaying(false);
            setOverallScore(0);
            // setReplayLog(undefined);
        }
        await loadCartridge();
        // if (selectedCartridge?.replay){
        //     setReplayLog(selectedCartridge.replay);
        //     setIsReplaying(true);
        // }
        // if (cartridgeGameplay) {
        //     setReplayLog(cartridgeGameplay);
        //     setIsReplaying(false);
        //     // setReplayTip(true);
        // }
    }

    async function loadCartridge() {
        if (cartridgeData) return;
        const data = await getCartridgeData(cartridge.id);
        setCartridgeData(data);
    }

    if (!cartridge) {
        return  <></>;
    }

    var decoder = new TextDecoder("utf-8");
    let parser = new Parser();
    let scoreFunction = parser.parse('score');

    // function coverFallback() {
    //     return (
    //         <button className='relative h-full w-full' onClick={rivemuStart}>
    //             {freshOpen ? <Image alt={"Cover " + cartridge.name}
    //             id="canvas-cover"
    //             layout='fill'
    //             objectFit='contain'
    //             style={{
    //                 imageRendering: "pixelated"
    //             }}
    //             src={cartridge.cover? `data:image/png;base64,${cartridge.cover}`:"/logo.png"}
    //             /> : <></>}

    //             <span className='absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white'
    //                 style={{backgroundColor: "#8b5cf6", padding: "10px"}}>Click to Play!</span>

    //         </button>
    //     );
    // }

    function waitEvent(name: string) {
        return new Promise((resolve) => {
            const listener = (e: any) => {
                window.removeEventListener(name, listener);
                resolve(e);
            }
            window.addEventListener(name, listener);
        })
    }

    async function rivemuStart() {
        if (!cartridgeData) return;
        console.log("rivemuStart");
        // setIsLoading(true);
        setIsReplaying(false);
        // setReplayTip(false);
        // // @ts-ignore:next-line
        // if (Module.quited) {
        //     // restart wasm when back to page
        //     // @ts-ignore:next-line
        //     Module._main();
        // }
        await rivemuHalt();
        setIsPlaying(true);
        setOverallScore(0);

        if (selectedScoreFunction)
            scoreFunction = parser.parse(selectedScoreFunction);
        // @ts-ignore:next-line
        let buf = Module._malloc(cartridgeData.length);
        // @ts-ignore:next-line
        Module.HEAPU8.set(cartridgeData, buf);
        inCard = inCard || new Uint8Array([]);
        // @ts-ignore:next-line
        let incardBuf = Module._malloc(inCard.length);
        // @ts-ignore:next-line
        Module.HEAPU8.set(inCard, incardBuf);
        const params = args || "";
        // @ts-ignore:next-line
        Module.ccall(
            "rivemu_start_record",
            null,
            ['number', 'number', 'number', 'number', 'string'],
            [
                buf,
                cartridgeData.length,
                incardBuf,
                inCard?.length || 0,
                params || ''
            ]
        );
        // @ts-ignore:next-line
        Module._free(buf);
        // @ts-ignore:next-line
        Module._free(incardBuf);
    }

    // async function rivemuReplay() {
    //     // TODO: fix rivemuReplay
    //     if (!cartridgeData || !replayLog) return;
    //     console.log("rivemuReplay");

    //     // setReplayTip(false);
    //     // if (selectedCartridge.cartridgeData == undefined || selectedCartridge.outcard != undefined || selectedCartridge.outhash != undefined)
    //     //     setIsReplaying(true);

    //     // // @ts-ignore:next-line
    //     // if (Module.quited) {
    //     //     // restart wasm when back to page
    //     //     // @ts-ignore:next-line
    //     //     Module._main();
    //     // }
    //     await rivemuHalt();
    //     setIsPlaying(true);
    //     setOverallScore(0);

    //     if (selectedScoreFunction)
    //         scoreFunction = parser.parse(selectedScoreFunction);
    //     // @ts-ignore:next-line
    //     const cartridgeBuf = Module._malloc(selectedCartridge.cartridgeData.length);
    //     // @ts-ignore:next-line
    //     const rivlogBuf = Module._malloc(replayLog.length);
    //     // @ts-ignore:next-line
    //     Module.HEAPU8.set(selectedCartridge.cartridgeData, cartridgeBuf);
    //     // @ts-ignore:next-line
    //     Module.HEAPU8.set(replayLog, rivlogBuf);
    //     const inCard = selectedCartridge?.inCard || new Uint8Array([]);
    //     // @ts-ignore:next-line
    //     let incardBuf = Module._malloc(inCard.length);
    //     // @ts-ignore:next-line
    //     Module.HEAPU8.set(inCard, incardBuf);
    //     const params = selectedCartridge?.args || "";
    //     // @ts-ignore:next-line
    //     Module.ccall(
    //         "rivemu_start_replay",
    //         null,
    //         ['number', 'number', 'number', 'number', 'string', 'number', 'number'],
    //         [
    //             cartridgeBuf,
    //             cartridgeData.length,
    //             incardBuf,
    //             inCard.length,
    //             params,
    //             rivlogBuf,
    //             replayLog.length
    //         ]
    //     );
    //     // @ts-ignore:next-line
    //     Module._free(cartridgeBuf);
    //     // @ts-ignore:next-line
    //     Module._free(rivlogBuf);
    //     // @ts-ignore:next-line
    //     Module._free(incardBuf);
    // }

    async function rivemuHalt() {
        // @ts-ignore:next-line
        if (Module.ccall('rivemu_stop')) {
            await waitEvent('rivemu_on_shutdown');
        }
    }

    async function rivemuStop() {
        console.log("rivemuStop");
        setIsPlaying(false);
        rivemuHalt();
        // stopCartridge();
    }

    function rivemuFullscreen() {
        const canvas: any = document.getElementById("canvas");
        if (canvas) {
            canvas.requestFullscreen();
        }
    }

    // async function close() {
    //     if (selectedCartridge?.downloading) return;
    //     setCancelled(true);
    // }


    if (typeof window !== "undefined") {
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
                if (selectedScoreFunction) {
                    score = scoreFunction.evaluate(outcard_json);
                }
            }
            setOverallScore(score);
        };

        // @ts-ignore:next-line
        window.rivemu_on_begin = function (width: number, height: number, target_fps: number, total_frames: number) {
            if (!playedOnce) setPlayedOnce(true);
            if (freshOpen) setFreshOpen(false);
            // const canvas: any = document.getElementById("canvas");
            // const maxCanvasHeight = canvas.parentElement.clientHeight;
            // const maxCanvasWidth = canvas.parentElement.clientWidth;
            // if (canvas) {
            //     canvas.height = maxCanvasHeight;
            //     canvas.width = maxCanvasWidth;
            // }
            console.log("rivemu_on_begin");
            // force canvas resize
            // window.dispatchEvent(new Event("resize"));
        };

        // @ts-ignore:next-line
        window.rivemu_on_finish = function (
            rivlog: ArrayBuffer,
            outcard: ArrayBuffer,
            outhash: string
        ) {
            if (!isReplaying && !cancelled) {
                setCartridgeGameplay({
                    gameplayLog: new Uint8Array(rivlog),
                    outcard: new Uint8Array(outcard),
                    outhash: outhash
                });
            }
            rivemuStop();
            console.log("rivemu_on_finish")
        };
    }


    return (
        <div>
            <div className='relative bg-gray-500 p-2 text-center'>
                <span>Score: {overallScore}</span>
            </div>

            <div className='bg-black w-full flex flex-row space-x-8'
                >
                    {
                        !cartridgeData?
                            <div className="gameplay-screen max-h-full max-w-full p-4 flex flex-col justify-center items-center">
                                <div className='w-16 h-16 border-2 rounded-full border-current border-r-transparent animate-spin'>
                                </div>
                                <div className='mt-2'>
                                    <span>Downloading {cartridge.name} Cartridge</span>
                                </div>
                            </div>
                            
                        :
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
                    }

                {/* <div hidden={isPlaying} className='absolute top-[40px] gameplay-screen'>
                    {coverFallback()}
                </div> */}

                <div className='p-4 border-s border-gray-500'>
                    <div className='rounded-md element-inside grid grid-cols-3 space-x-2 p-8'>

                        <span className='ms-2 col-span-3 text-sm mb-2'>
                            Game Controls
                        </span>

                        {
                            !isPlaying?
                                <button disabled={!cartridgeData} title='Start' className={`bg-green-700 p-2 rounded-full ${cartridgeData? "hover:bg-green-600":""}`} onKeyDown={() => null} onKeyUp={() => null} onClick={rivemuStart}>
                                    <PlayCircleOutlineIcon/>
                                </button>
                            :
                                // onKeyDown and onKeyUp "null" prevent buttons pressed when playing to trigger "rivemuStop"
                                <button title='Stop' className='p-2 rounded-full bg-red-700 hover:bg-red-600' onKeyDown={() => null} onKeyUp={() => null} onClick={rivemuStop}>
                                    <StopIcon/>
                                </button>
                        }

                        <button disabled={!isPlaying} title='Restart' className={`element p-2 rounded-full ${isPlaying? "hover-color":""}`} onClick={rivemuStart}>
                            <RestartAltIcon/>
                        </button>

                        <button disabled={!isPlaying} title='Fullscreen' className={`element p-2 rounded-full ${isPlaying? "hover-color":""}`} onKeyDown={() => null} onKeyUp={() => null} onClick={rivemuFullscreen}>
                            <FullscreenIcon/>
                        </button>

                        <span className='col-span-3 text-sm mb-2'>
                            Log Controls
                        </span>

                        <button disabled={!cartridgeGameplay} title='Replay' className={`element p-2 rounded-full ${isPlaying? "hover-color":""}`}>
                            <ReplayIcon/>
                        </button>
                        
                        <button disabled={!cartridgeGameplay} className={`text-sm element p-2 rounded-full ${isPlaying? "hover-color":""}`}>
                            Upload
                        </button>

                        <button disabled={!cartridgeGameplay} className={`text-sm element p-2 rounded-full ${isPlaying? "hover-color":""}`}>
                            Submit
                        </button>

                    </div>
                </div>
            </div>

            <Script src="/rivemu.js?" strategy="lazyOnload" />
        {/* <div className="opacity-60 fixed inset-0 z-0 bg-black" onClick={() => close()}></div> */}
        </div>
    )
}

export default Rivemu