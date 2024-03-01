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
from cartesapp.utils import str2bytes, hex2bytes, hex2562uint, uint2hex256
from cartesapp.wallet import dapp_wallet

from app.common import get_cid
from app.riv import replay_log
from app.cartridge import Cartridge

from .common import AppSetings, Gameplay, UserAchievement, Moment, return_error, CartridgeMomentPrice
from .riv import replay_screenshot

LOGGER = logging.getLogger(__name__)


###
# Model

# Inputs

class CollectMomentPayload(BaseModel):
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
    id: int

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
    cartridge_id: Optional[str]
    gameplay_id: Optional[str]
    value: Optional[int]

@output()
class MomentsOutput(BaseModel):
    data:   List[MomentInfo]
    total:  UInt
    page:   UInt

@output()
class MomentValues(BaseModel):
    total_moments:          int
    total_shares:           int
    buy_base_value:         int
    sell_base_value:        int
    buy_fee:                int
    sell_fee:               int
    buy_fee:                int
    buy_fee:                int
    buy_fee:                int
    shares_to_buy:          int
    share_value_after_buy:  int
    share_value_after_sell: int
    buy_in_fee:             int
    collectors_pool_fee:    int
    developer_fee:          int
    player_fee:             int


###
# Mutations

@mutation()
def collect_moment(payload: CollectMomentPayload) -> bool:
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

    cartridge = helpers.select(r for r in Cartridge if r.id == gameplay.cartridge_id).first()
    if cartridge is None: return return_error(f"Cartridge does not exist",LOGGER)
    
    # calculate number of shares, new value, reward
    moment_values = _get_current_values(gameplay)
    total_moments = moment_values.total_moments
    
    collect_value = moment_values.buy_base_value + moment_values.buy_fee

    curr_user_balance = _get_erc20_balance(user_address,AppSetings.ACCEPTED_ERC20_ADDRESS)
    
    if curr_user_balance < collect_value:
        return return_error(f"Not enough funds",LOGGER)

    # distribute fees
    treasury_fee = (moment_values.buy_fee 
                    - moment_values.developer_fee - moment_values.player_fee 
                    - moment_values.collectors_pool_fee - moment_values.buy_in_fee)
    dapp_wallet.transfer_erc20(AppSetings.ACCEPTED_ERC20_ADDRESS,user_address,AppSetings.TREASURY_ADDRESS,treasury_fee)
    if user_address != cartridge.user_address:
        dapp_wallet.transfer_erc20(AppSetings.ACCEPTED_ERC20_ADDRESS,user_address,cartridge.user_address,moment_values.developer_fee)
    if user_address != gameplay.user_address:
        dapp_wallet.transfer_erc20(AppSetings.ACCEPTED_ERC20_ADDRESS,user_address,gameplay.user_address,moment_values.player_fee)
    dapp_wallet.transfer_erc20(AppSetings.ACCEPTED_ERC20_ADDRESS,user_address,AppSetings.PROTOCOL_ADDRESS,
                               moment_values.buy_base_value + moment_values.collectors_pool_fee + moment_values.buy_in_fee)

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

    collector_shares = moment_values.shares_to_buy

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

    gameplay.share_value = uint2hex256(moment_values.share_value_after_buy)
    gameplay.total_shares += collector_shares

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
    m.flush()
    emit_event(cm,tags=['moment_collected',gameplay.cartridge_id,user_address,gameplay.id,str(m.id)])

    # emit event
    add_output(screenshot,tags=['moment_screenshot',gameplay.cartridge_id,user_address,gameplay.id,str(m.id)])

    return True


@mutation()
def release_moment(payload: ReleaseMomentPayload) -> bool:
    
    metadata = get_metadata()
    user_address = metadata.msg_sender.lower()

    # check if gameplay exists
    moment = helpers.select(r for r in Moment if r.id == payload.id and r.user_address == user_address).first()
    if moment is None: return return_error(f"Moment does not exist",LOGGER)
    
    gameplay = moment.gameplay

    cartridge = helpers.select(r for r in Cartridge if r.id == gameplay.cartridge_id).first()
    if cartridge is None: return return_error(f"Cartridge does not exist",LOGGER)

    # calculate number of shares, new value, reward
    moment_values = _get_current_values(gameplay,moment)
    
    if moment_values.sell_base_value < moment_values.sell_fee:
        return return_error(f"Not enough funds",LOGGER)

    # distribute fees
    treasury_fee = (moment_values.sell_fee
                    - moment_values.developer_fee - moment_values.player_fee 
                    - moment_values.collectors_pool_fee)
    dapp_wallet.transfer_erc20(AppSetings.ACCEPTED_ERC20_ADDRESS,AppSetings.PROTOCOL_ADDRESS,AppSetings.TREASURY_ADDRESS,treasury_fee)
    dapp_wallet.transfer_erc20(AppSetings.ACCEPTED_ERC20_ADDRESS,AppSetings.PROTOCOL_ADDRESS,cartridge.user_address,moment_values.developer_fee)
    dapp_wallet.transfer_erc20(AppSetings.ACCEPTED_ERC20_ADDRESS,AppSetings.PROTOCOL_ADDRESS,gameplay.user_address,moment_values.player_fee )
    dapp_wallet.transfer_erc20(AppSetings.ACCEPTED_ERC20_ADDRESS,AppSetings.PROTOCOL_ADDRESS,user_address,
                               moment_values.sell_base_value - moment_values.sell_fee)

    gameplay.set(**{
        "share_value": uint2hex256(moment_values.share_value_after_buy),
        "total_shares": gameplay.total_shares - moment.shares
    })

    moment.set(**{"shares": 0})

    return True


