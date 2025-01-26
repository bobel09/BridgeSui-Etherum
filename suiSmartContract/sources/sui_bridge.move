module 0x0::IBT;

use sui::coin::{Coin, Self, TreasuryCap};

public struct IBT has drop {}

fun init (witness: IBT, ctx: &mut TxContext) {
		let (treasury, metadata) = coin::create_currency(
				witness,
				6,
				b"IBT",
				b"IBT",
				b"IBT",
				option::none(),
				ctx,
		);
		transfer::public_freeze_object(metadata);
		transfer::public_transfer(treasury, ctx.sender());
}

public fun mint(
		treasury_cap: &mut TreasuryCap<IBT>,
		amount: u64,
		recipient: address,
		ctx: &mut TxContext,
){
		let coin = coin::mint(treasury_cap, amount, ctx);
		transfer::public_transfer(coin, recipient);
}
public fun burn(
        treasury_cap: &mut TreasuryCap<IBT>,
        coin: Coin<IBT>,
) {
        let _amount = coin::burn(treasury_cap, coin);
}