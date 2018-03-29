import find from 'lodash/find';
import findIndex from 'lodash/findIndex';
import filter from 'lodash/filter';
import { parseURI } from '../lib/util';

export function getPublicGrant(acl) {
	return find(acl.grant, ['granteeType', 'pub']);
}

export function getEmailGrants(acl) {
	return filter(
		acl.grant,
		g => g && g.granteeType && g.granteeType.match(/usr|guest/)
	);
}

export function addPublicGrant(acl) {
	return {
		...acl,
		grant: [
			...acl.grant,
			{
				granteeType: 'pub',
				permissions: 'r'
			}
		]
	};
}

// `key` grants without an email are not supported, so generating public
// links with a unique access key is not yet possible.
export function addKeyGrant(acl) {
	return {
		...acl,
		grant: [
			...acl.grant,
			{
				granteeType: 'key',
				permissions: 'r'
			}
		]
	};
}

export function removePublicGrant(acl) {
	return {
		...acl,
		grant: filter(acl.grant, g => g.granteeType !== 'pub')
	};
}

export function removeEmailGrant(acl, grant) {
	return {
		...acl,
		grant: filter(acl.grant, g => g.zimbraId !== grant.zimbraId)
	};
}

export function updateGrant(acl, nextGrant) {
	const grantIndex = findIndex(acl.grant, g => g.zimbraId === nextGrant.zimbraId);
	if (grantIndex === -1) { return acl; }

	let nextArray = [...acl.grant];
	nextArray.splice(grantIndex, 1, nextGrant);

	return {
		...acl,
		grant: nextArray
	};
}

export function addEmailGrants(acl, emails, permissions, zimbraPublicURL) {
	const uri = parseURI(zimbraPublicURL);

	return {
		...acl,
		grant: [
			...acl.grant,
			...emails.map(e => {
				const onDomain = e.match(uri.hostname);
				return {
					permissions,
					granteeType: onDomain ? 'usr' : 'guest',
					address: e,
					password: ''
				};
			})
		]
	};
}
