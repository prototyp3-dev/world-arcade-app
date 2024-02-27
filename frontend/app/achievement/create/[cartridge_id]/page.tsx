"use client"

import { useState } from "react";
import Image from "next/image";



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

export default function CreateAchievement({ params }: { params: { cartridge_id?: string } }) {
    const [name, setName] = useState("");
    const [formula, setFormula] = useState("");
    const [description, setDescription] = useState("");
    const [image, setImage] = useState<Uint8Array|null>(null);
    const [coverImagePreview, setCoverImagePreview] = useState<any|null>(null)

    const isSubmitDisabled = name.length == 0 || formula.length == 0 || description.length == 0? true:false;


    const handleNameChange = (event:React.FormEvent<HTMLInputElement>) => {
        setName(event.currentTarget.value);
    }

    const handleFormulaChange = (event:React.FormEvent<HTMLInputElement>) => {
        setFormula(event.currentTarget.value);
    }

    const handleDescriptionChange = (event:React.FormEvent<HTMLTextAreaElement>) => {
        setDescription(event.currentTarget.value);
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

    }


    return (
        <main>
            <section>
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
                            <div className="grid grid-cols-2">
                                <div className="me-4">
                                    <label htmlFor="name">Achievement Name</label>
                                    <input id="name" className="rounded w-full" value={name} onChange={handleNameChange}>
                                    </input>
                                </div>

                                <div>
                                    <label htmlFor="formula">Achievement Formula</label>
                                    <input id="formula" className="rounded w-full" value={formula} onChange={handleFormulaChange}>
                                    </input>                            
                                </div>
                            </div>

                            <div className="flex flex-col">
                                <label htmlFor="description">Achievement Description</label>
                                <textarea id="description" className="rounded" value={description} onChange={handleDescriptionChange}>
                                </textarea>
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
                                <button disabled={isSubmitDisabled} className="p-2 rounded element-inside hover:hover-color" onClick={submitLog}>Submit</button>
                            </div>
                        </form>
                        {/* Create Achievement for cartridge {params.cartridge_id} */}
                    </div>
                </div>
            </section>
        </main>
    )
}