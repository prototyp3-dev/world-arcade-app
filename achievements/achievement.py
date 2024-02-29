import os
from pydantic import BaseModel
import logging
from typing import Optional, List
from hashlib import sha256
import json
from py_expression_eval import Parser
import base64

from cartesi.abi import String, Bytes, Bytes32, UInt, Address

from cartesapp.storage import helpers
from cartesapp.context import get_metadata
from cartesapp.input import mutation, query
from cartesapp.output import add_output, event, emit_event, output
from cartesapp.utils import str2bytes, hex2bytes

from app.cartridge import Cartridge
from app.replay import Replay
from app.common import get_cid

from .common import Bytes32List, Gameplay, Achievement, UserAchievement, return_error
from .riv import replay_hist, replay_screenshot

LOGGER = logging.getLogger(__name__)



###
# Model

# Inputs

class ReplayAchievements(BaseModel):
    cartridge_id:   Bytes32
    outcard_hash:   Bytes32
    args:           String
    in_card:        Bytes
    log:            Bytes
    achievements:   Bytes32List

class CreateAchievementsPayload(BaseModel):
    cartridge_id:   Bytes32
    name:           String
    description:    String
    expression:     String
    icon:           Bytes
    outcard_hash:   Bytes32
    args:           String
    in_card:        Bytes
    log:            Bytes

class AchievementsPayload(BaseModel):
    cartridge_id:   Optional[str]
    user_address:   Optional[str]
    name:           Optional[str]
    order_by:       Optional[str]
    order_dir:      Optional[str]
    page:           Optional[int]
    page_size:      Optional[int]
    player:         Optional[str]

class AchievementPayload(BaseModel):
    id: str

# Outputs

@event()
class AcquiredAchievement(BaseModel):
    cartridge_id:   Bytes32
    user_address:   Address
    achievement_id: Bytes32
    gameplay_id:    Bytes32
    timestamp:      UInt
    frame:          UInt
    index:          UInt
    cid:            String = ''

class UserAchievementInfo(BaseModel):
    id: UInt
    user_address: String
    timestamp: UInt
    frame: UInt
    index: UInt
    gameplay_id: Optional[str]
    achievement_id: Optional[str]
    achievement_name: Optional[str]
    achievement_description: Optional[str]
    achievement_icon: Optional[str]
    number_collected_moments: Optional[int]

@output()
class AchievementInfo(BaseModel):
    id: String
    name: String
    description: String
    expression: String
    cartridge_id: String
    created_by: String
    created_at: UInt
    icon: Optional[str]
    users: Optional[List[UserAchievementInfo]]
    player_achieved: Optional[bool]
    total_cartridge_players: int
    total_players_achieved: int

@output()
class AchievementsOutput(BaseModel):
    data:   List[AchievementInfo]
    total:  UInt
    page:   UInt


###
# Mutations

@mutation(module_name='app') # trap app replay 
def replay(payload: Replay) -> bool:
    
    metadata = get_metadata()
    gameplay_hash = sha256(payload.log)

    user_address = metadata.msg_sender.lower()

    # check if gameplay already exists
    gameplay = helpers.select(r for r in Gameplay if r.id == gameplay_hash.hexdigest()).first()
    if gameplay is not None: return return_error(f"Gameplay already submitted",LOGGER)

    # check if cartridge exists
    cartridge = helpers.select(c for c in Cartridge if c.id == payload.cartridge_id.hex()).first()
    if cartridge is None: return return_error(f"Game not found",LOGGER)

    # save gameplay
    g = Gameplay(
        id                  = gameplay_hash.hexdigest(),
        cartridge_id        = payload.cartridge_id.hex(),
        user_address        = user_address,
        timestamp           = metadata.timestamp,
        args_hash           = sha256(str2bytes(payload.args)).hexdigest(),
        in_card_hash        = sha256(payload.in_card).hexdigest(),
        share_value         = "0x0",
        total_shares        = 0
    )
    # TODO: index use gameplay from input, so we don't add to the output
    add_output(payload.log,tags=['replay',payload.cartridge_id.hex(),gameplay_hash.hexdigest()])

    # evaluate gameplay achievements
    #   runs gameplay and get hist
    #   evaluate achievements againt a list (or all if none) and save them
    try:
        _evaluate_gameplay_achievements(payload.cartridge_id.hex(),payload.log,payload.args,payload.in_card,payload.outcard_hash,g)
    except Exception as e:
        return return_error(f"Couldn't evaluate achievements: {e}",LOGGER)

    return True


