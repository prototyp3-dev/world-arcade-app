"use client"

import { Fragment, cache, useEffect, useState } from "react";
import Image from "next/image";
import { Combobox, Transition } from '@headlessui/react'
import { useConnectWallet } from "@web3-onboard/react";
import { ethers } from "ethers";
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import CheckIcon from '@mui/icons-material/Check';

import { CartridgeInfo } from "@/app/libs/app/ifaces";
import { cartridges as cartridgerequest } from "@/app/libs/app/lib";
import { envClient } from "@/app/utils/clientEnv";
import { createAchievement } from "@/app/libs/achievements/lib";

async function handle_file_input(e:React.ChangeEvent<HTMLInputElement>, callback:Function) {
    if (!e.target.files || e.target.files.length == 0) {
        return;
    }

    let file = e.target.files[0];

    const reader = new FileReader();
    reader.onload = async (readerEvent) => {
        let data: ArrayBuffer;
        if (readerEvent.target?.result instanceof ArrayBuffer) {
            data = readerEvent.target?.result;
        } else {
            data = {} as ArrayBuffer;
        }
        if (data) {
            callback(new Uint8Array(data));
        }
    };

    reader.readAsArrayBuffer(file);
}


const getCartridges = cache(async () => {
	const cartridges:Array<CartridgeInfo> = (await cartridgerequest({},{decode:true, cartesiNodeUrl: envClient.CARTESI_NODE_URL,cache:"force-cache"})).data;

    return cartridges;
})

