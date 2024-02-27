/* eslint-disable */
/**
 * This file was automatically generated by cartesapp.template_generator.
 * DO NOT MODIFY IT BY HAND. Instead, run the generator,
 */
import { ethers, Signer, ContractReceipt } from "ethers";

import { 
    advanceInput, inspect, 
    AdvanceOutput, InspectOptions, AdvanceInputOptions, GraphqlOptions,
    EtherDepositOptions, ERC20DepositOptions, ERC721DepositOptions,
    Report as CartesiReport, Notice as CartesiNotice, Voucher as CartesiVoucher, 
    advanceDAppRelay, advanceERC20Deposit, advanceERC721Deposit, advanceEtherDeposit,
    queryNotice, queryReport, queryVoucher
} from "cartesi-client";


// Deposit Ether
export async function depositEther(
    client:Signer,
    dappAddress:string,
    amount:ethers.BigNumberish,
    options?:EtherDepositOptions
):Promise<AdvanceOutput|ContractReceipt> {
    if (options == undefined) options = {};
    const output = await advanceEtherDeposit(client,dappAddress,amount,options).catch(
        e => {
            if (String(e.message).startsWith('0x'))
                throw new Error(ethers.utils.toUtf8String(e.message));
            throw new Error(e.message);
    });
    return output;
}

// Deposit Erc20
export async function depositErc20(
    client:Signer,
    dappAddress:string,
    tokenAddress:string,
    amount:ethers.BigNumberish,
    options?:ERC20DepositOptions
):Promise<AdvanceOutput|ContractReceipt> {
    if (options == undefined) options = {};
    const output = await advanceERC20Deposit(client,dappAddress,tokenAddress,amount,options).catch(
        e => {
            if (String(e.message).startsWith('0x'))
                throw new Error(ethers.utils.toUtf8String(e.message));
            throw new Error(e.message);
    });
    return output;
}

// Deposit Erc721
export async function depositErc721(
    client:Signer,
    dappAddress:string,
    tokenAddress:string,
    tokenId:ethers.BigNumberish,
    options?:ERC721DepositOptions
):Promise<AdvanceOutput|ContractReceipt> {
    if (options == undefined) options = {};
    const output = await advanceERC721Deposit(client,dappAddress,tokenAddress,tokenId,options).catch(
        e => {
            if (String(e.message).startsWith('0x'))
                throw new Error(ethers.utils.toUtf8String(e.message));
            throw new Error(e.message);
    });
    return output;
}

import Ajv from "ajv"
import addFormats from "ajv-formats"

import { 
    genericAdvanceInput, genericInspect, IOType, Models,
    IOData, Output, Event, ContractCall, InspectReport, 
    MutationOptions, QueryOptions, 
    CONVENTIONAL_TYPES, decodeToConventionalTypes
} from "../cartesapp/utils"

import * as ifaces from "./ifaces";


/**
 * Configs
 */

const ajv = new Ajv();
addFormats(ajv);
ajv.addFormat("biginteger", (data) => {
    const dataTovalidate = data.startsWith('-') ? data.substring(1) : data;
    return ethers.utils.isHexString(dataTovalidate) && dataTovalidate.length % 2 == 0;
});
const MAX_SPLITTABLE_OUTPUT_SIZE = 4194247;

/*
 * Mutations/Advances
 */

export async function etherWithdraw(
    client:Signer,
    dappAddress:string,
    inputData: ifaces.WithdrawEtherPayload,
    options?:MutationOptions
):Promise<AdvanceOutput|ContractReceipt|any[]> {
    const data: WithdrawEtherPayload = new WithdrawEtherPayload(inputData);
    return genericAdvanceInput<ifaces.WithdrawEtherPayload>(client,dappAddress,'0x8bdcaa5c',data, options);
}

export async function etherTransfer(
    client:Signer,
    dappAddress:string,
    inputData: ifaces.TransferEtherPayload,
    options?:MutationOptions
):Promise<AdvanceOutput|ContractReceipt|any[]> {
    const data: TransferEtherPayload = new TransferEtherPayload(inputData);
    return genericAdvanceInput<ifaces.TransferEtherPayload>(client,dappAddress,'0x05c0572a',data, options);
}

