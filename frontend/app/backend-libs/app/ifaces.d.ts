/* eslint-disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

export interface _Master_ {
  ScoresOutput: ScoresOutput;
  ScoreboardCreated: ScoreboardCreated;
  CartridgesOutput: CartridgesOutput;
  RemoveCartridgePayload: RemoveCartridgePayload;
  CartridgeInfo: CartridgeInfo;
  CartridgePayload: CartridgePayload;
  ScoreboardRemoved: ScoreboardRemoved;
  CartridgesPayload: CartridgesPayload;
  ScoreboardsOutput: ScoreboardsOutput;
  ScoreboardReplayScore: ScoreboardReplayScore;
  CreateScoreboardPayload: CreateScoreboardPayload;
  CartridgeInserted: CartridgeInserted;
  Replay: Replay;
  ScoresPayload: ScoresPayload;
  CartridgePayloadSplittable: CartridgePayloadSplittable;
  InserCartridgePayload: InserCartridgePayload;
  ScoreboardsPayload: ScoreboardsPayload;
  CartridgeRemoved: CartridgeRemoved;
  ScoreboardReplayPayload: ScoreboardReplayPayload;
  EmptyClass: EmptyClass;
  ReplayScore: ReplayScore;
}
export interface ScoresOutput {
  data: ScoreInfo[];
  total: number;
  page: number;
}
export interface ScoreInfo {
  user_address: string;
  timestamp: number;
  score: number;
}
export interface ScoreboardCreated {
  scoreboard_id: string;
  created_by: string;
  created_at: number;
}
export interface CartridgesOutput {
  data: CartridgeInfo[];
  total: number;
  page: number;
}
export interface CartridgeInfo {
  id: string;
  name: string;
  user_address: string;
  info?: Info;
  created_at: number;
  cover?: string;
}
export interface Info {
  name: string;
  summary?: string;
  description?: string;
  version?: string;
  status?: string;
  tags: string[];
  authors?: Author[];
  url?: string;
}
export interface Author {
  name: string;
  link: string;
}
export interface RemoveCartridgePayload {
  id: string;
}
export interface CartridgePayload {
  id: string;
}
export interface ScoreboardRemoved {
  scoreboard_id: string;
  timestamp: number;
}
export interface CartridgesPayload {
  name?: string;
  tags?: string[];
  page?: number;
  page_size?: number;
}
export interface ScoreboardsOutput {
  data: ScoreboardInfo[];
  total: number;
  page: number;
}
export interface ScoreboardInfo {
  id: string;
  name: string;
  cartridge_id: string;
  created_by: string;
  created_at: number;
  args: string;
  in_card: string;
  score_function: string;
}
export interface ScoreboardReplayScore {
  cartridge_id: string;
  user_address: string;
  timestamp: number;
  score: number;
  score_type?: number;
  extra_score: number;
  scoreboard_id: string;
  user_alias?: string;
  screenshot_cid?: string;
  gameplay_hash: string;
}
export interface CreateScoreboardPayload {
  cartridge_id: string;
  name: string;
  args: string;
  in_card: string;
  score_function: string;
}
export interface CartridgeInserted {
  cartridge_id: string;
  user_address: string;
  timestamp: number;
}
export interface Replay {
  cartridge_id: string;
  outcard_hash: string;
  args: string;
  in_card: string;
  log: string;
  user_alias: string;
}
export interface ScoresPayload {
  scoreboard_id: string;
  page?: number;
  page_size?: number;
}
export interface CartridgePayloadSplittable {
  id: string;
  part?: number;
}
export interface InserCartridgePayload {
  data: string;
}
export interface ScoreboardsPayload {
  cartridge_id: string;
  name?: string;
  page?: number;
  page_size?: number;
}
export interface CartridgeRemoved {
  cartridge_id: string;
  timestamp: number;
}
export interface ScoreboardReplayPayload {
  scoreboard_id: string;
  outcard_hash: string;
  log: string;
  user_alias: string;
}
export interface EmptyClass {}
export interface ReplayScore {
  cartridge_id: string;
  user_address: string;
  timestamp: number;
  score: number;
  score_type?: number;
  extra_score?: number;
  extra?: string;
  user_alias?: string;
  screenshot_cid?: string;
  gameplay_hash: string;
}
