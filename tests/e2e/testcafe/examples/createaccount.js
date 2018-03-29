let zimbra = require('../utils/soap-client');
let user1 = null;

async function admin() {

	user1 = await zimbra.getAdminAuthToken()
		.then(auth => zimbra.createAccount(auth));

	await zimbra.getAdminAuthToken()
		.then(auth => zimbra.deleteAccount(user1.id, auth));
}

admin();