export async function erc20Withdraw(
    client:Signer,
    dappAddress:string,
    inputData: ifaces.WithdrawErc20Payload,
    options?:MutationOptions
):Promise<AdvanceOutput|ContractReceipt|any[]> {
    const data: WithdrawErc20Payload = new WithdrawErc20Payload(inputData);
    return genericAdvanceInput<ifaces.WithdrawErc20Payload>(client,dappAddress,'0xe8098289',data, options);
}

export async function erc20Transfer(
    client:Signer,
    dappAddress:string,
    inputData: ifaces.TransferErc20Payload,
    options?:MutationOptions
):Promise<AdvanceOutput|ContractReceipt|any[]> {
    const data: TransferErc20Payload = new TransferErc20Payload(inputData);
    return genericAdvanceInput<ifaces.TransferErc20Payload>(client,dappAddress,'0xb9df05d9',data, options);
}

export async function erc721Withdraw(
    client:Signer,
    dappAddress:string,
    inputData: ifaces.WithdrawErc721Payload,
    options?:MutationOptions
):Promise<AdvanceOutput|ContractReceipt|any[]> {
    const data: WithdrawErc721Payload = new WithdrawErc721Payload(inputData);
    return genericAdvanceInput<ifaces.WithdrawErc721Payload>(client,dappAddress,'0x1bb27d41',data, options);
}

export async function erc721Transfer(
    client:Signer,
    dappAddress:string,
    inputData: ifaces.TransferErc721Payload,
    options?:MutationOptions
):Promise<AdvanceOutput|ContractReceipt|any[]> {
    const data: TransferErc721Payload = new TransferErc721Payload(inputData);
    return genericAdvanceInput<ifaces.TransferErc721Payload>(client,dappAddress,'0xdc9eac28',data, options);
}


/*
 * Queries/Inspects
 */

export async function balance(
    inputData: ifaces.BalancePayload,
    options?:QueryOptions
):Promise<InspectReport|any> {
    const route = 'wallet/balance/{address}';
    const data: BalancePayload = new BalancePayload(inputData);
    const output: InspectReport = await genericInspect<ifaces.BalancePayload>(data,route,options);
    if (options?.decode) { return decodeToModel(output,options.decodeModel || "json"); }
    return output;
}




/**
 * Models Decoders/Exporters
 */

export function decodeToModel(data: CartesiReport | CartesiNotice | CartesiVoucher | InspectReport, modelName: string): any {
    if (modelName == undefined)
        throw new Error("undefined model");
    if (CONVENTIONAL_TYPES.includes(modelName))
        return decodeToConventionalTypes(data.payload,modelName);
    const decoder = models[modelName].decoder;
    if (decoder == undefined)
        throw new Error("undefined decoder");
    return decoder(data);
}

export function exportToModel(data: any, modelName: string): string {
    const exporter = models[modelName].exporter;
    if (exporter == undefined)
        throw new Error("undefined exporter");
    return exporter(data);
}

export class WithdrawErc20Payload extends IOData<ifaces.WithdrawErc20Payload> { constructor(data: ifaces.WithdrawErc20Payload, validate: boolean = true) { super(models['WithdrawErc20Payload'],data,validate); } }
export function exportToWithdrawErc20Payload(data: ifaces.WithdrawErc20Payload): string {
    const dataToExport: WithdrawErc20Payload = new WithdrawErc20Payload(data);
    return dataToExport.export();
}

export class WithdrawEtherPayload extends IOData<ifaces.WithdrawEtherPayload> { constructor(data: ifaces.WithdrawEtherPayload, validate: boolean = true) { super(models['WithdrawEtherPayload'],data,validate); } }
export function exportToWithdrawEtherPayload(data: ifaces.WithdrawEtherPayload): string {
    const dataToExport: WithdrawEtherPayload = new WithdrawEtherPayload(data);
    return dataToExport.export();
}

export class TransferErc721Payload extends IOData<ifaces.TransferErc721Payload> { constructor(data: ifaces.TransferErc721Payload, validate: boolean = true) { super(models['TransferErc721Payload'],data,validate); } }
export function exportToTransferErc721Payload(data: ifaces.TransferErc721Payload): string {
    const dataToExport: TransferErc721Payload = new TransferErc721Payload(data);
    return dataToExport.export();
}

