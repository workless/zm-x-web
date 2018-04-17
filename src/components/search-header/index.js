import { h, Component } from 'preact';
import { route } from 'preact-router';
import { Link } from 'preact-router/match';
import { connect } from 'preact-redux';
import wire from 'wiretie';
import cx from 'classnames';
import queryString from 'query-string';
import get from 'lodash-es/get';

import { getSender } from '../../store/entities/selectors';
import { getView, getSearchFolder } from '../../store/url/selectors';

import SearchInput from '../search-input';
import HeaderActions from '../header-actions';

import ClientLogo from '../client-logo';
import ActionMenuSearchFolder from '../action-menu-search-folder';
import getMailFolders from '../../graphql-decorators/get-mail-folders';

import s from './style.less';

const PrimaryLogo = () => (
	<Link className={s.primaryLogo} href="/">
		<div className={s.primaryLogoInner}>
			<ClientLogo />
		</div>
	</Link>
);

const VIEW_TO_SEARCH = {
	conversation: 'email',
	message: 'email'
};

@getMailFolders()
@connect((state, { email }) => ({
	cachedSender: getSender(state, email),
	currentView: getView(state),
	folder: getSearchFolder(state)
}))
@wire('zimbra', ({ email, cachedSender }) => ({
	contacts: email &&
		!cachedSender && [
		'searchRequest',
		{
			limit: 1,
			needExp: 1,
			query: `contact:${email}`,
			types: 'contact'
		}
	]
}))
class Search extends Component {
	state = {
		focused: false,
		folderToSearch: this.props.folder
	};

	handleSubmit = (query, email) => {
		route(
			`/search/${VIEW_TO_SEARCH[this.props.currentView] ||
				this.props.currentView}/?${queryString.stringify({
				q: query || undefined,
				e: email || undefined,
				types:
					this.props.currentView === 'calendar'
						? 'appointment,task'
						: 'conversation',
				folder: this.state.folderToSearch || undefined
			})}`
		);
	};

	handleFocus = () => {
		this.setState({ focused: true });
	};

	handleBlur = () => {
		this.setState({ focused: false });
	};

	handleFolderChange = name => {
		this.setState({ folderToSearch: name });
		if (this.props.query) this.handleSubmit(this.props.query, this.props.email);
	};

	render(
		{
			query,
			email,
			contacts,
			pending,
			cachedSender,
			currentView,
			pathType,
			folders
		},
		{ focused }
	) {

		return (
			<div className={s.searchContainer}>
				<div className={s.search}>
					<div className={cx(s.searchControl, focused && s.focus)}>
						{currentView === 'email' && (
							<ActionMenuSearchFolder
								folders={folders}
								label={this.state.folderToSearch || 'All'}
								onSearchFolderChanged={this.handleFolderChange}
							/>
						)}
						<SearchInput
							pathType={pathType}
							value={query}
							email={email}
							contact={cachedSender || (!pending && get(contacts, '0'))}
							fetchingContact={pending}
							onSubmit={this.handleSubmit}
							onFocus={this.handleFocus}
							onBlur={this.handleBlur}
							disableContactSuggestions={
								(VIEW_TO_SEARCH[currentView] || currentView) !== 'email'
							}
						/>
					</div>
				</div>
			</div>
		);
	}
}

export default function SearchHeader({
	className,
	pathType,
	query,
	queryEmail,
	folders,
	...rest
}) {
	return (
		<div {...rest} role="banner" className={cx(s.searchHeader, className)}>
			<PrimaryLogo />
			<Search query={query} email={queryEmail} pathType={pathType} />
			<HeaderActions />
		</div>
	);
}
