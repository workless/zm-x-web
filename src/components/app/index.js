import { h, Component } from 'preact';
import Match from 'preact-router/match';
import { Spinner } from '@zimbra/blocks';
import { route } from 'preact-router';
import ApolloClient from 'apollo-client';
import { ApolloProvider, graphql } from 'react-apollo';
import { branch, renderComponent } from 'recompose';
import ZimletLoader from '../zimlet-loader';
import cloneDeep from 'lodash/cloneDeep';
import cx from 'classnames';
import { getEmail, uriSegment } from '../../lib/util';
import newMessageDraft from '../../utils/new-message-draft';
import Routes from '../../routes';
import queryString from 'query-string';
import Provider from 'preact-context-provider';
import Login from '../login';
import ProgressIndicator from '../progress-indicator';
import ExternalHeader from '../external-header';
import SearchHeader from '../search-header';
import AppNavigation from '../app-navigation';
import SettingsModal from '../settings-modal';
import KeyboardShortcutsModal from '../keyboard-shortcuts-modal';
import AttachmentViewer from '../attachment-viewer';
import Notifications from '../notifications';
import config, { configure } from '../../config';
import { connect } from 'preact-redux';
import createStore from '../../store';
import zimbraClient from '../../lib/zimbra-client';
import zimletManager from '../../lib/zimlet-manager';
import createGifClient from '../../lib/gif-client';
import createwebSearchClient from '../../lib/webSearch-client';
import * as urlActionCreators from '../../store/url/actions';
import * as emailActionCreators from '../../store/email/actions';
import { applyServerChanges } from '../../store/entities/actions';
import { loadMailCollection } from '../../store/mail/actions';
import { setPreviewAttachment } from '../../store/attachment-preview/actions';
import { getSelectedAttachmentPreview } from '../../store/attachment-preview/selectors';
import { getSearchQuery, getSearchEmail } from '../../store/url/selectors';
import style from './style';
import KeyboardShortcutHandler from '../../keyboard-shortcuts/keyboard-shortcut-handler';
import KeyToCommandBindings from '../../keyboard-shortcuts/key-to-command-bindings';
import searchInputStyle from '../search-input/style';

import NoopQuery from '../../graphql/queries/noop.graphql';
import accountInfo from '../../graphql-decorators/account-info';

import {
	createZimbraSchema,
	LocalBatchLink,
	ZimbraInMemoryCache,
	ZimbraErrorLink
} from '@zimbra/api-client';

import { IntlProvider, Text } from 'preact-i18n';
import definition from '../../intl.json';
import withCommandHandlers from '../../keyboard-shortcuts/with-command-handlers';

const AppShell = (props) => (
	<div {...props} id="zm-x-web" class={cx(style.app, props.class)} />
);

const Loading = () => (
	<AppShell>
		<div class={style.loading}>
			<Spinner class={style.spinner} />
			<div class={style.text}>
				<Text id="app.loading" />
			</div>
		</div>
	</AppShell>
);

const LoginContainer = ({ refetchAccount }) => (
	<AppShell>
		<Login onLogin={refetchAccount} />
	</AppShell>
);

@configure('zimbraOrigin,routes.slugs')
export default class Provide extends Component {
	constructor(props, context) {
		super(props, context);

		this.zimbra = zimbraClient({
			url: config.zimbraOrigin
		});

		this.store = createStore({}, this.zimbra);

		this.zimbra.addChangeListener(changes =>
			this.store.dispatch(applyServerChanges(changes))
		);

		this.keyBindings = new KeyToCommandBindings();
		this.shortcutCommandHandler = new KeyboardShortcutHandler({
			store: context.store,
			keyBindings: this.keyBindings
		});

		this.zimlets = zimletManager({
			zimbra: this.zimbra,
			zimbraOrigin: config.zimbraOrigin,
			store: this.store,
			config,
			keyBindings: this.keyBindings,
			shortcutCommandHandler: this.shortcutCommandHandler
		});

		// Content providers (images, gifs, videos, news).
		this.content = {
			gifs: createGifClient(),
			webSearches: createwebSearchClient()
		};

		// Export the app wrapped in our providers
		if (process.env.NODE_ENV === 'development') {
			window.zimbra = this.zimbra;
			window.store = this.store;
			window.zimlets = this.zimlets;
			window.content = this.content;
		}
	}

	componentWillUnmount() {
		this.zimlets.destroy();
	}

	render(props) {
		const cache = new ZimbraInMemoryCache();
		const { schema } = createZimbraSchema({
			cache,
			zimbraOrigin: config.zimbraOrigin
		});
		const link = new LocalBatchLink({
			schema,
			// TODO: passing the zimbra client should be removed once all usage is removed
			context: { zimbra: this.zimbra }
		});
		const apolloClient = new ApolloClient({
			cache,
			link: ZimbraErrorLink.concat(link)
		});

		return (
			<Provider
				config={config}
				store={this.store}
				zimbra={this.zimbra}
				zimlets={this.zimlets}
				gifs={this.content.gifs}
				links={this.content.links}
				keyBindings={this.keyBindings}
				shortcutCommandHandler={this.shortcutCommandHandler}
				webSearches={this.content.webSearches}
				schema={schema}
				link={link}
			>
				<IntlProvider definition={definition}>
					<ApolloProvider client={apolloClient}>
						<App {...props} />
					</ApolloProvider>
				</IntlProvider>
			</Provider>
		);
	}
}

