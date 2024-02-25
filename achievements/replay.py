import os
from pydantic import BaseModel
import logging
from typing import Optional
from hashlib import sha256
import json
import re

from cartesi.abi import String, Bytes, Bytes32, Int, UInt, Address

from cartesapp.storage import helpers
from cartesapp.context import get_metadata
from cartesapp.input import mutation
from cartesapp.output import add_output, event, emit_event, contract_call
from cartesapp.utils import bytes2str

from app.cartridge import Cartridge
from app.replay import Replay
from app.common import GameplayHash

from .riv import replay_hist

LOGGER = logging.getLogger(__name__)



###
# Model

# Inputs

# class Replay(BaseModel):
#     cartridge_id:   Bytes32


# Outputs

# @event()
# class ReplayScore(BaseModel):
#     cartridge_id:   Bytes32


###
# Mutations

@mutation(module_name='app') # trap app replay 
def replay(replay: Replay) -> bool:
    
    metadata = get_metadata()
    gameplay_hash = sha256(replay.log)
    
    if not GameplayHash.check(replay.cartridge_id.hex(),gameplay_hash.hexdigest()):
        msg = f"Gameplay already submitted"
        LOGGER.error(msg)
        add_output(msg,tags=['error'])
        return False

    cartridge = helpers.select(c for c in Cartridge if c.id == replay.cartridge_id.hex()).first()

    if cartridge is None:
        msg = f"Game not found"
        LOGGER.error(msg)
        add_output(msg,tags=['error'])
        return False

    LOGGER.info("Replaying to get outcard history...")

    # process replay
    try:
        outhist_raw, outhash = replay_hist(replay.cartridge_id.hex(),replay.log,replay.args,replay.in_card)
    except Exception as e:
        msg = f"Couldn't replay log: {e}"
        LOGGER.error(msg)
        add_output(msg,tags=['error'])
        return False

    outcard_valid = outhash == replay.outcard_hash

    # process outhist
    
    LOGGER.info(f"==== BEGIN OUTHIST ====")
    
    LOGGER.info(outhist_raw)
    
    LOGGER.info("==== END OUTCARD ====")
    LOGGER.info(f"Expected Outcard Hash: {replay.outcard_hash.hex()}")
    # LOGGER.info(f"Computed Outcard Hash: {outcard_hash.hex()}")
    LOGGER.info(f"Computed Outcard Hash: {outhash.hex()}")
    LOGGER.info(f"Valid Outcard Hash : {outcard_valid}")

    if not outcard_valid:
        msg = f"Out card hash doesn't match"
        LOGGER.error(msg)
        add_output(msg,tags=['error'])
        return False

    add_output(replay.log,tags=['replay',replay.cartridge_id.hex()])
    # add_output(final_screenshot,tags=['screenshot',replay.cartridge_id.hex()])
    # emit_event(replay_score,tags=['score','general',replay.cartridge_id.hex()])

    GameplayHash.add(replay.cartridge_id.hex(),gameplay_hash.hexdigest())

    return True
