import get from 'lodash-es/get';
import find from 'lodash-es/find';
import includes from 'lodash-es/includes';

function identityAddress(i) {
	return i.zimbraPrefFromAddress || get(i, '_attrs.zimbraPrefFromAddress');
}

export function getAccountAddresses(account) {
	return get(account, 'identities.identity', []).map(identityAddress);
}

export function getPrimaryAccountAddress(account) {
	// FIXME: legacy zimbra-client normalized data used `account.identities`
	const identities = get(account, 'identities.identity') || account.identities;
	const identity =
		find(identities, i => i.id === account.id) || account.identities[0];
	return identityAddress(identity);
}

export function withoutAccountAddresses(account) {
	const accountAddresses = getAccountAddresses(account);

	return sender => !includes(accountAddresses, sender.address);
}

export function isAccount(account, sender) {
	const accountAddresses = getAccountAddresses(account);
	return includes(accountAddresses, sender.address);
}

export function getPrimaryAccountName(account) {
	return get(account, 'attrs.displayName') || getPrimaryAccountAddress(account);
}
