from pydantic import BaseModel
import logging
from typing import Optional, List, Union
from hashlib import sha256
from py_expression_eval import Parser

from cartesi.abi import String, Bytes, Bytes32, UInt, Address

from cartesapp.storage import helpers
from cartesapp.context import get_metadata
from cartesapp.input import mutation, query
from cartesapp.output import add_output, event, emit_event, output
from cartesapp.utils import str2bytes, hex2bytes, uint2hex256, hex2562uint
from cartesapp.wallet import dapp_wallet

from app.common import get_cid
from app.riv import replay_log

from .common import ACCEPTED_ERC20_ADDRESS, Gameplay, UserAchievement, Moment, return_error, CartridgeMomentPrice
from .riv import replay_screenshot

LOGGER = logging.getLogger(__name__)


###
# Model

# Inputs

class CollectkMomentPayload(BaseModel):
    gameplay_id:        Bytes32
    outcard_hash:       Bytes32
    args:               String
    in_card:            Bytes
    log:                Bytes
    frame:              UInt
    user_achievement:   UInt

class ReleaseMomentPayload(BaseModel):
    id:         UInt

class MomentsPayload(BaseModel):
    cartridge_id:   Optional[str]
    gameplay_id:    Optional[str]
    user_address:   Optional[str]
    order_by:       Optional[str]
    order_dir:      Optional[str]
    page:           Optional[int]
    page_size:      Optional[int]

class CollectValuePayload(BaseModel):
    id: str

# Outputs

@event()
class CollectedMoment(BaseModel):
    cartridge_id:   Bytes32
    user_address:   Address
    gameplay_id:    Bytes32
    timestamp:      UInt
    frame:          UInt
    index:          UInt
    cid:            String = ''

@output()
class MomentInfo(BaseModel):
    id: String
    user_address: String
    timestamp: UInt
    frame: UInt
    index: UInt
    shares: UInt
    value: Optional[int]

@output()
class MomentsOutput(BaseModel):
    data:   List[MomentInfo]
    total:  UInt
    page:   UInt


###
# Mutations

