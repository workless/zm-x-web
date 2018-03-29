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
	state = {
		running: {}
	}

	loadRemoteZimlet = (props) => {
		let { loadZimletByUrl, zimlets } = props;
		let { running } = this.state;

		if (!zimlets || !Object.keys(zimlets).length) { return; }

		Promise.all(
			Object.keys(zimlets).map((name) => {
				const { url } = zimlets[name];
				if (running[name]) {
					console.warn(`[ZimletSDK "${name}"]: Zimlet is already running.`); // eslint-disable-line no-console
					return;
				}

				if (!url) {
					console.warn(`[ZimletSDK "${name}"]: Invalid Zimlet URL.`); // eslint-disable-line no-console
					return;
				}

				return loadZimletByUrl(url, { name, compat: false })
					.then( result =>
						Promise.resolve().then(result.init).then( () => result )
					)
					.then(() => {
						console.info(`[ZimletSDK "${name}"]: Loaded successfully from ${url}`); // eslint-disable-line no-console
						this.setState({
							running: {
								...this.state.running,
								[name]: { url }
							}
						});
					})
					.catch( error => console.warn(`[ZimletSDK "${name}"]:`, error)); // eslint-disable-line no-console
			})
		).then(() => {
			this.props.onLoadZimlets && this.props.onLoadZimlets(this.state.running);
			return this.state.running;
		});
	};

	componentWillMount() {
		if (!ZimletLoader.localStorageInitialized) {
			const persistedZimlets = zimletLocalStorage.get();

			if (persistedZimlets && Object.keys(persistedZimlets)) {
				const zimlets = { ...CONSTANT_ZIMLETS, ...this.props.zimlets, ...persistedZimlets };

				this.loadRemoteZimlet({
					...this.props,
					zimlets
				});
			}

			ZimletLoader.localStorageInitialized = true;
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

