import os
from typing import Optional, List, Annotated

from cartesi.abi import ABIType

from cartesapp.storage import Entity, helpers, seed
from cartesapp.setup import setup
from cartesapp.utils import uint2hex256
from cartesapp.output import add_output


UInt256List = Annotated[List[int], ABIType('uint256[]')]
Int256List = Annotated[List[int], ABIType('int256[]')]
Bytes32List = Annotated[List[bytes], ABIType('bytes32[]')]
StringList = Annotated[List[str], ABIType('string[]')]

Bytes32Optional = Annotated[Optional[bytes], ABIType('bytes32')]


###
# Consts

# TODO: Allow any value for wallet, address but avoid notices
class AppSetings:
    TREASURY_ADDRESS = "0x" + "0"*40
    PROTOCOL_ADDRESS = "0x" + "f"*40
    ACCEPTED_ERC20_ADDRESS = None
    MIN_FEE_VALUE = 10_000 # using token with 6 decimas 
    # MIN_FEE_VALUE = 1_000_000_000_000_000_000
    INITIAL_SHARE_OFFER = 50 # using token with 6 decimas 
    # INITIAL_SHARE_OFFER = 1099511627776
    MIN_RIVES_TREASURY_SHARES = 10 # sum up to MAX_FEE_SHARES
    MAX_FEE_SHARES = 10000 # percentage converted to 10k to avoid floats


###
# Setup

@setup()
def setup_accpeted_erc20():
    AppSetings.ACCEPTED_ERC20_ADDRESS = os.getenv('ACCEPTED_ERC20_ADDRESS')
    if AppSetings.ACCEPTED_ERC20_ADDRESS is None: raise Exception("Please define an accepted ERC20")


###
# Model

class Gameplay(Entity):
    id                  = helpers.PrimaryKey(str, 64)
    cartridge_id        = helpers.Required(str, 64, index=True)
    user_address        = helpers.Required(str, 42, index=True)
    timestamp           = helpers.Required(int)
    args_hash           = helpers.Required(str, 64)
    in_card_hash        = helpers.Required(str, 64)
    share_value         = helpers.Required(str, 66) # in hex 
    total_shares        = helpers.Required(int, size=64)
    user_achievements   = helpers.Set("UserAchievement", lazy=True)
    moments             = helpers.Set("Moment", lazy=True)

class Achievement(Entity):
    id              = helpers.PrimaryKey(str, 64)
    name            = helpers.Required(str, index=True)
    description     = helpers.Required(str)
    cartridge_id    = helpers.Required(str, 64, index=True)
    created_by      = helpers.Required(str, 42)
    created_at      = helpers.Required(int)
    expression      = helpers.Required(str)
    icon            = helpers.Optional(bytes, lazy=True)
    users           = helpers.Set("UserAchievement", lazy=True)

class UserAchievement(Entity):
    user_address    = helpers.Required(str, 42, index=True)
    achievement     = helpers.Required(Achievement, index=True)
    gameplay        = helpers.Required(Gameplay, index=True)
    timestamp       = helpers.Required(int)
    frame           = helpers.Required(int)
    index           = helpers.Required(int)
    moments         = helpers.Set("Moment", lazy=True)
    helpers.composite_key(user_address,achievement)
 
class Moment(Entity):
    id              = helpers.PrimaryKey(int, auto=True)
    user_address    = helpers.Required(str, 42, index=True)
    timestamp       = helpers.Required(int)
    frame           = helpers.Required(int)
    index           = helpers.Required(int)
    shares          = helpers.Required(int, size=64)
    gameplay        = helpers.Required(Gameplay, index=True)
    user_achievement= helpers.Optional(UserAchievement, lazy=True)
    # helpers.composite_key(user_address,gameplay)

class MomentPriceModel(Entity):
    id              = helpers.PrimaryKey(int, auto=True)
    expression      = helpers.Required(str) # ultimately it will be expression + fee
    cartridge_prices= helpers.Set("CartridgeMomentPrice", lazy=True)

