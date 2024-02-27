import os
from pydantic import BaseModel
import logging
from typing import Optional, List
from hashlib import sha256
import json
from py_expression_eval import Parser

from cartesi.abi import String, Bytes, Bytes32, Int, UInt, Address

from cartesapp.storage import helpers
from cartesapp.context import get_metadata
from cartesapp.input import mutation, query
from cartesapp.output import add_output, event, emit_event
from cartesapp.utils import bytes2str, str2bytes, hex2bytes

from app.cartridge import Cartridge
from app.replay import Replay
from app.common import get_cid

from .common import Bytes32List, Gameplay, Achievement, UserAchievement
from .riv import replay_hist, replay_screenshot

LOGGER = logging.getLogger(__name__)



###
# Model

# Inputs

# class Replay(BaseModel):
#     cartridge_id:   Bytes32

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

# Outputs

# @event()
# class ReplayScore(BaseModel):
#     cartridge_id:   Bytes32

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


###
# Mutations

@mutation(module_name='app') # trap app replay 
def replay(payload: Replay) -> bool:
    
    metadata = get_metadata()
    gameplay_hash = sha256(payload.log)

    user_address = metadata.msg_sender

    # check if gameplay already exists
    gameplay = helpers.select(r for r in Gameplay if r.id == gameplay_hash.hexdigest()).first()
    if gameplay is not None:
        msg = f"Gameplay already submitted"
        LOGGER.error(msg)
        add_output(msg,tags=['error'])
        return False

    # check if cartridge exists
    cartridge = helpers.select(c for c in Cartridge if c.id == payload.cartridge_id.hex()).first()
    if cartridge is None:
        msg = f"Game not found"
        LOGGER.error(msg)
        add_output(msg,tags=['error'])
        return False

    # save gameplay
    g = Gameplay(
        id                  = gameplay_hash.hexdigest(),
        cartridge_id        = payload.cartridge_id.hex(),
        user_address        = user_address,
        timestamp           = metadata.timestamp,
        args_hash           = sha256(str2bytes(payload.args)).hexdigest(),
        in_card_hash        = sha256(payload.in_card).hexdigest(),
        share_value         = 0
    )
    # TODO: index use gameplay from input, so we don't add to the output
    add_output(payload.log,tags=['payload',payload.cartridge_id.hex(),gameplay_hash.hexdigest()])


    # evaluate gameplay achievements
    #   runs gameplay and get hist
    #   evaluate achievements againt a list (or all if none) and save them
    try:
        evaluate_gameplay_achievements(payload.cartridge_id.hex(),payload.log,payload.args,payload.in_card,payload.outcard_hash,g)
    except Exception as e:
        msg = f"Couldn't evaluate achievements: {e}"
        LOGGER.error(msg)
        add_output(msg,tags=['error'])
        return False

    return True


@mutation()
def achievements_replay(payload: ReplayAchievements) -> bool:
    
    metadata = get_metadata()
    gameplay_hash = sha256(payload.log)

    # check if cartridge exists
    cartridge = helpers.select(c for c in Cartridge if c.id == payload.cartridge_id.hex()).first()
    if cartridge is None:
        msg = f"Game not found"
        LOGGER.error(msg)
        add_output(msg,tags=['error'])
        return False

    # save gameplay if it doesn't exist
    gameplay = helpers.select(r for r in Gameplay if r.id == gameplay_hash.hexdigest()).first()
    if gameplay is None:
        gameplay = Gameplay(
            id                  = gameplay_hash.hexdigest(),
            cartridge_id        = payload.cartridge_id.hex(),
            user_address        = metadata.msg_sender,
            timestamp           = metadata.timestamp,
            args_hash           = sha256(str2bytes(payload.args)).hexdigest(),
            in_card_hash        = sha256(payload.in_card).hexdigest(),
            share_value         = 0
        )
        add_output(payload.log,tags=['replay',payload.cartridge_id.hex(),gameplay_hash.hexdigest()])
    else:
        if gameplay.args_hash != sha256(str2bytes(payload.args)).hexdigest() and \
            gameplay.in_card_hash != sha256(payload.in_card).hexdigest():
            msg = f"Args and incard don't match to original gameplay"
            LOGGER.error(msg)
            add_output(msg,tags=['error'])
            return False

    # evaluate gameplay achievements
    #   runs gameplay and get hist
    #   evaluate achievements againt a list (or all if none) and save them
    try:
        evaluate_gameplay_achievements(payload.cartridge_id.hex(),payload.log,payload.args,payload.in_card,payload.outcard_hash,gameplay,[a.hex() for a in payload.achievements])
    except Exception as e:
        msg = f"Couldn't evaluate achievements: {e}"
        LOGGER.error(msg)
        add_output(msg,tags=['error'])
        return False

    return True


