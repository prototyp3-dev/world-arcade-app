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


export default function Moments({propos,releaseFunction}:{propos:MomentsPayload,releaseFunction(moment:MomentInfo):void}) {
    const [cartridgesName,setCartridgesName] = useState(new Map<string,string>())
    const [screenshots,setScreenshots] = useState(new Map<number,string>())
    const [moments,setMoments] = useState<Array<MomentInfo>>([])
        
    useEffect(() => {
        momentsQuery(propos,{cartesiNodeUrl: envClient.CARTESI_NODE_URL, decode: true}).then(
            (output) => {
                setMoments(output.data);
            }
        );
    },[]);

    const requestScreenshot = (moment:MomentInfo) => {
        if (screenshots.has(moment.id)) return "";
        console.log(moment,['moment_screenshot',moment.cartridge_id,moment.user_address,moment.gameplay_id,`${moment.id}`])

        getOutputs(
            {
                tags: ['moment_screenshot',moment.cartridge_id,moment.user_address,moment.gameplay_id,`${moment.id}`],
                output_type: 'report'
            },
            {cartesiNodeUrl: envClient.CARTESI_NODE_URL}
        ).then(
            (outputs:any[]) => {
                if (outputs.length > 0) {
                    // console.log(outputs[0],byteToBase64(outputs[0] as Uint8Array))
                    screenshots.set(moment.id, byteToBase64(outputs[0] as Uint8Array));
                    setScreenshots(screenshots);
                }
            }
        );
        return "";
    }
    const requestCartridgeName = (cartridge_id:string): string => {
        if (cartridgesName.has(cartridge_id)) {
            return ""
        };
        cartridgesName.set(cartridge_id, "");
        setCartridgesName(cartridgesName);
        cartridgeInfo({id:cartridge_id},{cartesiNodeUrl: envClient.CARTESI_NODE_URL, decode: true}).then(
            (info: CartridgeInfo) => {
                cartridgesName.set(cartridge_id, info.name.toUpperCase());
                setCartridgesName(cartridgesName);
            }
        )
        return "";
    }
    
    return (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {
                moments.map((moment: MomentInfo) => {
                    return (
                        <div className="p-3 element">
                            <div className="text-lg">
                                {cartridgesName.has(moment.cartridge_id) ? cartridgesName.get(moment.cartridge_id) : requestCartridgeName(moment.cartridge_id)}
                            </div>
                            
                            <div className="relative h-64 w-full">
                            
                                {screenshots.has(moment.id) ? 
                                    <Image 
                                        alt={"moment screenshot"}
                                        src={screenshots.get(moment.id)? `data:image/png;base64,${screenshots.get(moment.id)}`:"/made_it_symbol_trans.png"}
                                        fill={true}
                                    /> 
                                    : requestScreenshot(moment)}
                            </div>
                            { moment.value > 0 ? <>
                                <span className="text-2xl">Value: {ethers.utils.formatUnits(`${moment.value}`,envClient.ACCPTED_TOKEN_DECIMALS).toString()}</span>
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
