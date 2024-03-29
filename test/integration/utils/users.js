const ethers = require('ethers');
const { getUsers } = require('../../../index');
const { loadLocalWallets } = require('../../test-utils/wallets');

async function loadUsers({ ctx }) {
	ctx.users = {};
	let wallets = [];

	// Retrieve and create wallets
	wallets = wallets.concat(loadLocalWallets({ provider: ctx.provider }));

	// Build ctx.users
	ctx.users.owner = wallets[0];
	ctx.users.deployer = ctx.users.owner;
	ctx.users.someUser = wallets[1];
	ctx.users.otherUser = wallets[2];
	ctx.users.liquidatedUser = wallets[3];
	ctx.users.liquidatorUser = wallets[4];
	ctx.users.flaggerUser = wallets[5];
	for (let i = 6; i < wallets.length; i++) {
		ctx.users[`user${i}`] = wallets[i];
	}

	if (ctx.fork) {
		ctx.users = { ...ctx.users, ..._getWallets({ ctx, provider: ctx.provider }) };
	} else if (ctx.useOvm) {
		// Here we set a default private key for local-ovm deployment, as the
		// OVM geth node has no notion of local/unlocked accounts.
		// Deploying without a private key will give the error "OVM: Unsupported RPC method",
		// as the OVM node does not support eth_sendTransaction, which inherently relies on
		// the unlocked accounts on the node.
		// Account #0: 0x9790C67E6062ce2965517E636377B954FA2d1afA
		const privateKey = '09be0196c88421686c7374b941e4d22bf1a536c1e195b52e3f4f08997049ed1c';

		ctx.users.owner = new ethers.Wallet(privateKey, ctx.provider);
		ctx.users.owner.address = '0x9790C67E6062ce2965517E636377B954FA2d1afA';
		ctx.users.deployer = ctx.users.owner;
	}

	// ensure all the users have eth
	try {
		await Promise.all(
			Object.values(ctx.users).map(async account => {
				// owner might not have eth when we impersonate them
				await ctx.provider.send('hardhat_setBalance', [
					account.address,
					'0x10000000000000000000000',
				]);
			})
		);
	} catch (err) {
		// if it gets here nothing needs to be done
	}
}

function _getWallets({ ctx, provider }) {
	const usersArray = getUsers(ctx);

	const usersObj = {};
	for (const user of usersArray) {
		usersObj[user.name] = provider.getSigner(user.address);
		usersObj[user.name].address = user.address;
	}

	return usersObj;
}

module.exports = {
	loadUsers,
};
