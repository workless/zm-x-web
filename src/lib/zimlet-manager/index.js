/* eslint no-unused-vars:1 */

import { h, Component, cloneElement } from 'preact';
import { route, Link } from 'preact-router';
import emitter from 'mitt';
import qs from 'query-string';
import delve from 'lodash-es/get';
import realm from './realm';
import createCache from './cache';
// import compat from './compat';  //commented out for now. Can be deleted when we are super sure we won't do any backwards compat
import * as allBlocks from '@zimbra/blocks';
// @TODO use https://npm.im/import-glob to pull in components automatically:
// import allComponents from '../../components/**/index.js';
import MenuItem from '../../components/menu-item';
import Sidebar from '../../components/sidebar';
import FolderList from '../../components/folder-list';
import SmartList from '../../components/smart-list';
import ActionMenuMoveFolder from '../../components/action-menu-move-folder';
import ActionButton from '../../components/action-button';
import ConfirmModalDialog from '../../components/confirm-modal-dialog';
import ModalDialog from '../../components/modal-dialog';
import CaptureBeforeUnload from '../../components/capture-before-unload';
import TextInput from '../../components/text-input';
import ActionMenuGroup from '../../components/action-menu-group';
import ActionMenuItem from '../../components/action-menu-item';
import DraggableCard from '../../components/draggable-card';

let components = {
	...allBlocks,
	MenuItem,
	Sidebar,
	FolderList,
	SmartList,
	ActionMenuMoveFolder,
	ActionButton,
	CaptureBeforeUnload,
	ConfirmModalDialog,
	ModalDialog,
	TextInput,
	ActionMenuItem,
	ActionMenuGroup,
	DraggableCard
};

