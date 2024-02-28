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


import Ajv from "ajv"
import addFormats from "ajv-formats"

import { 
    genericAdvanceInput, genericInspect, IOType, Models,
    IOData, Output, Event, ContractCall, InspectReport, 
    MutationOptions, QueryOptions, 
    CONVENTIONAL_TYPES, decodeToConventionalTypes
} from "../cartesapp/utils"

import { 
    genericGetOutputs, decodeAdvance
} from "../cartesapp/lib"

import * as indexerIfaces from "../indexer/ifaces"
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

export async function insertCartridge(
    client:Signer,
    dappAddress:string,
    inputData: ifaces.InserCartridgePayload,
    options?:MutationOptions
):Promise<AdvanceOutput|ContractReceipt|any[]> {
    const data: InserCartridgePayload = new InserCartridgePayload(inputData);
    if (options?.decode) { options.sync = true; }
    const result = await genericAdvanceInput<ifaces.InserCartridgePayload>(client,dappAddress,'0x36b24e6f',data, options)
    if (options?.decode) {
        return decodeAdvance(result as AdvanceOutput,decodeToModel,options);
    }
    return result;
}

export async function removeCartridge(
    client:Signer,
    dappAddress:string,
    inputData: ifaces.RemoveCartridgePayload,
    options?:MutationOptions
):Promise<AdvanceOutput|ContractReceipt|any[]> {
    const data: RemoveCartridgePayload = new RemoveCartridgePayload(inputData);
    if (options?.decode) { options.sync = true; }
    const result = await genericAdvanceInput<ifaces.RemoveCartridgePayload>(client,dappAddress,'0xa850c582',data, options)
    if (options?.decode) {
        return decodeAdvance(result as AdvanceOutput,decodeToModel,options);
    }
    return result;
}

export async function replay(
    client:Signer,
    dappAddress:string,
    inputData: ifaces.Replay,
    options?:MutationOptions
):Promise<AdvanceOutput|ContractReceipt|any[]> {
    const data: Replay = new Replay(inputData);
    if (options?.decode) { options.sync = true; }
    const result = await genericAdvanceInput<ifaces.Replay>(client,dappAddress,'0x456c9a94',data, options)
    if (options?.decode) {
        return decodeAdvance(result as AdvanceOutput,decodeToModel,options);
    }
    return result;
}


/*
 * Queries/Inspects
 */

export async function cartridge(
    inputData: ifaces.CartridgePayloadSplittable,
    options?:QueryOptions
):Promise<InspectReport|any> {
    const route = 'app/cartridge';
    let part:number = 0;
    let hasMoreParts:boolean = false;
    const output: InspectReport = {payload: "0x"}
    do {
        hasMoreParts = false;
        let inputDataSplittable = Object.assign({part},inputData);
        const data: CartridgePayloadSplittable = new CartridgePayloadSplittable(inputDataSplittable);
        const partOutput: InspectReport = await genericInspect<ifaces.CartridgePayloadSplittable>(data,route,options);
        let payloadHex = partOutput.payload.substring(2);
        if (payloadHex.length/2 > MAX_SPLITTABLE_OUTPUT_SIZE) {
            part++;
            payloadHex = payloadHex.substring(0, payloadHex.length - 2);
            hasMoreParts = true;
        }
        output.payload += payloadHex;
    } while (hasMoreParts)
    if (options?.decode) { return decodeToModel(output,options.decodeModel || "json"); }
    return output;
}

export async function cartridgeInfo(
    inputData: ifaces.CartridgePayload,
    options?:QueryOptions
):Promise<InspectReport|any> {
    const route = 'app/cartridge_info';
    const data: CartridgePayload = new CartridgePayload(inputData);
    const output: InspectReport = await genericInspect<ifaces.CartridgePayload>(data,route,options);
    if (options?.decode) { return decodeToModel(output,options.decodeModel || "json"); }
    return output;
}

