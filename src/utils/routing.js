import { route } from 'preact-router';
import { renamedFolderAbsPath } from './folders';

export function isActiveFolder(folder, url, prefix = 'email', includeChildren = false) {
	if (!folder.absFolderPath) { return false; }

	const encodedPath = encodeURIComponent(folder.absFolderPath.replace('/', ''));
	const excludeChildrenRe = includeChildren ? '' : '($|/)';
	const re = new RegExp(`^/${prefix}/${encodedPath}${excludeChildrenRe}`, 'i');
	return re.test(url);
}

export function isActiveOrChildFolder(folder, url, prefix = 'email') {
	return isActiveFolder(folder, url, prefix, true);
}

export function routeToRenamedFolder(folder, url, name) {
	route(url.replace(
		encodeURIComponent(folder.absFolderPath.replace('/', '')),
		encodeURIComponent(renamedFolderAbsPath(folder.absFolderPath, name))
	), true);
}