@mutation()
def collect_moment(payload: CollectkMomentPayload) -> bool:
    # mark moment, it will be added to gallery
    
    metadata = get_metadata()
    gameplay_hash = sha256(payload.log)

    user_address = metadata.msg_sender.lower()

    # check if gameplay exists
    gameplay = helpers.select(r for r in Gameplay if r.id == gameplay_hash.hexdigest()).first()
    if gameplay is None: return return_error(f"Gameplay does not exist",LOGGER)
    
    # check args
    if gameplay.args_hash != sha256(str2bytes(payload.args)).hexdigest() and \
        gameplay.in_card_hash != sha256(payload.in_card).hexdigest():
        return return_error(f"Args and incard don't match to original gameplay",LOGGER)

    # expression evaluation
    total_moments = helpers.count(1 for r in Moment if r.gameplay_id == gameplay.id)
    # moment_price = helpers.select(r for r in CartridgeMomentPrice if r.cartridge_id == gameplay.cartridge_id).first()
    # if moment_price is None: return return_error(f"Moment price does not exist",LOGGER)
    # parser = Parser()
    # evaluation = moment_price.evaluation.copy()
    # evaluation['moments'] = total_moments
    
    # evaluated_expression = parser.parse(moment_price.model.expression).evaluate(evaluation)

    # collect_value = evaluated_expression + _get_fee_value(moment_price)

    # curr_user_balance = _get_erc20_balance(user_address,ACCEPTED_ERC20_ADDRESS)
    
    # if curr_user_balance < collect_value:
    #     return return_error(f"Not enough funds",LOGGER)

    user_achievement = None
    # get frame of moment
    frame = payload.frame
    if frame == 0 and payload.user_achievement > 0:
        user_achievement = helpers.select(r for r in UserAchievement if r.id == payload.user_achievement).first()
        if user_achievement is None:
            return return_error(f"Selected user Achievement id {payload.user_achievement} does not exist",LOGGER)
        frame = user_achievement.frame

    LOGGER.info("Getting Moment Screenshot...")
    try:
        if frame == 0:
            outcard_raw, outhash, screenshot = replay_log(gameplay.cartridge_id,payload.log,payload.args,payload.in_card)
        else:
            screenshot = replay_screenshot(gameplay.cartridge_id,payload.log,payload.args,payload.in_card,frame)
    except Exception as e:
        return return_error(f"Couldn't get screenshot for moment: {e}",LOGGER)

    cid = get_cid(screenshot) 

    index = total_moments + 1

    # calculate number of shares, new value, reward
    # new_value,collector_shares = _get_updated_share(moment_price, gameplay.share_value, gameplay.total_shares, evaluated_expression)
    collector_shares = 0

    # TODO: distribute fees

    # create moment
    m = Moment(
        user_address = user_address,
        timestamp = metadata.timestamp,
        frame = frame,
        index = index,
        shares = collector_shares,
        gameplay = gameplay,
        user_achievement = user_achievement
    )

    # gameplay.share_value = new_value
    # gameplay.total_shares += collector_shares

    cm = CollectedMoment(
        cartridge_id    = hex2bytes(gameplay.cartridge_id),
        user_address    = user_address,
        timestamp       = metadata.timestamp,
        gameplay_id     = hex2bytes(gameplay.id),
        frame           = frame,
        index           = index,
        cid             = cid
    )

    # emit event
    emit_event(cm,tags=['moment_collected',gameplay.cartridge_id,user_address,gameplay.id,m.id])

    # emit event
    add_output(screenshot,tags=['moment_screenshot',gameplay.cartridge_id,user_address,gameplay.id])

    return True


@mutation(module_name='app') # trap app replay 
def release_moment(payload: ReleaseMomentPayload) -> bool:
    
    metadata = get_metadata()
    user_address = metadata.msg_sender.lower()

    # check if gameplay exists
    moment = helpers.select(r for r in Moment if r.id == payload.id).first()
    if moment is None: return return_error(f"Moment does not exist",LOGGER)
    
    # TODO: calculate number of shares, new price, reward
    # TODO: distribute fees

    moment.shares = 0

    return True

###
# Queries

# TODO: include current moment sell value
@query()
def moments(payload: MomentsPayload) -> bool:
    moments_query = Moment.select()

    if payload.cartridge_id is not None:
        moments_query = moments_query.filter(lambda r: payload.cartridge_id == r.cartridge_id)

    if payload.user_address is not None:
        moments_query = moments_query.filter(lambda r: payload.user_address.lower() == r.user_address)

    total = moments_query.count()

    if payload.order_by is not None:
        dir_order = lambda d: d
        if payload.order_dir is not None and payload.order_dir == 'desc':
            dir_order = helpers.desc
        if payload.order_by == 'value':
            moments_query = moments_query.order_by(lambda r: dir_order(helpers.count(r.moments)))
        else:
            moments_query = moments_query.order_by(dir_order(getattr(Gameplay,payload.order_by)))

    page = 1
    if payload.page is not None:
        page = payload.page
        if payload.page_size is not None:
            moments = moments_query.page(payload.page,payload.page_size)
        else:
            moments = moments_query.page(payload.page)
    else:
        moments = moments_query.fetch()
    
    gameplay_expression_value = {}
    gameplay_share_value = {}
    dict_list_result = []
    for moment in moments:
        if gameplay_share_value.get(moment.gameplay.id) is None:
            gameplay_share_value[moment.gameplay.id] = moment.gameplay.share_value
        moment_dict = moment.to_dict()

        # TODO: add expression value in sell price

        moment_dict['value'] = gameplay_share_value[moment.gameplay.id] * moment.shares

        dict_list_result.append(moment_dict)

    LOGGER.info(f"Returning {len(dict_list_result)} of {total} Moments")
    
    out = MomentsOutput.parse_obj({'data':dict_list_result,'total':total,'page':page})
    add_output(out)

    return True