export class TransferEtherPayload extends IOData<ifaces.TransferEtherPayload> { constructor(data: ifaces.TransferEtherPayload, validate: boolean = true) { super(models['TransferEtherPayload'],data,validate); } }
export function exportToTransferEtherPayload(data: ifaces.TransferEtherPayload): string {
    const dataToExport: TransferEtherPayload = new TransferEtherPayload(data);
    return dataToExport.export();
}

export class WithdrawErc721Payload extends IOData<ifaces.WithdrawErc721Payload> { constructor(data: ifaces.WithdrawErc721Payload, validate: boolean = true) { super(models['WithdrawErc721Payload'],data,validate); } }
export function exportToWithdrawErc721Payload(data: ifaces.WithdrawErc721Payload): string {
    const dataToExport: WithdrawErc721Payload = new WithdrawErc721Payload(data);
    return dataToExport.export();
}

export class TransferErc20Payload extends IOData<ifaces.TransferErc20Payload> { constructor(data: ifaces.TransferErc20Payload, validate: boolean = true) { super(models['TransferErc20Payload'],data,validate); } }
export function exportToTransferErc20Payload(data: ifaces.TransferErc20Payload): string {
    const dataToExport: TransferErc20Payload = new TransferErc20Payload(data);
    return dataToExport.export();
}

export class BalancePayload extends IOData<ifaces.BalancePayload> { constructor(data: ifaces.BalancePayload, validate: boolean = true) { super(models['BalancePayload'],data,validate); } }
export function exportToBalancePayload(data: ifaces.BalancePayload): string {
    const dataToExport: BalancePayload = new BalancePayload(data);
    return dataToExport.export();
}

export class WalletOutput extends Output<ifaces.WalletOutput> { constructor(output: CartesiReport | InspectReport) { super(models['WalletOutput'],output); } }
export function decodeToWalletOutput(output: CartesiReport | CartesiNotice | CartesiVoucher | InspectReport): WalletOutput {
    return new WalletOutput(output as CartesiReport);
}

export class EtherEvent extends Event<ifaces.EtherEvent> { constructor(output: CartesiNotice) { super(models['EtherEvent'],output); } }
export function decodeToEtherEvent(output: CartesiReport | CartesiNotice | CartesiVoucher | InspectReport): EtherEvent {
    return new EtherEvent(output as CartesiNotice);
}

export class Erc20Event extends Event<ifaces.Erc20Event> { constructor(output: CartesiNotice) { super(models['Erc20Event'],output); } }
export function decodeToErc20Event(output: CartesiReport | CartesiNotice | CartesiVoucher | InspectReport): Erc20Event {
    return new Erc20Event(output as CartesiNotice);
}

export class Erc721Event extends Event<ifaces.Erc721Event> { constructor(output: CartesiNotice) { super(models['Erc721Event'],output); } }
export function decodeToErc721Event(output: CartesiReport | CartesiNotice | CartesiVoucher | InspectReport): Erc721Event {
    return new Erc721Event(output as CartesiNotice);
}

export class WithdrawEther extends ContractCall<ifaces.WithdrawEther> { constructor(output: CartesiVoucher) { super(models['withdrawEther'],output); } }
export function decodeToWithdrawEther(output: CartesiReport | CartesiNotice | CartesiVoucher | InspectReport): WithdrawEther {
    return new WithdrawEther(output as CartesiVoucher);
}

export class WithdrawErc20 extends ContractCall<ifaces.WithdrawErc20> { constructor(output: CartesiVoucher) { super(models['withdrawErc20'],output); } }
export function decodeToWithdrawErc20(output: CartesiReport | CartesiNotice | CartesiVoucher | InspectReport): WithdrawErc20 {
    return new WithdrawErc20(output as CartesiVoucher);
}

export class WithdrawErc721 extends ContractCall<ifaces.WithdrawErc721> { constructor(output: CartesiVoucher) { super(models['withdrawErc721'],output); } }
export function decodeToWithdrawErc721(output: CartesiReport | CartesiNotice | CartesiVoucher | InspectReport): WithdrawErc721 {
    return new WithdrawErc721(output as CartesiVoucher);
}