###
# Queries

# TODO: include current moment sell value
@query()
def moments(payload: MomentsPayload) -> bool:
    moments_query = Moment.select()

    if payload.gameplay_id is not None:
        moments_query = moments_query.filter(lambda r: payload.gameplay_id == r.gameplay)

    elif payload.cartridge_id is not None:
        gameplays_query = Gameplay.select(lambda r: payload.cartridge_id == r.cartridge_id)
        moments_query = moments_query.filter(lambda r: r.gameplay in gameplays_query)

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
    
    gameplay_moment_value = {}
    dict_list_result = []
    for moment in moments:
        moment_dict = moment.to_dict()
        moment_dict["cartridge_id"] = moment.gameplay.cartridge_id
        moment_dict["gameplay_id"] = moment.gameplay.id

        # add expression value in sell price
        if gameplay_moment_value.get(moment.gameplay.id) is None:
            moment_values = _get_current_values(moment.gameplay)
            gameplay_moment_value[moment.gameplay.id] = moment_values

        moment_values = gameplay_moment_value[moment.gameplay.id]
        moment_dict['value'] = (moment_values.sell_base_value + 
                                hex2562uint(moment.gameplay.share_value) * moment.shares - 
                                moment_values.sell_fee)

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

    add_output(_get_current_values(moment.gameplay, moment))

    return True


###
# Helpers

def _get_current_values(gameplay: Gameplay, moment: Moment | None = None) -> MomentValues:
    if gameplay is None: raise Exception("No gameplay provided")

    total_moments, total_shares = helpers.select((helpers.count(1),helpers.sum(r.shares)) for r in Moment if r.gameplay == gameplay).first()
    moment_price = helpers.select(r for r in CartridgeMomentPrice if r.cartridge_id == gameplay.cartridge_id).first()

    parser = Parser()
    buy_evaluation = moment_price.evaluation.copy()
    buy_evaluation['moments'] = total_moments
    
    sell_evaluation = moment_price.evaluation.copy()
    sell_evaluation['moments'] = total_moments - 1
    
    buy_base_value = parser.parse(moment_price.model.expression).evaluate(buy_evaluation)
    sell_base_value = 0 if total_moments == 0 else parser.parse(moment_price.model.expression).evaluate(sell_evaluation)

    # TODO: allow proportional fee
    buy_fee = hex2562uint(moment_price.fee_value)
    sell_fee = hex2562uint(moment_price.fee_value) - moment_price.share_purchase

    developer_fee = ((buy_fee * moment_price.developer_cut)//10_000)
    player_fee = ((buy_fee * moment_price.player_cut)//10_000)
    buy_in_fee = ((buy_fee * moment_price.share_purchase)//10_000)
    collectors_pool_fee = ((buy_fee * moment_price.collectors_cut)//10_000)

    new_share_value = hex2562uint(gameplay.share_value)
    collector_shares = 0
    share_value_after_sell = 0
    # Checking if it's the first share
    if total_shares == 0:
        # It is
        # Creating the first share and attributing it to the user
        collector_shares = AppSetings.INITIAL_SHARE_OFFER
        # Share value is all the collectors cut plus the share purchase for the first one to join
        new_share_value = ((buy_fee * (moment_price.collectors_cut + moment_price.share_purchase))//10_000)//AppSetings.INITIAL_SHARE_OFFER
    
    else:
        # it isn't
        # Calculate share purchase cut
        cur_share_price = hex2562uint(gameplay.share_value)
        collector_shares = buy_in_fee // cur_share_price
        new_share_value = ((total_shares + collector_shares)*cur_share_price + collectors_pool_fee) // (total_shares + collector_shares)

        payed_buy_in_price = collector_shares*cur_share_price
        if payed_buy_in_price != buy_in_fee:
            LOGGER.warning(f"Buy in price payed more {buy_in_fee - payed_buy_in_price} tokens due to int approximations (see to the protocol)")
    
        if moment is not None:
            share_value_after_sell = ((total_shares - moment.shares)*cur_share_price + collectors_pool_fee) // total_shares

    current_values = MomentValues(
        total_moments = total_moments,
        total_shares = total_shares,
        buy_base_value = buy_base_value,
        sell_base_value = sell_base_value,
        buy_fee = buy_fee,
        buy_in_fee = buy_in_fee,
        collectors_pool_fee = collectors_pool_fee,
        developer_fee = developer_fee,
        player_fee = player_fee,
        sell_fee = sell_fee,
        shares_to_buy = collector_shares,
        share_value_after_buy = new_share_value,
        share_value_after_sell = share_value_after_sell
    )

    return current_values

def _get_erc20_balance(wallet_addr: str, contract_addr: str) -> int:
    entry = helpers.select(e for e in dapp_wallet.Erc20 if e.address == contract_addr.lower() and e.wallet.owner == wallet_addr.lower()).first()

    if entry is None:
        return 0

    return hex2562uint(entry.amount)