class CartridgeMomentPrice(Entity):
    id                      = helpers.PrimaryKey(int, auto=True)
    cartridge_id            = helpers.Required(str, 64, index=True)
    evaluation              = helpers.Optional(helpers.Json) 
    fee_value               = helpers.Required(str, 66) # in hex 
    developer_cut           = helpers.Required(int) # sum up to MAX_FEE_SHARES - MIN_RIVES_TREASURY_SHARES
    player_cut              = helpers.Required(int) # sum up to MAX_FEE_SHARES - MIN_RIVES_TREASURY_SHARES
    collectors_cut          = helpers.Required(int) # sum up to MAX_FEE_SHARES - MIN_RIVES_TREASURY_SHARES
    share_purchase          = helpers.Required(int) # sum up to MAX_FEE_SHARES - MIN_RIVES_TREASURY_SHARES
    model                   = helpers.Required(MomentPriceModel, index=True)



def return_error(msg,logger):
    logger.error(msg)
    add_output(msg,tags=['error'])
    return False

###
# Seed

@seed()
def initialize_moment():
    m = MomentPriceModel(
        expression = "a * moments + b" # simple linear
    )
    
    # create model for games in misc
    
    from os import listdir
    import json
    from app.riv import riv_get_cartridges_path, riv_get_cartridge_info
    from .achievement import get_achievement_id

    for cartridge_id in listdir(riv_get_cartridges_path()):
        # TODO: Create validation for fee values
        p = CartridgeMomentPrice(
            cartridge_id = cartridge_id,
            model = m,
            evaluation = {"a":AppSetings.MIN_FEE_VALUE*2, "b":AppSetings.MIN_FEE_VALUE*10},
            fee_value = uint2hex256(AppSetings.MIN_FEE_VALUE),
            developer_cut = int(AppSetings.MAX_FEE_SHARES*0.5),
            player_cut = int(AppSetings.MAX_FEE_SHARES*0.3),
            collectors_cut = int(AppSetings.MAX_FEE_SHARES*0.1),
            share_purchase = int(AppSetings.MAX_FEE_SHARES*0.05)
        )

        cartridge_info = riv_get_cartridge_info(cartridge_id)
        
        # validate info
        cartridge_info_json = json.loads(cartridge_info)

        if cartridge_info_json['name'].lower() == 'antcopter':
            # with open('misc/achievement-icon.jpeg','rb') as f: icon = f.read()
            expression = "berries == 0 and deaths == 20 and frames > 0 and finished"
            a = Achievement(
                id              = get_achievement_id(expression, cartridge_id),
                name            = "Starved to Death",
                description     = "Lose all lives Without getting any berries",
                cartridge_id    = cartridge_id,
                created_by      = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                created_at      = 0,
                expression      = expression,
                icon            = None
            )
            
            expression = "level == 3"
            a = Achievement(
                id              = get_achievement_id(expression, cartridge_id),
                name            = "Amphicis",
                description     = "Complete Level 3",
                cartridge_id    = cartridge_id,
                created_by      = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                created_at      = 0,
                expression      = expression,
                icon            = None
            )
            
            expression = "level == 5"
            a = Achievement(
                id              = get_achievement_id(expression, cartridge_id),
                name            = "Voltutheas",
                description     = "Complete Level 5",
                cartridge_id    = cartridge_id,
                created_by      = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                created_at      = 0,
                expression      = expression,
                icon            = None
            )
            
            expression = "level == 10"
            a = Achievement(
                id              = get_achievement_id(expression, cartridge_id),
                name            = "Aqutesh",
                description     = "Complete Level 10",
                cartridge_id    = cartridge_id,
                created_by      = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                created_at      = 0,
                expression      = expression,
                icon            = None
            )

            expression = "level == 20 and deaths < 20 and finished"
            a = Achievement(
                id              = get_achievement_id(expression, cartridge_id),
                name            = "Expana",
                description     = "Complete Level 10",
                cartridge_id    = cartridge_id,
                created_by      = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                created_at      = 0,
                expression      = expression,
                icon            = None
            )

            expression = "not (berries - 40)"
            a = Achievement(
                id              = get_achievement_id(expression, cartridge_id),
                name            = "Gatherer",
                description     = "Obtain 40 Fruits",
                cartridge_id    = cartridge_id,
                created_by      = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                created_at      = 0,
                expression      = expression,
                icon            = None
            )
                



