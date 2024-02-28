"use client"


import React, { useState, useEffect, cache } from 'react'
import Script from "next/script";
import {Parser} from 'expr-eval';


import { CartridgeInfo, Replay } from "@/app/libs/app/ifaces";
import { cartridge as CartridgeData } from '../libs/app/lib';
import { replay } from '@/app/libs/app/lib';
import { envClient } from '../utils/clientEnv';

import { Dialog } from '@headlessui/react'
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import StopIcon from '@mui/icons-material/Stop';
import ReplayIcon from '@mui/icons-material/Replay';
import WarningIcon from '@mui/icons-material/Warning';
import { useConnectWallet } from '@web3-onboard/react';
import { ContractReceipt, ethers } from 'ethers';


const getCartridgeData = cache(async (id:string) => {
	const data = await CartridgeData({id:id},{decode:true,decodeModel:"bytes", cartesiNodeUrl: envClient.CARTESI_NODE_URL, cache:"force-cache"});

    return data;
})


const loadingFeedback = () => {
    return (
        <div className="w-full py-1 px-4 flex justify-center">
            <div className='w-4 h-4 border-2 rounded-full border-current border-r-transparent animate-spin'></div>
        </div>
    )
}

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
    const [{ wallet }] = useConnectWallet();
    const [isOpen, setIsOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (cartridge) initialize();
    }
    ,[cartridge])


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

    const handleGameplayChange = (event:any) => {
        const reader = new FileReader();
        reader.onload = async (readerEvent) => {
            const data = readerEvent.target?.result;
            if (data) {
                setCartridgeGameplay({
                    gameplayLog: new Uint8Array(data as ArrayBuffer),
                    outcard: new Uint8Array([]),
                    outhash: "0x0000000000000000000000000000000000000000000000000000000000000000"
                });
                event.target.value = null;
            }
        };
        reader.readAsArrayBuffer(event.target.files[0])
    }

    async function submitLog() {
        if (!wallet) {
            alert("Connect a wallet first");
            return;
        }

        if (!cartridgeGameplay) {
            alert("Play or upload a gameplay first");
            return;
        }
        
        const signer = new ethers.providers.Web3Provider(wallet.provider, 'any').getSigner();
        const inputData: Replay = {
            cartridge_id: "0x" + cartridge.id,
            outcard_hash: cartridgeGameplay.outhash,
            args: args || "",
            in_card: inCard ? ethers.utils.hexlify(inCard) : "0x",
            log: ethers.utils.hexlify(cartridgeGameplay.gameplayLog),
            user_alias: ''
        }

        setSubmitting(true);
        try {
            const receipt = await replay(signer, envClient.DAPP_ADDR, inputData, {sync:false, cartesiNodeUrl: envClient.CARTESI_NODE_URL}) as ContractReceipt;
            setCartridgeGameplay(null);
        } catch(error) {
            alert((error as Error).message);
        }
        setSubmitting(false);
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
                    outhash: "0x" + outhash
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

                        <button disabled={!isPlaying} title='Restart' className={`element p-2 rounded-full ${isPlaying? "hover-color":"btn-disabled"}`} onClick={rivemuStart}>
                            <RestartAltIcon/>
                        </button>

                        <button disabled={!isPlaying} title='Fullscreen' className={`element p-2 rounded-full ${isPlaying? "hover-color":"btn-disabled"}`} onKeyDown={() => null} onKeyUp={() => null} onClick={rivemuFullscreen}>
                            <FullscreenIcon/>
                        </button>

                        <span className='col-span-3 text-sm mb-2'>
                            Log Controls
                        </span>

                        <button disabled={!cartridgeGameplay} title='Replay' className={`element p-2 rounded-full ${isPlaying? "hover-color":"btn-disabled"}`}>
                            <ReplayIcon/>
                        </button>
                        
                        <button onClick={()=>setIsOpen(true)} className={`text-sm element p-2 rounded-full hover-color`}>
                            Upload
                        </button>

                        <button onClick={submitLog} disabled={!cartridgeGameplay} className={`text-sm element p-2 rounded-full ${cartridgeGameplay && !isOpen? "hover-color animate-bounce":"btn-disabled"}`}>
                            Submit
                        </button>

                    </div>
                </div>
            </div>

            <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="fixed z-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Dialog.Panel className="element rounded p-6">
                    <Dialog.Title className="text-2xl mb-4">Upload a Gameplay File</Dialog.Title>
                    {
                        cartridgeGameplay && cartridgeGameplay.outhash?
                            <Dialog.Description className="mb-4">
                                <WarningIcon className='text-yellow-500'/> This will override current gameplay log
                            </Dialog.Description>
                        :
                            <></>
                    }

                    <form className='mb-4'>
                        <label className="" htmlFor="rivlog_file_input">Gameplay File</label>
                        <input accept=".rivlog" className="block w-full text-sm text-gray-900 border border-gray-300 rounded cursor-pointer bg-gray-50"
                        aria-describedby="rivlog-file"
                        id="rivlog_file_input"
                        type="file"
                        onChange={handleGameplayChange}
                        />
                    </form>

                    <div className='flex space-x-2 items-center justify-end'>
                        <button
                        className='bg-red-500 text-white font-bold uppercase text-sm p-2 border border-red-500 hover:text-red-500 hover:bg-transparent'
                        onClick={() => setIsOpen(false)}>
                            Cancel
                        </button>

                        <button
                        disabled={!cartridgeGameplay || submitting}
                        className={`text-white font-bold uppercase text-sm p-2 border ${cartridgeGameplay?"bg-green-500 border-green-500 hover:text-green-500 hover:bg-transparent":"bg-gray-500"}`}
                        onClick={() => {submitLog().then(() => setIsOpen(false))}}>
                            {
                                submitting?
                                    loadingFeedback()
                                :
                                    "Submit"
                            }
                        </button>
    
                    </div>
                </Dialog.Panel>
            </Dialog>

            <Script src="/rivemu.js?" strategy="lazyOnload" />
        {/* <div className="opacity-60 fixed inset-0 z-0 bg-black" onClick={() => close()}></div> */}
        </div>
    )
}

export default Rivemu