# TODO: get current moment price
@query()
def collect_value(payload: CollectValuePayload) -> bool:
    moment = helpers.select(r for r in Moment if r.id == payload.id).first()
    if moment is None: return return_error(f"Moment does not exist",LOGGER)

    # expression evaluation
    total_moments = helpers.count(1 for r in Moment if r.gameplay_id == moment.gameplay.id)
    if total_moments == 0:
        add_output(0)
        return True

    moment_price = helpers.select(r for r in CartridgeMomentPrice if r.cartridge_id == moment.gameplay.cartridge_id).first()
    if moment_price is None: return return_error(f"Moment price does not exist",LOGGER)

    parser = Parser()
    evaluation = moment_price.evaluation.copy()
    evaluation['moments'] = total_moments
    
    evaluated_expression = parser.parse(moment_price.model.expression).evaluate(evaluation)

    add_output(evaluated_expression)

    return True

# def _get_collect_value(moment_price: CartridgeMomentPrice, total_moments: int) -> int:
#     # TODO: allow proportional fee
#     parser = Parser()
#     evaluation = moment_price.evaluation.copy()
#     evaluation['moments'] = total_moments
    
#     evaluated_expression = parser.parse(moment_price.model.expression).evaluate(evaluation)

#     return evaluated_expression + moment_price.fee_value

# def _get_erc20_balance(wallet_addr: str, contract_addr: str) -> int:
#     entry = helpers.select(e for e in dapp_wallet.Erc20 if e.address == contract_addr.lower() and e.wallet.owner == wallet_addr.lower()).first()

#     if entry is None:
#         return 0

#     return hex2562uint(entry.amount)

# def _get_updated_share(moment_price: CartridgeMomentPrice, share_value: int, total_shares: float, total_moments: int) -> Union[int,float]:
#     # TODO: allow proportional fee

#     new_share_value = share_value
#     collector_shares = 0
#     # Checking if it's the first share
#     if total_shares == 0:
#         # It is
#         # Creating the first share and attributing it to the user
#         collector_shares = moment_price.collectors_share + moment_price.collectors_pool_share
#         # Share value is all the collectors cut plus the share purchase for the first one to join
#         new_share_value = (moment_price.fee_value * (moment_price.collectors_cut + moment_price.share_purchase))//10_000
    
#     else:
#         #it isn't
#         #Calculate share purchase cut
#         collector_shares = total_shares / moment_price.collectors_share + moment_price.collectors_pool_share
    
#     return new_share_value,collector_shares

# # class CartridgeMomentPrice(Entity):
# #     id                      = helpers.PrimaryKey(int, auto=True)
# #     cartridge_id            = helpers.Required(str, 64, index=True)
# #     evaluation              = helpers.Optional(helpers.Json) 
# #     fee_value               = helpers.Required(str, 66) # in hex 
# #     developer_cut           = helpers.Required(int) # sum up to MAX_FEE_SHARES - MIN_RIVES_TREASURY_SHARES
# #     player_cut              = helpers.Required(int) # sum up to MAX_FEE_SHARES - MIN_RIVES_TREASURY_SHARES
# #     collectors_cut          = helpers.Required(int) # sum up to MAX_FEE_SHARES - MIN_RIVES_TREASURY_SHARES
# #     share_purchase          = helpers.Required(int) # sum up to MAX_FEE_SHARES - MIN_RIVES_TREASURY_SHARES
# #     model                   = helpers.Required(MomentPriceModel, index=True)
# def _get_fee_value(moment_price: CartridgeMomentPrice, current_expression_value: int) -> int:
#     # TODO: allow proportional fee
#     return moment_price.fee_value