/**
 * Model
 */

export const models: Models = {
    'WithdrawErc20Payload': {
        ioType:IOType.mutationPayload,
        abiTypes:['address', 'uint256', 'bytes'],
        params:['token', 'amount', 'execLayerData'],
        exporter: exportToWithdrawErc20Payload,
        validator: ajv.compile<ifaces.WithdrawErc20Payload>(JSON.parse('{"title": "WithdrawErc20Payload", "type": "object", "properties": {"token": {"type": "string"}, "amount": {"type": "integer"}, "execLayerData": {"type": "string", "format": "binary"}}, "required": ["token", "amount", "execLayerData"]}'))
    },
    'WithdrawEtherPayload': {
        ioType:IOType.mutationPayload,
        abiTypes:['uint256', 'bytes'],
        params:['amount', 'execLayerData'],
        exporter: exportToWithdrawEtherPayload,
        validator: ajv.compile<ifaces.WithdrawEtherPayload>(JSON.parse('{"title": "WithdrawEtherPayload", "type": "object", "properties": {"amount": {"type": "integer"}, "execLayerData": {"type": "string", "format": "binary"}}, "required": ["amount", "execLayerData"]}'))
    },
    'TransferErc721Payload': {
        ioType:IOType.mutationPayload,
        abiTypes:['address', 'address', 'uint256', 'bytes'],
        params:['token', 'receiver', 'id', 'execLayerData'],
        exporter: exportToTransferErc721Payload,
        validator: ajv.compile<ifaces.TransferErc721Payload>(JSON.parse('{"title": "TransferErc721Payload", "type": "object", "properties": {"token": {"type": "string"}, "receiver": {"type": "string"}, "id": {"type": "integer"}, "execLayerData": {"type": "string", "format": "binary"}}, "required": ["token", "receiver", "id", "execLayerData"]}'))
    },
    'TransferEtherPayload': {
        ioType:IOType.mutationPayload,
        abiTypes:['address', 'uint256', 'bytes'],
        params:['receiver', 'amount', 'execLayerData'],
        exporter: exportToTransferEtherPayload,
        validator: ajv.compile<ifaces.TransferEtherPayload>(JSON.parse('{"title": "TransferEtherPayload", "type": "object", "properties": {"receiver": {"type": "string"}, "amount": {"type": "integer"}, "execLayerData": {"type": "string", "format": "binary"}}, "required": ["receiver", "amount", "execLayerData"]}'))
    },
    'WithdrawErc721Payload': {
        ioType:IOType.mutationPayload,
        abiTypes:['address', 'uint256', 'bytes'],
        params:['token', 'id', 'execLayerData'],
        exporter: exportToWithdrawErc721Payload,
        validator: ajv.compile<ifaces.WithdrawErc721Payload>(JSON.parse('{"title": "WithdrawErc721Payload", "type": "object", "properties": {"token": {"type": "string"}, "id": {"type": "integer"}, "execLayerData": {"type": "string", "format": "binary"}}, "required": ["token", "id", "execLayerData"]}'))
    },
    'TransferErc20Payload': {
        ioType:IOType.mutationPayload,
        abiTypes:['address', 'address', 'uint256', 'bytes'],
        params:['token', 'receiver', 'amount', 'execLayerData'],
        exporter: exportToTransferErc20Payload,
        validator: ajv.compile<ifaces.TransferErc20Payload>(JSON.parse('{"title": "TransferErc20Payload", "type": "object", "properties": {"token": {"type": "string"}, "receiver": {"type": "string"}, "amount": {"type": "integer"}, "execLayerData": {"type": "string", "format": "binary"}}, "required": ["token", "receiver", "amount", "execLayerData"]}'))
    },
    'BalancePayload': {
        ioType:IOType.queryPayload,
        abiTypes:[],
        params:['address'],
        exporter: exportToBalancePayload,
        validator: ajv.compile<ifaces.BalancePayload>(JSON.parse('{"title": "BalancePayload", "type": "object", "properties": {"address": {"type": "string"}}, "required": ["address"]}'))
    },
    'WalletOutput': {
        ioType:IOType.report,
        abiTypes:[],
        params:['ether', 'erc20', 'erc721', 'erc1155'],
        decoder: decodeToWalletOutput,
        validator: ajv.compile<ifaces.WalletOutput>(JSON.parse('{"title": "WalletOutput", "type": "object", "properties": {"ether": {"type": "integer"}, "erc20": {"type": "object", "additionalProperties": {"type": "integer"}}, "erc721": {"type": "object", "additionalProperties": {"type": "array", "items": {"type": "integer"}}}, "erc1155": {"type": "object", "additionalProperties": {"type": "array", "minItems": 2, "maxItems": 2, "items": [{"type": "array", "items": {"type": "integer"}}, {"type": "array", "items": {"type": "integer"}}]}}}}'))
    },
    'EtherEvent': {
        ioType:IOType.notice,
        abiTypes:['address', 'int256', 'uint256'],
        params:['user', 'mod_amount', 'balance'],
        decoder: decodeToEtherEvent,
        validator: ajv.compile<ifaces.EtherEvent>(JSON.parse('{"title": "EtherEvent", "type": "object", "properties": {"user": {"type": "string"}, "mod_amount": {"type": "integer"}, "balance": {"type": "integer"}}, "required": ["user", "mod_amount", "balance"]}'.replaceAll('integer','string","format":"biginteger')))
    },
    'Erc20Event': {
        ioType:IOType.notice,
        abiTypes:['address', 'address', 'int256', 'uint256'],
        params:['user', 'address', 'mod_amount', 'balance'],
        decoder: decodeToErc20Event,
        validator: ajv.compile<ifaces.Erc20Event>(JSON.parse('{"title": "Erc20Event", "type": "object", "properties": {"user": {"type": "string"}, "address": {"type": "string"}, "mod_amount": {"type": "integer"}, "balance": {"type": "integer"}}, "required": ["user", "address", "mod_amount", "balance"]}'.replaceAll('integer','string","format":"biginteger')))
    },
    'Erc721Event': {
        ioType:IOType.notice,
        abiTypes:['address', 'address', 'int256', 'uint256[]'],
        params:['user', 'address', 'mod_id', 'ids'],
        decoder: decodeToErc721Event,
        validator: ajv.compile<ifaces.Erc721Event>(JSON.parse('{"title": "Erc721Event", "type": "object", "properties": {"user": {"type": "string"}, "address": {"type": "string"}, "mod_id": {"type": "integer"}, "ids": {"type": "array", "items": {"type": "integer"}}}, "required": ["user", "address", "mod_id", "ids"]}'.replaceAll('integer','string","format":"biginteger')))
    },
    'withdrawEther': {
        ioType:IOType.voucher,
        abiTypes:['address', 'uint256'],
        params:['user', 'amount'],
        decoder: decodeToWithdrawEther,
        validator: ajv.compile<ifaces.WithdrawEther>(JSON.parse('{"title": "withdrawEther", "type": "object", "properties": {"user": {"type": "string"}, "amount": {"type": "integer"}}, "required": ["user", "amount"]}'.replaceAll('integer','string","format":"biginteger')))
    },
    'withdrawErc20': {
        ioType:IOType.voucher,
        abiTypes:['address', 'uint256'],
        params:['user', 'amount'],
        decoder: decodeToWithdrawErc20,
        validator: ajv.compile<ifaces.WithdrawErc20>(JSON.parse('{"title": "withdrawErc20", "type": "object", "properties": {"user": {"type": "string"}, "amount": {"type": "integer"}}, "required": ["user", "amount"]}'.replaceAll('integer','string","format":"biginteger')))
    },
    'withdrawErc721': {
        ioType:IOType.voucher,
        abiTypes:['address', 'address', 'uint256'],
        params:['sender', 'receiver', 'id'],
        decoder: decodeToWithdrawErc721,
        validator: ajv.compile<ifaces.WithdrawErc721>(JSON.parse('{"title": "withdrawErc721", "type": "object", "properties": {"sender": {"type": "string"}, "receiver": {"type": "string"}, "id": {"type": "integer"}}, "required": ["sender", "receiver", "id"]}'.replaceAll('integer','string","format":"biginteger')))
    },
    };