@mutation()
def achievements_replay(payload: ReplayAchievements) -> bool:
    
    metadata = get_metadata()
    gameplay_hash = sha256(payload.log)

    # check if cartridge exists
    cartridge = helpers.select(c for c in Cartridge if c.id == payload.cartridge_id.hex()).first()
    if cartridge is None: return return_error(f"Game not found",LOGGER)

    # save gameplay if it doesn't exist
    gameplay = helpers.select(r for r in Gameplay if r.id == gameplay_hash.hexdigest()).first()
    if gameplay is None:
        gameplay = Gameplay(
            id                  = gameplay_hash.hexdigest(),
            cartridge_id        = payload.cartridge_id.hex(),
            user_address        = metadata.msg_sender.lower(),
            timestamp           = metadata.timestamp,
            args_hash           = sha256(str2bytes(payload.args)).hexdigest(),
            in_card_hash        = sha256(payload.in_card).hexdigest(),
            share_value         = "0x0",
            total_shares        = 0
        )
        add_output(payload.log,tags=['replay',payload.cartridge_id.hex(),gameplay_hash.hexdigest()])
    else:
        if gameplay.args_hash != sha256(str2bytes(payload.args)).hexdigest() and \
            gameplay.in_card_hash != sha256(payload.in_card).hexdigest():
            return return_error(f"Args and incard don't match to original gameplay",LOGGER)

    # evaluate gameplay achievements
    #   runs gameplay and get hist
    #   evaluate achievements againt a list (or all if none) and save them
    try:
        _evaluate_gameplay_achievements(payload.cartridge_id.hex(),payload.log,payload.args,payload.in_card,payload.outcard_hash,gameplay,[a.hex() for a in payload.achievements])
    except Exception as e:
        return return_error(f"Couldn't evaluate achievements: {e}",LOGGER)

    return True


@mutation()
def create_achievement(payload: CreateAchievementsPayload) -> bool:
    
    metadata = get_metadata()
    gameplay_hash = sha256(payload.log)

    # check if cartridge already exists
    cartridge = helpers.select(c for c in Cartridge if c.id == payload.cartridge_id.hex()).first()
    if cartridge is None: return return_error(f"Game not found",LOGGER)

    # check if achievement already exists
    achievement_id = get_achievement_id(payload.expression,payload.cartridge_id.hex())
    if helpers.count(r.id for r in Achievement if r.id == achievement_id) > 0:
        return return_error(f"Achievement expression already exists",LOGGER)

    if helpers.count(r.id for r in Achievement if r.name == payload.name and r.cartridge_id == payload.cartridge_id.hex()) > 0:
        return return_error(f"Achievement {payload.name} already exists for this cartridge",LOGGER)

    new_achievement = Achievement(
        id              = achievement_id,
        name            = payload.name,
        description     = payload.description,
        cartridge_id    = cartridge.id,
        created_by      = metadata.msg_sender.lower(),
        created_at      = metadata.timestamp,
        expression      = payload.expression,
        icon            = payload.icon
    )

    # save gameplay
    gameplay = helpers.select(r for r in Gameplay if r.id == gameplay_hash.hexdigest()).first()
    if gameplay is None:
        gameplay = Gameplay(
            id                  = gameplay_hash.hexdigest(),
            cartridge_id        = payload.cartridge_id.hex(),
            user_address        = metadata.msg_sender.lower(),
            timestamp           = metadata.timestamp,
            args_hash           = sha256(str2bytes(payload.args)).hexdigest(),
            in_card_hash        = sha256(payload.in_card).hexdigest(),
            share_value         = "0x0",
            total_shares        = 0
        )
        add_output(payload.log,tags=['replay',payload.cartridge_id.hex(),gameplay_hash.hexdigest()])
    else:
        if gameplay.args_hash != sha256(str2bytes(payload.args)).hexdigest() and \
            gameplay.in_card_hash != sha256(payload.in_card).hexdigest():
            return return_error(f"Args and incard don't match to original gameplay",LOGGER)

    try:
        n_achievements = _evaluate_gameplay_achievements(payload.cartridge_id.hex(),payload.log,payload.args,payload.in_card,payload.outcard_hash,gameplay,[new_achievement.id])
    except Exception as e:
        return return_error(f"Couldn't evaluate achievements: {e}",LOGGER)

    if n_achievements == 0: return return_error(f"Can't create achievement: Gameplay doesn't prove achievement is possible",LOGGER)

    return True