const SHOW_ZIMLETS_URL_FLAG= /[?&#]zimletSlots=show(?:&|$)/;

export default function zimletManager({ zimbra, store, zimbraOrigin, config, showZimletSlots, keyBindings, shortcutCommandHandler }) {
	let exports = emitter();
	exports.initialized = false;
	let oninit = deferred();
	let initializing = false;
	exports.failedInitializations = 0;

	//Show zimlet slots
	if (showZimletSlots || (typeof location!=='undefined' && String(location).match(SHOW_ZIMLETS_URL_FLAG))) {
		exports.showZimletSlots = true;
	}

	let plugins = {};

	let idCounter = 0;

	// // holds exposed zimlet globals
	// let zimletInterfaces;

	let zimbraContextGlobals = {
		ZIMLETS_VERSION: '2.0.0'
	};

	let zimbraRealm = realm({
		name: 'Zimlet Manager',
		scope: zimbraContextGlobals
	}).then( r => zimbraRealm.sync = r );

	function getAccount() {
		return delve(store.getState(), 'email.account') || {};
	}

	exports.invokePlugin = function invokePlugin(name, ...args) {
		let list = plugins[name],
			results = [],
			res;
		if (list) {
			for (let i=0; i<list.length; i++) {
				try {
					if (Object.keys(list[i].handler.prototype).length===0) {
						res = list[i].handler(...args);
					}
					else {
						res = list[i].handler;
					}
				}
				catch (err) {
					err.sourceZimlet = list[i].zimletName;
					res = err;
				}
				results.push(res);
			}
		}
		return results;
	};

	// Create a zimlet-specific registry for adding/removing named plugins (eg: slots)
	function createPlugins(zimletName) {
		return {
			register(name, handler) {
				let list = plugins[name] || (plugins[name] = []);
				list.push({ zimletName, handler });
				exports.emit('plugins::changed', name);
			},
			unregister(name, handler) {
				let list = plugins[name];
				if (list) {
					for (let i=list.length; i--; ) {
						if (list[i].zimletName===zimletName && list[i].handler===handler) {
							list.splice(i, 1);
							exports.emit('plugins::changed', name);
							break;
						}
					}
				}
			},
			unregisterAll() {
				for (let name in plugins) {
					if (plugins.hasOwnProperty(name)) {
						let list = plugins[name];
						let changed = false;
						for (let i=list.length; i--;) {
							if (list[i].zimletName===zimletName) {
								list.splice(i, 1);
								changed = true;
							}
						}
						if (changed) {
							exports.emit('plugins::changed', name);
						}
					}
				}
			}
		};
	}

	function createStyler(zimletName) {
		let tag;
		return {
			set(css) {
				css = String(css || '');
				if (!tag) {
					tag = document.createElement('style');
					tag.id = `zimlet-style-${zimletName}`;
					tag.appendChild(document.createTextNode(css));
					document.head.appendChild(tag);
				}
				else {
					tag.firstChild.nodeValue = css;
				}
			},
			remove() {
				if (tag) tag.parentNode.removeChild(tag);
				tag = null;
			}
		};
	}

	// @TODO: move this into the model
	function getCompiledZimlets() {
		let { attrs, cos } = getAccount();
		if (attrs==null) return Promise.reject(Error('No account'));
		let url = '/service/zimlet/res/Zimlets-nodev_all.js.zgz?' + qs.stringify({
			language: attrs.zimbraLocale,
			country: 'CA',  // @TODO where do we get this?
			cosId: array(cos)[0].id
		});
		return zimbra.request(url, null, { responseType: 'text' });
	}

	function runZimlets(code, options={}) {
		let zm = options.zimlet || options.config && options.config.zimlet || {};
		let name = zm.name || options.name || `zimlet_${++idCounter}`;
		let factory;
		let container;

		let zimletContext = {
			zimbraOrigin,
			zimlets: exports,
			zimbra,
			zimletRedux: store.zimletRedux,
			getAccount,
			config: options.config,
			plugins: createPlugins(name),
			resourceUrl: `/service/zimlet/${encodeURIComponent(name)}/`,
			cache: createCache(name),
			h,
			createElement: h,
			Component,
			cloneElement,
			route, //need these so zimlets share same router instance and can route within the app
			Link,
			components: Object.assign({}, components),
			styles: createStyler(name),
			keyBindings,
			shortcutCommandHandler
		};

		if (options.context) Object.assign(zimletContext, options.context);

		return zimbraRealm.then( c => {
			container = c;

			// @note: compat is disabled/removed for now
			zimletContext.isCompat = false;
			// zimletContext.isCompat = options.compat === true || (options.compat !== false && exports.compat.isCompatZimlet(name, zm));
			// if (zimletContext.isCompat) {
			// 	container.expose(exports.compat.getGlobals(zimletContext));
			// }

			// Expose the global zimlet(factory) register function:
			container.expose({
				zimlet: f => { factory = f; }
			});

			// Expose any additional custom scope items:
			if (options.scope) container.expose(options.scope);

			// Actually run the zimlet code:
			return container.eval(code, {
				wrap: !zimletContext.isCompat,
				sourceUrl: options.url
			});
		}).then( context => {
			context.zimletContext = zimletContext;

			// overwrite the container's zimlet() method with one that performs an update instead of an init:
			container.expose({
				zimlet: f => {
					//eslint-disable-next-line no-console
					console.log(` 🔄 Zimlet ${name} restarted.`);
					context._shutdown();
					factory = f;
					context._setup();
					context.init();
				}
			});

			// Get a list of methods that can be invoked on a zimlet:
			context.getHandlerMethods = () => Object.keys(context.handler || {}).reduce( (acc, n) => ((acc[n] = context.handler[n].bind(context)), acc), {});

			// Invoke a method on the zimlet's public (returned) interface:
			context.invoke = (method, ...args) => {
				if (!context.handler) throw Error(`No method ${method}()`);
				let path = ['handler'].concat(method.split('.'));
				method = path.pop();
				let ctx = delve(context, path);
				return ctx[method](...args);
			};

			// Initialize the zimlet if it hasn't already been initialized.
			context.init = () => {
				if (context.initialized!==true) {
					context.initialized = true;
					if (context.init) return context.invoke('init');
				}
			};

			// Inform zimlet of shutdown, remove all plugins & stylesheets, then kill it.
			// Note: this intentionally does not destroy the container, since it is used for soft restarts (eg: HMR)
			context._shutdown = () => {
				try {
					if (context.unload) context.invoke('unload');
					if (context.destroy) context.invoke('destroy');
				}
				catch (err) {
					console.error('Error shutting down zimlet: '+err);
				}
				zimletContext.plugins.unregisterAll();
				zimletContext.styles.remove();
				context.initialized = false;
			};

			// (re-)initialize the zimlet by invoking its register factory
			context._setup = () => {
				try {
					let handlerObj = zm.handlerObject;
					if (factory) {
						//eslint-disable-next-line new-cap
						context.handler = new factory(zimletContext);
					}
					else if (handlerObj) {
						context.handler = new context.globals[handlerObj]();
					}
				}
				catch (err) {
					return Promise.reject(Error(`Failed to construct handlerObject: ${err}`));
				}
			};

			return context._setup() || context;
		});
	}

	exports.initialize = function initialize() {
		if (initializing===false && !exports.initialized) {
			initializing = true;

			// If compat zimlet loading is disabled, don't fetch and run the compile zimlets bundle from the server
			if (config.disableCompatZimlets===true) {
				initializing = false;
				exports.initialized = true;
				// zimletInterfaces = {};
				oninit.resolve(exports);
				exports.emit('init', exports);
				return Promise.resolve();
			}

			return getCompiledZimlets()
				.then( code => {
					exports.emit('beforeinit', exports);
					return runZimlets(code, { compat: true });
				})
				.then( () => {
					initializing = false;
					exports.initialized = true;
					// zimletInterfaces = globals;
					oninit.resolve(exports);
					exports.emit('init', exports);
				})
				.catch( err => {
					initializing = false;
					exports.failedInitializations++;
					exports.emit('init::failed', err);
				});
		}
		return oninit;
	};

	exports.destroy = function destroy() {
		if (zimbraRealm.sync) {
			zimbraRealm.sync.destroy();
		}
	};

	exports.loadZimletByUrl = function loadZimlet(url, options={}) {
		let name = options.name || url; // @TODO infer, or can it just be unnamed?
		options.url = url;
		return fetch(url)
			.then( r => {
				if (r.ok) {
					return r.text();
				}
				let error = new Error(r.statusText || r.status);
				error.response=r;
				return Promise.reject(error);
			})
			.then( code => exports.runZimlet(name, code, options) );
	};

	let runCache = {};
	exports.runZimlet = function runZimlet(name, code, options={}) {
		if (name in runCache) {
			//eslint-disable-next-line no-console
			console.log(`Zimlet "${name}" has already been started.`);
			return runCache[name];
		}
		return runCache[name] = exports.initialize().then( () => runZimlets(code, options) );
	};

	// exports.compat = compat({
	// 	zimlets: exports,
	// 	zimbra,
	// 	store,
	// 	zimbraOrigin
	// });

	setTimeout(exports.initialize, 1000);

	return exports;
}


const array = obj => Array.isArray(obj) ? obj : [].concat(obj);

function deferred() {
	let resolve, reject;
	let me = new Promise( (realResolve, realReject) => {
		resolve = realResolve;
		reject = realReject;
	});
	me.resolve = resolve;
	me.reject = reject;
	return me;
}