export async function cartridges(
    inputData: ifaces.CartridgesPayload,
    options?:QueryOptions
):Promise<InspectReport|any> {
    const route = 'app/cartridges';
    const data: CartridgesPayload = new CartridgesPayload(inputData);
    const output: InspectReport = await genericInspect<ifaces.CartridgesPayload>(data,route,options);
    if (options?.decode) { return decodeToModel(output,options.decodeModel || "json"); }
    return output;
}


/*
 * Indexer Query
 */

export async function getOutputs(
    inputData: indexerIfaces.IndexerPayload,
    options?:InspectOptions
):Promise<any[]> {
    return genericGetOutputs(inputData,decodeToModel,options);
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

export class RemoveCartridgePayload extends IOData<ifaces.RemoveCartridgePayload> { constructor(data: ifaces.RemoveCartridgePayload, validate: boolean = true) { super(models['RemoveCartridgePayload'],data,validate); } }
export function exportToRemoveCartridgePayload(data: ifaces.RemoveCartridgePayload): string {
    const dataToExport: RemoveCartridgePayload = new RemoveCartridgePayload(data);
    return dataToExport.export();
}

export class InserCartridgePayload extends IOData<ifaces.InserCartridgePayload> { constructor(data: ifaces.InserCartridgePayload, validate: boolean = true) { super(models['InserCartridgePayload'],data,validate); } }
export function exportToInserCartridgePayload(data: ifaces.InserCartridgePayload): string {
    const dataToExport: InserCartridgePayload = new InserCartridgePayload(data);
    return dataToExport.export();
}

export class Replay extends IOData<ifaces.Replay> { constructor(data: ifaces.Replay, validate: boolean = true) { super(models['Replay'],data,validate); } }
export function exportToReplay(data: ifaces.Replay): string {
    const dataToExport: Replay = new Replay(data);
    return dataToExport.export();
}

export class CartridgesPayload extends IOData<ifaces.CartridgesPayload> { constructor(data: ifaces.CartridgesPayload, validate: boolean = true) { super(models['CartridgesPayload'],data,validate); } }
export function exportToCartridgesPayload(data: ifaces.CartridgesPayload): string {
    const dataToExport: CartridgesPayload = new CartridgesPayload(data);
    return dataToExport.export();
}

export class CartridgePayloadSplittable extends IOData<ifaces.CartridgePayloadSplittable> { constructor(data: ifaces.CartridgePayloadSplittable, validate: boolean = true) { super(models['CartridgePayloadSplittable'],data,validate); } }
export function exportToCartridgePayloadSplittable(data: ifaces.CartridgePayloadSplittable): string {
    const dataToExport: CartridgePayloadSplittable = new CartridgePayloadSplittable(data);
    return dataToExport.export();
}

export class CartridgePayload extends IOData<ifaces.CartridgePayload> { constructor(data: ifaces.CartridgePayload, validate: boolean = true) { super(models['CartridgePayload'],data,validate); } }
export function exportToCartridgePayload(data: ifaces.CartridgePayload): string {
    const dataToExport: CartridgePayload = new CartridgePayload(data);
    return dataToExport.export();
}

export class CartridgeInfo extends Output<ifaces.CartridgeInfo> { constructor(output: CartesiReport | InspectReport) { super(models['CartridgeInfo'],output); } }
export function decodeToCartridgeInfo(output: CartesiReport | CartesiNotice | CartesiVoucher | InspectReport): CartridgeInfo {
    return new CartridgeInfo(output as CartesiReport);
}

export class CartridgesOutput extends Output<ifaces.CartridgesOutput> { constructor(output: CartesiReport | InspectReport) { super(models['CartridgesOutput'],output); } }
export function decodeToCartridgesOutput(output: CartesiReport | CartesiNotice | CartesiVoucher | InspectReport): CartridgesOutput {
    return new CartridgesOutput(output as CartesiReport);
}

export class ScoreboardsOutput extends Output<ifaces.ScoreboardsOutput> { constructor(output: CartesiReport | InspectReport) { super(models['ScoreboardsOutput'],output); } }
export function decodeToScoreboardsOutput(output: CartesiReport | CartesiNotice | CartesiVoucher | InspectReport): ScoreboardsOutput {
    return new ScoreboardsOutput(output as CartesiReport);
}

export class ScoresOutput extends Output<ifaces.ScoresOutput> { constructor(output: CartesiReport | InspectReport) { super(models['ScoresOutput'],output); } }
export function decodeToScoresOutput(output: CartesiReport | CartesiNotice | CartesiVoucher | InspectReport): ScoresOutput {
    return new ScoresOutput(output as CartesiReport);
}

export class CartridgeInserted extends Event<ifaces.CartridgeInserted> { constructor(output: CartesiNotice) { super(models['CartridgeInserted'],output); } }
export function decodeToCartridgeInserted(output: CartesiReport | CartesiNotice | CartesiVoucher | InspectReport): CartridgeInserted {
    return new CartridgeInserted(output as CartesiNotice);
}

export class CartridgeRemoved extends Event<ifaces.CartridgeRemoved> { constructor(output: CartesiNotice) { super(models['CartridgeRemoved'],output); } }
export function decodeToCartridgeRemoved(output: CartesiReport | CartesiNotice | CartesiVoucher | InspectReport): CartridgeRemoved {
    return new CartridgeRemoved(output as CartesiNotice);
}

export class ReplayScore extends Event<ifaces.ReplayScore> { constructor(output: CartesiNotice) { super(models['ReplayScore'],output); } }
export function decodeToReplayScore(output: CartesiReport | CartesiNotice | CartesiVoucher | InspectReport): ReplayScore {
    return new ReplayScore(output as CartesiNotice);
}

export class ScoreboardCreated extends Event<ifaces.ScoreboardCreated> { constructor(output: CartesiNotice) { super(models['ScoreboardCreated'],output); } }
export function decodeToScoreboardCreated(output: CartesiReport | CartesiNotice | CartesiVoucher | InspectReport): ScoreboardCreated {
    return new ScoreboardCreated(output as CartesiNotice);
}

export class ScoreboardRemoved extends Event<ifaces.ScoreboardRemoved> { constructor(output: CartesiNotice) { super(models['ScoreboardRemoved'],output); } }
export function decodeToScoreboardRemoved(output: CartesiReport | CartesiNotice | CartesiVoucher | InspectReport): ScoreboardRemoved {
    return new ScoreboardRemoved(output as CartesiNotice);
}

export class ScoreboardReplayScore extends Event<ifaces.ScoreboardReplayScore> { constructor(output: CartesiNotice) { super(models['ScoreboardReplayScore'],output); } }
export function decodeToScoreboardReplayScore(output: CartesiReport | CartesiNotice | CartesiVoucher | InspectReport): ScoreboardReplayScore {
    return new ScoreboardReplayScore(output as CartesiNotice);
}


/**
 * Model
 */

export const models: Models = {
    'RemoveCartridgePayload': {
        ioType:IOType.mutationPayload,
        abiTypes:['bytes32'],
        params:['id'],
        exporter: exportToRemoveCartridgePayload,
        validator: ajv.compile<ifaces.RemoveCartridgePayload>(JSON.parse('{"title": "RemoveCartridgePayload", "type": "object", "properties": {"id": {"type": "string", "format": "binary"}}, "required": ["id"]}'))
    },
    'InserCartridgePayload': {
        ioType:IOType.mutationPayload,
        abiTypes:['bytes'],
        params:['data'],
        exporter: exportToInserCartridgePayload,
        validator: ajv.compile<ifaces.InserCartridgePayload>(JSON.parse('{"title": "InserCartridgePayload", "type": "object", "properties": {"data": {"type": "string", "format": "binary"}}, "required": ["data"]}'))
    },
    'Replay': {
        ioType:IOType.mutationPayload,
        abiTypes:['bytes32', 'bytes32', 'string', 'bytes', 'bytes', 'string'],
        params:['cartridge_id', 'outcard_hash', 'args', 'in_card', 'log', 'user_alias'],
        exporter: exportToReplay,
        validator: ajv.compile<ifaces.Replay>(JSON.parse('{"title": "Replay", "type": "object", "properties": {"cartridge_id": {"type": "string", "format": "binary"}, "outcard_hash": {"type": "string", "format": "binary"}, "args": {"type": "string"}, "in_card": {"type": "string", "format": "binary"}, "log": {"type": "string", "format": "binary"}, "user_alias": {"type": "string"}}, "required": ["cartridge_id", "outcard_hash", "args", "in_card", "log", "user_alias"]}'))
    },
    'CartridgesPayload': {
        ioType:IOType.queryPayload,
        abiTypes:[],
        params:['name', 'tags', 'page', 'page_size'],
        exporter: exportToCartridgesPayload,
        validator: ajv.compile<ifaces.CartridgesPayload>(JSON.parse('{"title": "CartridgesPayload", "type": "object", "properties": {"name": {"type": "string"}, "tags": {"type": "array", "items": {"type": "string"}}, "page": {"type": "integer"}, "page_size": {"type": "integer"}}}'))
    },
    'CartridgePayloadSplittable': {
        ioType:IOType.queryPayload,
        abiTypes:[],
        params:['id', 'part'],
        exporter: exportToCartridgePayloadSplittable,
        validator: ajv.compile<ifaces.CartridgePayloadSplittable>(JSON.parse('{"title": "CartridgePayloadSplittable", "type": "object", "properties": {"id": {"type": "string"}, "part": {"type": "integer"}}, "required": ["id"]}'))
    },
    'CartridgePayload': {
        ioType:IOType.queryPayload,
        abiTypes:[],
        params:['id'],
        exporter: exportToCartridgePayload,
        validator: ajv.compile<ifaces.CartridgePayload>(JSON.parse('{"title": "CartridgePayload", "type": "object", "properties": {"id": {"type": "string"}}, "required": ["id"]}'))
    },
    'CartridgeInfo': {
        ioType:IOType.report,
        abiTypes:[],
        params:['id', 'name', 'user_address', 'info', 'created_at', 'cover'],
        decoder: decodeToCartridgeInfo,
        validator: ajv.compile<ifaces.CartridgeInfo>(JSON.parse('{"title": "CartridgeInfo", "type": "object", "properties": {"id": {"type": "string"}, "name": {"type": "string"}, "user_address": {"type": "string"}, "info": {"$ref": "#/definitions/Info"}, "created_at": {"type": "integer"}, "cover": {"type": "string"}}, "required": ["id", "name", "user_address", "created_at"], "definitions": {"Author": {"title": "Author", "type": "object", "properties": {"name": {"type": "string"}, "link": {"type": "string"}}, "required": ["name", "link"]}, "Info": {"title": "Info", "type": "object", "properties": {"name": {"type": "string"}, "summary": {"type": "string"}, "description": {"type": "string"}, "version": {"type": "string"}, "status": {"type": "string"}, "tags": {"type": "array", "items": {"type": "string"}}, "authors": {"type": "array", "items": {"$ref": "#/definitions/Author"}}, "url": {"type": "string"}}, "required": ["name", "tags"]}}}'))
    },
    'CartridgesOutput': {
        ioType:IOType.report,
        abiTypes:[],
        params:['data', 'total', 'page'],
        decoder: decodeToCartridgesOutput,
        validator: ajv.compile<ifaces.CartridgesOutput>(JSON.parse('{"title": "CartridgesOutput", "type": "object", "properties": {"data": {"type": "array", "items": {"$ref": "#/definitions/CartridgeInfo"}}, "total": {"type": "integer"}, "page": {"type": "integer"}}, "required": ["data", "total", "page"], "definitions": {"Author": {"title": "Author", "type": "object", "properties": {"name": {"type": "string"}, "link": {"type": "string"}}, "required": ["name", "link"]}, "Info": {"title": "Info", "type": "object", "properties": {"name": {"type": "string"}, "summary": {"type": "string"}, "description": {"type": "string"}, "version": {"type": "string"}, "status": {"type": "string"}, "tags": {"type": "array", "items": {"type": "string"}}, "authors": {"type": "array", "items": {"$ref": "#/definitions/Author"}}, "url": {"type": "string"}}, "required": ["name", "tags"]}, "CartridgeInfo": {"title": "CartridgeInfo", "type": "object", "properties": {"id": {"type": "string"}, "name": {"type": "string"}, "user_address": {"type": "string"}, "info": {"$ref": "#/definitions/Info"}, "created_at": {"type": "integer"}, "cover": {"type": "string"}}, "required": ["id", "name", "user_address", "created_at"]}}}'))
    },
    'ScoreboardsOutput': {
        ioType:IOType.report,
        abiTypes:[],
        params:['data', 'total', 'page'],
        decoder: decodeToScoreboardsOutput,
        validator: ajv.compile<ifaces.ScoreboardsOutput>(JSON.parse('{"title": "ScoreboardsOutput", "type": "object", "properties": {"data": {"type": "array", "items": {"$ref": "#/definitions/ScoreboardInfo"}}, "total": {"type": "integer"}, "page": {"type": "integer"}}, "required": ["data", "total", "page"], "definitions": {"ScoreboardInfo": {"title": "ScoreboardInfo", "type": "object", "properties": {"id": {"type": "string"}, "name": {"type": "string"}, "cartridge_id": {"type": "string"}, "created_by": {"type": "string"}, "created_at": {"type": "integer"}, "args": {"type": "string"}, "in_card": {"type": "string", "format": "binary"}, "score_function": {"type": "string"}}, "required": ["id", "name", "cartridge_id", "created_by", "created_at", "args", "in_card", "score_function"]}}}'))
    },
    'ScoresOutput': {
        ioType:IOType.report,
        abiTypes:[],
        params:['data', 'total', 'page'],
        decoder: decodeToScoresOutput,
        validator: ajv.compile<ifaces.ScoresOutput>(JSON.parse('{"title": "ScoresOutput", "type": "object", "properties": {"data": {"type": "array", "items": {"$ref": "#/definitions/ScoreInfo"}}, "total": {"type": "integer"}, "page": {"type": "integer"}}, "required": ["data", "total", "page"], "definitions": {"ScoreInfo": {"title": "ScoreInfo", "type": "object", "properties": {"user_address": {"type": "string"}, "timestamp": {"type": "integer"}, "score": {"type": "integer"}}, "required": ["user_address", "timestamp", "score"]}}}'))
    },
    'CartridgeInserted': {
        ioType:IOType.notice,
        abiTypes:['string', 'string', 'uint'],
        params:['cartridge_id', 'user_address', 'timestamp'],
        decoder: decodeToCartridgeInserted,
        validator: ajv.compile<ifaces.CartridgeInserted>(JSON.parse('{"title": "CartridgeInserted", "type": "object", "properties": {"cartridge_id": {"type": "string"}, "user_address": {"type": "string"}, "timestamp": {"type": "integer"}}, "required": ["cartridge_id", "user_address", "timestamp"]}'.replaceAll('integer','string","format":"biginteger')))
    },
    'CartridgeRemoved': {
        ioType:IOType.notice,
        abiTypes:['string', 'uint'],
        params:['cartridge_id', 'timestamp'],
        decoder: decodeToCartridgeRemoved,
        validator: ajv.compile<ifaces.CartridgeRemoved>(JSON.parse('{"title": "CartridgeRemoved", "type": "object", "properties": {"cartridge_id": {"type": "string"}, "timestamp": {"type": "integer"}}, "required": ["cartridge_id", "timestamp"]}'.replaceAll('integer','string","format":"biginteger')))
    },
    'ReplayScore': {
        ioType:IOType.notice,
        abiTypes:['bytes32', 'address', 'uint', 'int', 'int', 'int', 'string', 'string', 'string', 'bytes32'],
        params:['cartridge_id', 'user_address', 'timestamp', 'score', 'score_type', 'extra_score', 'extra', 'user_alias', 'screenshot_cid', 'gameplay_hash'],
        decoder: decodeToReplayScore,
        validator: ajv.compile<ifaces.ReplayScore>(JSON.parse('{"title": "ReplayScore", "type": "object", "properties": {"cartridge_id": {"type": "string", "format": "binary"}, "user_address": {"type": "string"}, "timestamp": {"type": "integer"}, "score": {"type": "integer"}, "score_type": {"default": 0, "type": "integer"}, "extra_score": {"default": 0, "type": "integer"}, "extra": {"default": "", "type": "string"}, "user_alias": {"default": "", "type": "string"}, "screenshot_cid": {"default": "", "type": "string"}, "gameplay_hash": {"type": "string", "format": "binary"}}, "required": ["cartridge_id", "user_address", "timestamp", "score", "gameplay_hash"]}'.replaceAll('integer','string","format":"biginteger')))
    },
    'ScoreboardCreated': {
        ioType:IOType.notice,
        abiTypes:['bytes32', 'string', 'uint'],
        params:['scoreboard_id', 'created_by', 'created_at'],
        decoder: decodeToScoreboardCreated,
        validator: ajv.compile<ifaces.ScoreboardCreated>(JSON.parse('{"title": "ScoreboardCreated", "type": "object", "properties": {"scoreboard_id": {"type": "string", "format": "binary"}, "created_by": {"type": "string"}, "created_at": {"type": "integer"}}, "required": ["scoreboard_id", "created_by", "created_at"]}'.replaceAll('integer','string","format":"biginteger')))
    },
    'ScoreboardRemoved': {
        ioType:IOType.notice,
        abiTypes:['bytes32', 'uint'],
        params:['scoreboard_id', 'timestamp'],
        decoder: decodeToScoreboardRemoved,
        validator: ajv.compile<ifaces.ScoreboardRemoved>(JSON.parse('{"title": "ScoreboardRemoved", "type": "object", "properties": {"scoreboard_id": {"type": "string", "format": "binary"}, "timestamp": {"type": "integer"}}, "required": ["scoreboard_id", "timestamp"]}'.replaceAll('integer','string","format":"biginteger')))
    },
    'ScoreboardReplayScore': {
        ioType:IOType.notice,
        abiTypes:['bytes32', 'address', 'uint', 'int', 'int', 'int', 'string', 'string', 'string', 'bytes32'],
        params:['cartridge_id', 'user_address', 'timestamp', 'score', 'score_type', 'extra_score', 'scoreboard_id', 'user_alias', 'screenshot_cid', 'gameplay_hash'],
        decoder: decodeToScoreboardReplayScore,
        validator: ajv.compile<ifaces.ScoreboardReplayScore>(JSON.parse('{"title": "ScoreboardReplayScore", "type": "object", "properties": {"cartridge_id": {"type": "string", "format": "binary"}, "user_address": {"type": "string"}, "timestamp": {"type": "integer"}, "score": {"type": "integer"}, "score_type": {"default": 1, "type": "integer"}, "extra_score": {"type": "integer"}, "scoreboard_id": {"type": "string"}, "user_alias": {"default": "", "type": "string"}, "screenshot_cid": {"default": "", "type": "string"}, "gameplay_hash": {"type": "string", "format": "binary"}}, "required": ["cartridge_id", "user_address", "timestamp", "score", "extra_score", "scoreboard_id", "gameplay_hash"]}'.replaceAll('integer','string","format":"biginteger')))
    },
    };