export default function CreateAchievementForm({ cartridge_id }:{cartridge_id?:string}) {
    const [name, setName] = useState("");
    const [formula, setFormula] = useState("");
    const [description, setDescription] = useState("");
    const [gameplay, setGameplay] = useState<Uint8Array|null>(null);
    const [image, setImage] = useState<Uint8Array|null>(null);
    const [coverImagePreview, setCoverImagePreview] = useState<any|null>(null)
    const [cartridges, setCartridges] = useState<Array<CartridgeInfo>>([]);
    const [creatingAchievement, setCreatingAchievement] = useState(false);

    const [{ wallet }, connect] = useConnectWallet();

    console.log(gameplay)


    // combobox controlers
    const [selected, setSelected] = useState<CartridgeInfo>({created_at: 0, id: "", name: "", user_address: ""});
    const [query, setQuery] = useState('');

    const filteredCartridges = query === ''
        ?
            cartridges
        :
            cartridges.filter((cartridge) => 
                cartridge.name
                .toLowerCase()
                .replace(/\s+/g, '')
                .includes(query.toLowerCase().replace(/\s+/g, ''))
            )

    const isSubmitDisabled = selected.id.length == 0 || !gameplay || name.length == 0 || formula.length == 0 || description.length == 0? true:false;

    useEffect(() => {
        getCartridges().then((cartridgeList) => {
            setCartridges(cartridgeList);

            const current_id = cartridge_id?.toLowerCase();
            for (let i = 0; i < cartridgeList.length; i++) {
                if (cartridgeList[i].id.toLowerCase() == current_id) {
                    setSelected(cartridgeList[i]);
                    break;
                }
            }
        })
    }, [])


    const handleNameChange = (event:React.FormEvent<HTMLInputElement>) => {
        setName(event.currentTarget.value);
    }

    const handleFormulaChange = (event:React.FormEvent<HTMLInputElement>) => {
        setFormula(event.currentTarget.value);
    }

    const handleDescriptionChange = (event:React.FormEvent<HTMLTextAreaElement>) => {
        setDescription(event.currentTarget.value);
    }

    const handleGameplayChange = (event:any) => {
        const reader = new FileReader();
        reader.onload = async (readerEvent) => {
            const data = readerEvent.target?.result;
            if (data) {
                setGameplay(new Uint8Array(data as ArrayBuffer));
                event.target.value = null;
            }
        };
        reader.readAsArrayBuffer(event.target.files[0])
    }

    function handleImageChange(e:React.ChangeEvent<HTMLInputElement>) {
        handle_file_input(e, (data:Uint8Array) => {
            setImage(data);

            // Set the cover image preview to be exhibit in the form
            const date = new Date();
            const blobFile = new Blob([data||new Uint8Array()],{type:'image/png'})
            const file = new File([blobFile], `${date.getMilliseconds()}`);
            setCoverImagePreview(URL.createObjectURL(file));
        });
    }

    const submitLog = async () => {
        if (!wallet) {
            alert("Connect a wallet first.");
            return;
        }

        if (!gameplay) {
            alert("Select a gameplay first.")
            return;
        }

        const signer = new ethers.providers.Web3Provider(wallet.provider, 'any').getSigner();
        const logHexString = ethers.utils.hexlify(gameplay);
        const imageHexString = image? ethers.utils.hexlify(image):"";

        setCreatingAchievement(true);
        await createAchievement(signer, envClient.DAPP_ADDR, {
            cartridge_id: selected.id,
            name: name,
            expression: formula,
            description: description,
            log: logHexString,
            icon: imageHexString,
            args: "",
            in_card: "0x",
            outcard_hash: ""
        }, {cartesiNodeUrl: envClient.CARTESI_NODE_URL, sync: false})
        setCreatingAchievement(false);
    }


    return (
        <div className="flex justify-center items-center element rounded">
            <div className="relative h-80 w-80">
                <Image src={coverImagePreview? coverImagePreview: "/made_it_symbol_trans.png"}
                    className="border-4 rounded-full"
                    alt={"Achievement Image"}
                    fill
                />
            </div>

            <div className="rounded p-2 w-1/2">
                <form className="flex flex-col space-y-4 p-4 rounded">
                    <fieldset className="text-3xl">Achievement Creation</fieldset>

                    <div>
                        <span>Game</span>
                        <Combobox value={selected} onChange={setSelected}>
                            <div className="relative mt-1">
                            <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm">
                                <Combobox.Input
                                className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
                                displayValue={(cartridge:CartridgeInfo) => cartridge.name}
                                onChange={(event) => setQuery(event.currentTarget.value)}
                                />
                                <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                                <UnfoldMoreIcon
                                    className="h-5 w-5 text-gray-400"
                                    aria-hidden="true"
                                />
                                </Combobox.Button>
                            </div>
                            <Transition
                                as={Fragment}
                                leave="transition ease-in duration-100"
                                leaveFrom="opacity-100"
                                leaveTo="opacity-0"
                                afterLeave={() => setQuery('')}
                            >
                                <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                                {filteredCartridges.length === 0 && query !== '' ? (
                                    <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
                                    Nothing found.
                                    </div>
                                ) : (
                                    filteredCartridges.map((cartridge) => (
                                        <Combobox.Option
                                            key={cartridge.id}
                                            className={({ active }) =>
                                            `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                                active ? 'bg-teal-600 text-white' : 'text-gray-900'
                                            }`
                                            }
                                            value={cartridge}
                                        >
                                            {({ selected, active }) => (
                                                <>
                                                    <span
                                                    className={`block truncate ${
                                                        selected ? 'font-medium' : 'font-normal'
                                                    }`}
                                                    >
                                                    {cartridge.name}
                                                    </span>
                                                    {selected ? (
                                                    <span
                                                        className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                                        active ? 'text-white' : 'text-teal-600'
                                                        }`}
                                                    >
                                                        <CheckIcon />
                                                    </span>
                                                    ) : null}
                                                </>
                                            )}
                                        </Combobox.Option>
                                    ))
                                )}
                                </Combobox.Options>
                            </Transition>
                            </div>
                        </Combobox>

                    </div>

                    <div className="grid grid-cols-2">
                        <div className="me-4">
                            <label htmlFor="name">Achievement Name</label>
                            <input id="name" className="rounded w-full text-black" value={name} onChange={handleNameChange}>
                            </input>
                        </div>

                        <div>
                            <label htmlFor="formula">Achievement Formula</label>
                            <input id="formula" className="rounded w-full text-black" value={formula} onChange={handleFormulaChange}>
                            </input>                            
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <label htmlFor="description">Achievement Description</label>
                        <textarea id="description" className="rounded text-black" value={description} onChange={handleDescriptionChange}>
                        </textarea>
                    </div>

                    <div className="flex flex-col">
                        <label className="" htmlFor="rivlog_file_input">Gameplay File</label>
                        <input accept=".rivlog" className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50"
                        aria-describedby="rivlog-file"
                        id="rivlog_file_input"
                        type="file"
                        onChange={handleGameplayChange}
                        />
                        <p className="mt-1 text-sm text-gray-500" id="file_input_help">A gameplay log proving the achievement is feasible</p>

                    </div>

                    <div className="flex flex-col">
                        <label className="" htmlFor="file_input">Achievement Image (optional)</label>
                        <input accept="image/png, image/jpg" className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50"
                        aria-describedby="file_input_help"
                        id="file_input"
                        type="file"
                        onChange={handleImageChange}
                        />
                        <p className="mt-1 text-sm text-gray-500" id="file_input_help">PNG or JPG</p>

                    </div>

                    <div className="w-full flex justify-end">
                        {
                            creatingAchievement?
                                <div className="p-2 rounded element-inside">
                                    <div className='w-8 h-8 border-2 rounded-full border-current border-r-transparent animate-spin'></div>
                                </div>
                            :
                                <button disabled={isSubmitDisabled}
                                className={`p-2 rounded element-inside ${isSubmitDisabled?"":"hover:hover-color"}`}
                                onClick={submitLog}>
                                    Submit
                                </button>

                        }
                    </div>
                </form>
                {/* Create Achievement for cartridge {params.cartridge_id} */}
            </div>
        </div>
    )
}