# TODO: achievement challenge

# TODO: achievement cleanup


###
# Queries

# achievement list

@query()
def achievements(payload: AchievementsPayload) -> bool:
    achievements_query = Achievement.select()

    if payload.cartridge_id is not None:
        achievements_query = achievements_query.filter(lambda r: payload.cartridge_id == r.cartridge_id)

    if payload.user_address is not None:
        achievements_query = achievements_query.filter(lambda r: payload.user_address.lower() == r.user_address)

    if payload.name is not None:
        achievements_query = achievements_query.filter(lambda r: payload.name.lower() in r.name.lower())

    total = achievements_query.count()

    if payload.order_by is not None:
        dir_order = lambda d: d
        if payload.order_dir is not None and payload.order_dir == 'desc':
            dir_order = helpers.desc
        if payload.order_by == 'popular':
            achievements_query = achievements_query.order_by(lambda r: dir_order(helpers.count(r.users)))
        else:
            achievements_query = achievements_query.order_by(dir_order(getattr(Achievement,payload.order_by)))

    page = 1
    if payload.page is not None:
        page = payload.page
        if payload.page_size is not None:
            achievements = achievements_query.page(payload.page,payload.page_size)
        else:
            achievements = achievements_query.page(payload.page)
    else:
        achievements = achievements_query.fetch()
        
    total_cartridge_players = {}
    dict_list_result = []
    for achievement in achievements:
        achievement_dict = achievement.to_dict()
        if payload.player is not None:
            achievement_dict["player_achieved"] = helpers.count(u for u in achievement.users if u.user_address == payload.player.lower()) > 0
        if achievement.icon is not None: achievement_dict['icon'] = base64.b64encode(achievement.icon)
        dict_list_result.append(achievement_dict)
        
        if total_cartridge_players.get(achievement.cartridge_id) is None:
            total_cartridge_players[achievement.cartridge_id] = helpers.count(r.user_address for r in Gameplay if r.cartridge_id == achievement.cartridge_id)
        
        achievement_dict['total_cartridge_players'] = total_cartridge_players[achievement.cartridge_id]
        achievement_dict['total_players_achieved'] = helpers.count(u for u in achievement.users) 

    LOGGER.info(f"Returning {len(dict_list_result)} of {total} Achivements")
    
    out = AchievementsOutput.parse_obj({'data':dict_list_result,'total':total,'page':page})
    add_output(out)

    return True

# achievement info

@query()
def achievement_info(payload: AchievementPayload) -> bool:
    achievement = helpers.select(r for r in Achievement if r.id == payload.id).first()

    if achievement is not None:
        achievement_dict = achievement.to_dict()

        user_achievements = []
        # list(achievement.users).sort(key = lambda r: -len(r.moments))
        for user_achievement in achievement.users:
            user_achievement_dict = user_achievement.to_dict()
            user_achievement_dict['gameplay_id'] = user_achievement.gameplay.id
            user_achievements.append(user_achievement_dict)

        achievement_dict['users'] = user_achievements
        if achievement.icon is not None: achievement_dict['icon'] = base64.b64encode(achievement.icon)

        achievement_dict['total_cartridge_players'] = helpers.count(r.user_address for r in Gameplay if r.cartridge_id == achievement.cartridge_id)
        achievement_dict['total_players_achieved'] = len(user_achievements)

        out = AchievementInfo.parse_obj(achievement_dict)
        add_output(out)
    else:
        add_output("null")

    LOGGER.info(f"Returning achievement {payload.id} info")

    return True

