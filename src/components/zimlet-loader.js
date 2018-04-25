import { Component } from 'preact';
import difference from 'lodash-es/difference';
import pick from 'lodash-es/pick';
import zimletLocalStorage from '../utils/zimlet-storage';
import wire from 'wiretie';

// Additional Zimlets that will always be loaded.
// These can be overridden (for development) by loading a Zimlet of the same name with a different URL.
const CONSTANT_ZIMLETS = {
	// SomeZimletName: { url: 'https://some-zimlet-url/index.js' }
};

@wire('zimlets', null, ({ loadZimletByUrl }) => ({ loadZimletByUrl }))
export default class ZimletLoader extends Component {
	static localStorageInitialized = false;
	static pending = {};
	static running = {};
	static errors = {};

	loadRemoteZimlet = (props) => {
		let { loadZimletByUrl, zimlets } = props;

		if (!zimlets || !Object.keys(zimlets).length) { return; }

		Object.keys(zimlets).forEach((name) => {
			const { url } = zimlets[name];
			if (ZimletLoader.running[name]) {
				return console.warn(`[ZimletSDK "${name}"]: Zimlet is already running.`); // eslint-disable-line no-console
			}

			if (ZimletLoader.pending[name]) {
				ZimletLoader.pending[name].then(this.callOnLoad);
				return console.warn(`[ZimletSDK "${name}"]: Zimlet is already pending.`); // eslint-disable-line no-console
			}

			if (!url) {
				let errorMsg = 'Zimlet URL Required';
				ZimletLoader.errors[name] = errorMsg;
				return console.warn(`[ZimletSDK "${name}"]: ${errorMsg}`); // eslint-disable-line no-console
			}

			return ZimletLoader.pending[name] = loadZimletByUrl(url, { name, compat: false })
				.then( result => result.init())
				.then(() => {
					console.info(`[ZimletSDK "${name}"]: Loaded successfully from ${url}`); // eslint-disable-line no-console
					ZimletLoader.running[name] =  { url };
					delete ZimletLoader.errors[name];
				})
				.catch( error => {
					console.warn(`[ZimletSDK "${name}"]:`, error);// eslint-disable-line no-console
					ZimletLoader.errors[name] = error;
				})
				.then(() => {
					this.callOnLoad();
					delete ZimletLoader.pending[name];
				});
		});

		return this.callOnLoad();
	};

	callOnLoad = () => this.props.onLoadZimlets && this.props.onLoadZimlets({ running: ZimletLoader.running, errors: ZimletLoader.errors })

	componentWillMount() {
		if (!ZimletLoader.localStorageInitialized) {
			ZimletLoader.localStorageInitialized = true;
			const persistedZimlets = zimletLocalStorage.get();

			if (persistedZimlets && Object.keys(persistedZimlets)) {
				const zimlets = { ...CONSTANT_ZIMLETS, ...this.props.zimlets, ...persistedZimlets };

				this.loadRemoteZimlet({
					...this.props,
					zimlets
				});
			}
		}
		else {
			this.loadRemoteZimlet(this.props);
		}
	}

	componentWillReceiveProps(nextProps) {
		const newZimlets = difference(Object.keys(nextProps.zimlets), Object.keys(this.props.zimlets));
		if (newZimlets.length) {
			this.loadRemoteZimlet({
				...nextProps,
				zimlets: pick(nextProps.zimlets, newZimlets)
			});
		}
	}
}