@mutation()
def create_achievement(payload: CreateAchievementsPayload) -> bool:
    
    metadata = get_metadata()
    gameplay_hash = sha256(payload.log)

    # check if cartridge already exists
    cartridge = helpers.select(c for c in Cartridge if c.id == payload.cartridge_id.hex()).first()
    if cartridge is None:
        msg = f"Game not found"
        LOGGER.error(msg)
        add_output(msg,tags=['error'])
        return False

    # check if achievement already exists
    achievement_id = get_achievement_id(payload.expression,payload.cartridge_id.hex())
    if helpers.count(r.id for r in Achievement if r.id == achievement_id) > 0:
        msg = f"Achievement expression already exists"
        LOGGER.error(msg)
        add_output(msg,tags=['error'])
        return False

    if helpers.count(r.id for r in Achievement if r.name == payload.name and r.cartridge_id == payload.cartridge_id.hex()) > 0:
        msg = f"Achievement {payload.name} already exists for this cartridge"
        LOGGER.error(msg)
        add_output(msg,tags=['error'])
        return False

    new_achievement = Achievement(
        id              = achievement_id,
        name            = payload.name,
        description     = payload.description,
        cartridge_id    = cartridge.id,
        created_by      = metadata.msg_sender,
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
            user_address        = metadata.msg_sender,
            timestamp           = metadata.timestamp,
            args_hash           = sha256(str2bytes(payload.args)).hexdigest(),
            in_card_hash        = sha256(payload.in_card).hexdigest(),
            share_value         = 0
        )
        add_output(payload.log,tags=['replay',payload.cartridge_id.hex(),gameplay_hash.hexdigest()])
    else:
        if gameplay.args_hash != sha256(str2bytes(payload.args)).hexdigest() and \
            gameplay.in_card_hash != sha256(payload.in_card).hexdigest():
            msg = f"Args and incard don't match to original gameplay"
            LOGGER.error(msg)
            add_output(msg,tags=['error'])
            return False

    try:
        n_achievements = evaluate_gameplay_achievements(payload.cartridge_id.hex(),payload.log,payload.args,payload.in_card,payload.outcard_hash,gameplay,[new_achievement.id])
    except Exception as e:
        msg = f"Couldn't evaluate achievements: {e}"
        LOGGER.error(msg)
        add_output(msg,tags=['error'])
        return False

    if n_achievements == 0:
        msg = f"Can't create achievement: Gameplay doesn't prove achievement is possible"
        LOGGER.error(msg)
        add_output(msg,tags=['error'])
        return False

    return True


# TODO: achievement challenge

# TODO: achievement cleanup


###
# Queries

# gameplay list

# achievement list

# achievement info

###
# Helpers

def get_achievement_id(expression: str, cartridge_id: str) -> str:
    return sha256(str2bytes(expression)+hex2bytes(cartridge_id)).hexdigest()

def evaluate_gameplay_achievements(cartridge_id, log, args, in_card, replay_outcard_hash, gameplay, achievement_list = None) -> int:
    LOGGER.info("Replaying to get outcard history...")

    # process replay
    try:
        outhist_raw, outhash = replay_hist(cartridge_id,log,args,in_card)
    except Exception as e:
        raise Exception(f"Couldn't replay log: {e}")

    outcard_valid = outhash == replay_outcard_hash

    # process outhist
    
    try:
        outhist = json.loads(outhist_raw)
    except Exception as e:
        raise Exception(f"Couldn't convert outhist to json: {e}")

    LOGGER.info("==== OUTCARD ====")
    LOGGER.info(f"Expected Outcard Hash: {replay_outcard_hash.hex()}")
    # LOGGER.info(f"Computed Outcard Hash: {outcard_hash.hex()}")
    LOGGER.info(f"Computed Outcard Hash: {outhash.hex()}")
    LOGGER.info(f"Valid Outcard Hash : {outcard_valid}")

    LOGGER.info(f"==== OUTHIST ====")
    LOGGER.info(f"Outhist size: {len(outhist)}")
    LOGGER.info(f"FInal outcard: {outhist[-1]}")

    if not outcard_valid:
        raise Exception(f"Out card hash doesn't match")

    # get list of achievements to process
    achievement_query = helpers.left_join(a for a in Achievement for u in a.users if u is None)

    if achievement_list is not None and len(achievement_list) > 0:
        achievement_query = achievement_query.filter(lambda r: r.id in tuple(achievement_list))

    achievements_to_check = achievement_query.fetch()
    if len(achievements_to_check) == 0:
        LOGGER.info("No achievements to check")
        return

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