@configure('nav')
@accountInfo()
@branch(({ accountLoading }) => accountLoading, renderComponent(Loading))
@branch(({ account }) => !account, renderComponent(LoginContainer))
@connect(
	state => ({
		query: getSearchQuery(state),
		queryEmail: getSearchEmail(state),
		attachment: getSelectedAttachmentPreview(state),
		showSettings: state.settings.visible
	}),
	{
		...urlActionCreators,
		...emailActionCreators,
		closeAttachmentPreview: setPreviewAttachment,
		loadMailCollection
	}
)
@graphql(NoopQuery, {
	name: 'noop'
})
@withCommandHandlers(props => [
	{ context: 'all', command: 'GO_TO_MAIL', handler: () => route('/') },
	{ context: 'all', command: 'GO_TO_MAIL', handler: () => route('/') },
	{
		context: 'all',
		command: 'GO_TO_CALENDAR',
		handler: () => route(`/${props.slugs.calendar}`)
	},
	{
		context: 'all',
		command: 'GO_TO_CONTACTS',
		handler: () => route(`/${props.slugs.contacts}`)
	},
	{
		context: 'all',
		command: 'COMPOSE_MESSAGE',
		handler: () =>
			route('/') && props.openModalCompose({ message: newMessageDraft() })
	},
	{
		context: 'all',
		command: 'NEW_CONTACT',
		handler: () => route(`/${props.slugs.contacts}/new`)
	},
	{
		context: 'all',
		command: 'FOCUS_SEARCH_BOX',
		handler: ({ e }) => {
			e && e.preventDefault();
			document.getElementsByClassName(searchInputStyle.input)[0].focus(); //a bit hacky.  Less hacky would be to store ref in redux store
		}
	}
])
export class App extends Component {
	routeChanged = e => {
		if (this.props.attachment) {
			// Remove any preview attachments when changing routes.
			this.props.closeAttachmentPreview();
		}
		this.props.setUrl(e.url);

		let { matches, path, url, ...routeProps } = e.current.attributes;
		this.props.setRouteProps(routeProps);
	};

	handleGlobalClick = e => {
		let { target } = e;
		do {
			if (
				String(target.nodeName).toUpperCase() === 'A' &&
				target.href &&
				target.href.match(/^mailto:/)
			) {
				let [, address, query] = target.href.match(
					/^mailto:\s*([^?]*)\s*(\?.*)?/i
				);
				let params = query ? queryString.parse(query) : {};
				address = decodeURIComponent(address);

				params.to = [{ address, email: getEmail(address) }];
				this.openComposer(params);
				e.preventDefault();
				return false;
			}
		} while ((target = target.parentNode));
	};

	openComposer(params) {
		let message = Object.assign(newMessageDraft(), params);
		this.props.openModalCompose({
			mode: 'mailTo',
			message
		});
	}

	handleGlobalKeyDown = e => {
		this.context.shortcutCommandHandler.handleKeyDown({ e });
	};

	getPathType = () => {
		const baseSegment = uriSegment(window.location.pathname);

		const pathType =
			baseSegment === 'search'
				? uriSegment(window.location.pathname, 1)
				: baseSegment;

		return pathType;
	};

	/**
	 * Send a keepalive ping every 5 minutes to maintain the session.
	 */
	setKeepAlive = (props) => {
		if (this.keepAliveTimer) {
			clearInterval(this.keepAliveTimer);
		}

		if (props.account) {
			this.keepAliveTimer = setInterval(() => {
				this.props.noop.refetch();
			}, 300000);
		}
	}

	componentDidMount() {
		addEventListener('click', this.handleGlobalClick);
		addEventListener('keydown', this.handleGlobalKeyDown);

		if (this.props.account) {
			this.props.setAccount(cloneDeep(this.props.account));
		}

		this.setKeepAlive(this.props);
	}

	componentWillReceiveProps(nextProps) {
		if (Boolean(nextProps.account) !== Boolean(this.props.account)) {
			this.setKeepAlive(nextProps);
		}
	}

	componentWillUnmount() {
		removeEventListener('click', this.handleGlobalClick);
		removeEventListener('keydown', this.handleGlobalKeyDown);
		clearInterval(this.keepAliveTimer);
	}

	render({ nav, query, queryEmail, showSettings }) {
		return (
			<AppShell>
				<ZimletLoader />
				{showSettings && <SettingsModal />}
				<KeyboardShortcutsModal />
				<AttachmentViewer />

				<ProgressIndicator />

				{nav && <ExternalHeader className={style.hideSmDown} /> }
				<Match path="/">
					{() => (
						<SearchHeader
							className={style.hideSmDown}
							query={query}
							queryEmail={queryEmail || null}
							pathType={this.getPathType()}
						/>
					)}
				</Match>
				<AppNavigation />
				<Notifications />

				<main class={cx(style.main, !nav && style.noExternalHeader)}>
					<Routes onChange={this.routeChanged} />
				</main>
			</AppShell>
		);
	}
}
