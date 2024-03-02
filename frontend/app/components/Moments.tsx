"use client"

import Image from "next/image";
import Link from 'next/link'
import CropOriginalIcon from '@mui/icons-material/CropOriginal';
import { useEffect, useState } from "react";
import { ethers } from "ethers";

import { MomentInfo, getOutputs, moments as momentsQuery } from "../libs/achievements/lib";
import { CartridgeInfo, cartridgeInfo } from "../libs/app/lib";
import { envClient } from '../utils/clientEnv';
import { MomentsPayload } from "../libs/achievements/ifaces";


const BASE64_KEY = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
function byteToBase64(bytes: Uint8Array): string {
    let newBase64 = '';
    let currentChar = 0;
    for (let i=0; i<bytes.length; i++) {   // Go over three 8-bit bytes to encode four base64 6-bit chars
        if (i%3===0) { // First Byte
            currentChar = (bytes[i] >> 2);      // First 6-bits for first base64 char
            newBase64 += BASE64_KEY[currentChar];      // Add the first base64 char to the string
            currentChar = (bytes[i] << 4) & 63; // Erase first 6-bits, add first 2 bits for second base64 char
        }
        if (i%3===1) { // Second Byte
            currentChar += (bytes[i] >> 4);     // Concat first 4-bits from second byte for second base64 char
            newBase64 += BASE64_KEY[currentChar];      // Add the second base64 char to the string
            currentChar = (bytes[i] << 2) & 63; // Add two zeros, add 4-bits from second half of second byte
        }
        if (i%3===2) { // Third Byte
            currentChar += (bytes[i] >> 6);     // Concat first 2-bits of third byte for the third base64 char
            newBase64 += BASE64_KEY[currentChar];      // Add the third base64 char to the string
            currentChar = bytes[i] & 63;        // Add last 6-bits from third byte for the fourth base64 char
            newBase64 += BASE64_KEY[currentChar];      // Add the fourth base64 char to the string
        }
    }
    if (bytes.length%3===1) { // Pad for two missing bytes
        newBase64 += `${BASE64_KEY[currentChar]}==`;
    }
    if (bytes.length%3===2) { // Pad one missing byte
        newBase64 += `${BASE64_KEY[currentChar]}=`;
    }
    return newBase64;
}


export interface MomentExtended extends MomentInfo {
    game_name:string,
    screenshot:string
}

export default function Moments({propos,releaseFunction}:{propos:MomentsPayload,releaseFunction(moment:MomentInfo):void}) {
    const [moments,setMoments] = useState<Array<MomentExtended>>([])
        
    useEffect(() => {
        momentsQuery(propos,{cartesiNodeUrl: envClient.CARTESI_NODE_URL, decode: true}).then(
            (output) => {

                const cartridgeNamesRequests = new Array<string>();
                const momentList = output.data as Array<MomentExtended>;
                const promiseList = momentList.map((moment: MomentExtended) => {
                    let doCartridgeReq = false;
                    if (cartridgeNamesRequests.indexOf(moment.cartridge_id) == -1) {
                        cartridgeNamesRequests.push(moment.cartridge_id);
                        doCartridgeReq = true;
                    }

                    return Promise.all([
                        Promise.resolve(moment),
                        getOutputs(
                        {
                            tags: ['moment_screenshot',moment.cartridge_id,moment.user_address,moment.gameplay_id,`${moment.id}`],
                            output_type: 'report'
                        },
                        {cartesiNodeUrl: envClient.CARTESI_NODE_URL}
                    ),
                    Promise.resolve(doCartridgeReq ? cartridgeInfo({id:moment.cartridge_id},{cartesiNodeUrl: envClient.CARTESI_NODE_URL, decode: true}) : null)
                    ])
                });
                Promise.all(promiseList).then( (listWithScreenshot) => {
                    const cartridgeNames = new Map<string,string>();
                    const momentListWithScreenshot = new Array<MomentExtended>();
                    for (const m of listWithScreenshot) {
                        const momentWithSs = m as any as [MomentExtended,Uint8Array[],CartridgeInfo|null];
                        if (!cartridgeNames.has(momentWithSs[0].cartridge_id))
                            cartridgeNames.set(momentWithSs[0].cartridge_id,momentWithSs[2]?.name);
                        momentWithSs[0].game_name = cartridgeNames.get(momentWithSs[0].cartridge_id) || "";
                        if (momentWithSs[1].length > 0)
                            momentWithSs[0].screenshot = byteToBase64(momentWithSs[1][0]);
                        momentListWithScreenshot.push(momentWithSs[0]);
                    }
                    setMoments(momentListWithScreenshot);
                })
            }
        );
    },[]);

    return (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {
                moments.map((moment: MomentExtended) => {
                    return (
                        <div className="p-3 element">
                            <div className="text-lg">
                                {moment.game_name}
                            </div>
                            
                            <div className="relative h-64 w-full">
                                    <Image 
                                        alt={"moment screenshot"}
                                        src={moment.screenshot? `data:image/png;base64,${moment.screenshot}`:"/made_it_symbol_trans.png"}
                                        fill={true}
                                    /> 
                            </div>
                            { moment.value > 0 ? <>
                                <span className="text-2xl">Value: {ethers.utils.formatUnits(`${moment.value}`,envClient.ACCEPTED_TOKEN_DECIMALS).toString()}</span>
                                <button title='Release Moment' className='hover:text-gray-500' 
                                    onClick={() => releaseFunction(moment)}><span><CropOriginalIcon/></span></button> </>
                            : <></> }
                            {/* <Link className="flex flex-col text-center hover-color" href={`/gameplays/${moment.gameplay_id}`}>
                                <span className="text-2xl">gameplay</span>
                            </Link> */}
                        </div>
                    )
                })
            }
        </div>
    );
}
