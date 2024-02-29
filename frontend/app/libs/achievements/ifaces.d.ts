/* eslint-disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

export interface _Master_ {
  AchievementsPayload: AchievementsPayload;
  AchievementsOutput: AchievementsOutput;
  MomentsOutput: MomentsOutput;
  GameplaysOutput: GameplaysOutput;
  CreateAchievementsPayload: CreateAchievementsPayload;
  CollectValuePayload: CollectValuePayload;
  CollectMomentPayload: CollectMomentPayload;
  ReleaseMomentPayload: ReleaseMomentPayload;
  MomentValues: MomentValues;
  AchievementInfo: AchievementInfo;
  AcquiredAchievement: AcquiredAchievement;
  CollectedMoment: CollectedMoment;
  GameplayInfo: GameplayInfo;
  GameplayPayload: GameplayPayload;
  GameplaysPayload: GameplaysPayload;
  MomentInfo: MomentInfo;
  MomentsPayload: MomentsPayload;
  ReplayAchievements: ReplayAchievements;
  AchievementPayload: AchievementPayload;
}
export interface AchievementsPayload {
  cartridge_id?: string;
  user_address?: string;
  name?: string;
  order_by?: string;
  order_dir?: string;
  page?: number;
  page_size?: number;
  player?: string;
}
export interface AchievementsOutput {
  data: AchievementInfo[];
  total: number;
  page: number;
}
export interface AchievementInfo {
  id: string;
  name: string;
  description: string;
  expression: string;
  cartridge_id: string;
  created_by: string;
  created_at: number;
  icon?: string;
  users?: UserAchievementInfo[];
  player_achieved?: boolean;
  total_cartridge_players: number;
  total_players_achieved: number;
}
export interface UserAchievementInfo {
  id: number;
  user_address: string;
  timestamp: number;
  frame: number;
  index: number;
  gameplay_id?: string;
  achievement_id?: string;
  achievement_name?: string;
  achievement_description?: string;
  achievement_icon?: string;
  number_collected_moments?: number;
}
export interface MomentsOutput {
  data: MomentInfo[];
  total: number;
  page: number;
}
export interface MomentInfo {
  id: string;
  user_address: string;
  timestamp: number;
  frame: number;
  index: number;
  shares: number;
  value?: number;
}
export interface GameplaysOutput {
  data: GameplayInfo[];
  total: number;
  page: number;
}
export interface GameplayInfo {
  id: string;
  cartridge_id: string;
  user_address: string;
  timestamp: number;
  share_value: number;
  total_shares?: number;
  achievements?: UserAchievementInfo[];
  moments?: MomentInfo[];
}
export interface CreateAchievementsPayload {
  cartridge_id: string;
  name: string;
  description: string;
  expression: string;
  icon: string;
  outcard_hash: string;
  args: string;
  in_card: string;
  log: string;
}
export interface CollectValuePayload {
  id: number;
}
export interface CollectMomentPayload {
  gameplay_id: string;
  outcard_hash: string;
  args: string;
  in_card: string;
  log: string;
  frame: number;
  user_achievement: number;
}
export interface ReleaseMomentPayload {
  id: number;
}
export interface MomentValues {
  total_moments: number;
  total_shares: number;
  buy_base_value: number;
  sell_base_value: number;
  buy_fee: number;
  sell_fee: number;
  shares_to_buy: number;
  share_value_after_buy: number;
  share_value_after_sell: number;
  buy_in_fee: number;
  collectors_pool_fee: number;
  developer_fee: number;
  player_fee: number;
}
export interface AcquiredAchievement {
  cartridge_id: string;
  user_address: string;
  achievement_id: string;
  gameplay_id: string;
  timestamp: number;
  frame: number;
  index: number;
  cid?: string;
}
export interface CollectedMoment {
  cartridge_id: string;
  user_address: string;
  gameplay_id: string;
  timestamp: number;
  frame: number;
  index: number;
  cid?: string;
}
export interface GameplayPayload {
  id: string;
}
export interface GameplaysPayload {
  cartridge_id?: string;
  user_address?: string;
  order_by?: string;
  order_dir?: string;
  page?: number;
  page_size?: number;
}
export interface MomentsPayload {
  cartridge_id?: string;
  gameplay_id?: string;
  user_address?: string;
  order_by?: string;
  order_dir?: string;
  page?: number;
  page_size?: number;
}
export interface ReplayAchievements {
  cartridge_id: string;
  outcard_hash: string;
  args: string;
  in_card: string;
  log: string;
  achievements: string[];
}
export interface AchievementPayload {
  id: string;
}