###
# Helpers

def get_achievement_id(expression: str, cartridge_id: str) -> str:
    return sha256(str2bytes(expression)+hex2bytes(cartridge_id)).hexdigest()

def _evaluate_gameplay_achievements(cartridge_id, log, args, in_card, replay_outcard_hash, gameplay, achievement_list = None) -> int:
    LOGGER.info("Replaying to get outcard history...")

    # get list of achievements to process
    achievement_query = helpers.left_join(a for a in Achievement for u in a.users if a.cartridge_id == cartridge_id and (not u or u.user_address != gameplay.user_address))

    if achievement_list is not None and len(achievement_list) > 0:
        achievement_query = achievement_query.filter(lambda r: r.id in tuple(achievement_list))

    achievements_to_check = achievement_query.fetch()
    if len(achievements_to_check) == 0:
        LOGGER.info("No achievements to check")
        return

    # process replay
    try:
        outhist_raw, outhash = replay_hist(cartridge_id,log,args,in_card)
    except Exception as e:
        raise Exception(f"Couldn't replay log: {e}")

    # process outhist
    
    try:
        outhist = json.loads(outhist_raw)
    except Exception as e:
        raise Exception(f"Couldn't convert outhist to json: {e}")

    if replay_outcard_hash == b'\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00':
        replay_outcard_hash = outhash

    outcard_valid = outhash == replay_outcard_hash

    LOGGER.info("==== OUTCARD ====")
    LOGGER.info(f"Expected Outcard Hash: {replay_outcard_hash.hex()}")
    # LOGGER.info(f"Computed Outcard Hash: {outcard_hash.hex()}")
    LOGGER.info(f"Computed Outcard Hash: {outhash.hex()}")
    LOGGER.info(f"Valid Outcard Hash : {outcard_valid}")

    LOGGER.info(f"==== OUTHIST ====")
    LOGGER.info(f"Outhist size: {len(outhist)}")
    LOGGER.info(f"Final outcard: {outhist[-1]}")

    if not outcard_valid:
        raise Exception(f"Out card hash doesn't match")

    n_achievements_acquired = 0
    LOGGER.info(f"==== ACHIEVEMENTS ====")
    parser = Parser()
    completed_achievements = []
    for cur_outcard in outhist:
        for checking_achievement in achievements_to_check:
            if checking_achievement.id in completed_achievements: continue

            if parser.parse(checking_achievement.expression).evaluate(cur_outcard):
                n_achievements_acquired += 1
                completed_achievements.append(checking_achievement.id)
                frame = cur_outcard.get('frames') or 0

                index = helpers.count(1 for r in UserAchievement if r.achievement == checking_achievement) + 1
                LOGGER.info(f"You are the player {index} to get the {checking_achievement.name} achievement on frame {frame} with outcard={cur_outcard}!")


                ua = UserAchievement(
                    user_address    = gameplay.user_address,
                    achievement     = checking_achievement,
                    gameplay        = gameplay,
                    timestamp       = gameplay.timestamp,
                    frame           = frame,
                    index           = index
                )

                # get screenshot
                try:
                    achievement_screenshot = replay_screenshot(cartridge_id,log,args,in_card,frame)
                except Exception as e:
                    raise Exception(f"Couldn't get achievement screenshot: {e}")

                cid = get_cid(achievement_screenshot) 

                # emit achivements events
                a = AcquiredAchievement(
                    cartridge_id    = hex2bytes(gameplay.cartridge_id),
                    user_address    = gameplay.user_address,
                    timestamp       = gameplay.timestamp,
                    achievement_id  = hex2bytes(checking_achievement.id),
                    gameplay_id     = hex2bytes(gameplay.id),
                    frame           = frame,
                    index           = index,
                    cid             = cid
                )

                add_output(achievement_screenshot,tags=['achievement_screenshot',gameplay.cartridge_id,gameplay.user_address,checking_achievement.id,gameplay.id])
                # emit event
                emit_event(a,tags=['achievement_acquired',gameplay.cartridge_id,gameplay.user_address,checking_achievement.id,gameplay.id])

    return n_achievements_acquired