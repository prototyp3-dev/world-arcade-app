from pydantic import BaseModel
import logging
from typing import Optional, List
import base64

from cartesi.abi import String, UInt

from cartesapp.storage import helpers
from cartesapp.input import  query
from cartesapp.output import add_output, output
from cartesapp.utils import hex2562int

from .achievement import UserAchievementInfo
from .moment import MomentInfo
from .common import Gameplay

LOGGER = logging.getLogger(__name__)



###
# Model

# Inputs

class GameplaysPayload(BaseModel):
    cartridge_id:   Optional[str]
    user_address:   Optional[str]
    order_by:       Optional[str]
    order_dir:      Optional[str]
    page:           Optional[int]
    page_size:      Optional[int]

class GameplayPayload(BaseModel):
    id: str

# Outputs

@output()
class GameplayInfo(BaseModel):
    id: String
    cartridge_id: String
    user_address: String
    timestamp: UInt
    share_value: UInt
    total_shares: Optional[int]
    achievements: Optional[List[UserAchievementInfo]]
    moments: Optional[List[MomentInfo]]

@output()
class GameplaysOutput(BaseModel):
    data:   List[GameplayInfo]
    total:  UInt
    page:   UInt


###
# Queries

# gameplay list

@query()
def gameplays(payload: GameplaysPayload) -> bool:
    gameplays_query = Gameplay.select()

    if payload.cartridge_id is not None:
        gameplays_query = gameplays_query.filter(lambda r: payload.cartridge_id == r.cartridge_id)

    if payload.user_address is not None:
        gameplays_query = gameplays_query.filter(lambda r: payload.user_address.lower() == r.user_address)

    total = gameplays_query.count()

    if payload.order_by is not None:
        dir_order = lambda d: d
        if payload.order_dir is not None and payload.order_dir == 'desc':
            dir_order = helpers.desc
        if payload.order_by == 'popular':
            gameplays_query = gameplays_query.order_by(lambda r: dir_order(helpers.count(r.moments)))
        else:
            gameplays_query = gameplays_query.order_by(dir_order(getattr(Gameplay,payload.order_by)))

    page = 1
    if payload.page is not None:
        page = payload.page
        if payload.page_size is not None:
            gameplays = gameplays_query.page(payload.page,payload.page_size)
        else:
            gameplays = gameplays_query.page(payload.page)
    else:
        gameplays = gameplays_query.fetch()
    
    dict_list_result = []
    for gameplay in gameplays:
        gameplay_dict = gameplay.to_dict()
        gameplay_dict['share_value'] = hex2562int(gameplay.share_value)
        dict_list_result.append(gameplay_dict)

    LOGGER.info(f"Returning {len(dict_list_result)} of {total} Gameplays")
    
    out = GameplaysOutput.parse_obj({'data':dict_list_result,'total':total,'page':page})
    add_output(out)

    return True

# gameplay

@query()
def gameplay_info(payload: GameplayPayload) -> bool:
    gameplay = helpers.select(r for r in Gameplay if r.id == payload.id).first()

    if gameplay is not None:
        gameplay_dict = gameplay.to_dict()

        user_achievements = []
        for user_achievement in gameplay.user_achievements:
            user_achievement_dict = user_achievement.to_dict()
            user_achievement_dict['achievement_id'] = user_achievement.achievement.id
            user_achievement_dict['achievement_name'] = user_achievement.achievement.name
            user_achievement_dict['achievement_description'] = user_achievement.achievement.description
            user_achievement_dict['achievement_icon'] = base64.b64encode(user_achievement.achievement.icon)
            user_achievements.append(user_achievement_dict)

        gameplay_dict['achievements'] = user_achievements
        gameplay_dict['share_value'] = hex2562int(gameplay.share_value)

        moments = []
        for moment in gameplay.moments:
            moment_dict = moment.to_dict()
            moments.append(moment_dict)
        out = GameplayInfo.parse_obj(gameplay_dict)
        add_output(out)
    else:
        add_output("null")

    LOGGER.info(f"Returning gameplay {payload.id} info")

    return True
