import { h } from 'preact';
import { Text } from 'preact-i18n';
import { route } from 'preact-router';
import moment from 'moment';
import { graphql } from 'react-apollo';
import zipObject from 'lodash/zipObject';
import get from 'lodash/get';
import wire from 'wiretie';
import { defaultProps } from 'recompose';
import queryString from 'query-string';
import {
	DATE_FORMAT,
	DEFAULT_SORT,
	DEFAULT_LIMIT
} from '../../../constants/search';

import { updateQuery } from '../../../utils/query-params';
import registerTab from '../../../enhancers/register-tab';

import CalendarsQuery from '../../../graphql/queries/calendar/calendars.graphql';

import PureComponent from '../../../lib/pure-component';
import Fill from '../../../components/fill';
import CalendarSearchToolbar from '../../../components/calendar-search-toolbar';
import CalendarSidebar from '../../../components/calendar-sidebar';
import CalendarPane from '../../../components/calendar-pane';
import MailListFooter from '../../../components/mail-list-footer';

function getSearchQueryFromUrl() {
	const { q, e } = queryString.parse(window.location.search);
	return `${e || ''} ${q || ''}`.trim();
}


@defaultProps({
	limit: DEFAULT_LIMIT,
	sortBy: DEFAULT_SORT
})
@graphql(CalendarsQuery, {
	props: ({ data: { calendars } }) => ({
		calendars: calendars ? zipObject(calendars.map(c => c.id), calendars) : {}
	})
})
@wire('zimbra', props => {
	const query = getSearchQueryFromUrl();

	return {
		results: props.q && [
			'searchRequest',
			{
				query,
				offset: 0,
				limit: props.limit,
				types: props.types,
				recip: 2,
				fullConversation: 1,
				needExp: 1,
				sortBy: props.sortBy,
				calExpandInstStart:
					props.before && props.after
						? moment(props.after, DATE_FORMAT).valueOf()
						: undefined,
				calExpandInstEnd:
					props.before && props.after
						? moment(props.before, DATE_FORMAT).valueOf()
						: undefined
			}
		]
	};
})
@registerTab(({ q }) => ({
	type: 'search',
	id: 'search',
	title: `Search Results - "${q}"`
}))
export default class SearchCalendarPane extends PureComponent {
	showEventPopover = () =>
		this.setState({
			...this.state,
			popoverActive: !this.state.popoverActive
		});

	handleSort = sortBy => {
		route(updateQuery({ sort: sortBy }), true);
	};

	onClose = () => this.setState({ popoverActive: false });

	filterItems = eventType =>
		eventType === 'Tasks'
			? this.setState({ visibleResults: 'Tasks' })
			: this.setState({ visibleResults: 'Events' });

	navigateBack = () => route('/calendar');

	setDateValue = (newValue, name) =>
		this.setState({ ...this.state, [name]: newValue });

	constructor(props) {
		super(props);
		this.state = {
			visibleResults: 'Both'
		};
	}

	renderNoItems() {
		return (
			<MailListFooter>
				<Text id="search.noResults" />
			</MailListFooter>
		);
	}

	render(
		{
			after,
			before,
			calendars,
			groupBy,
			pending = {},
			refresh,
			results,
			sortBy,
			types
		},
		{ visibleResults }
	) {
		return (
			<Fill>
				<CalendarSidebar
					after={after}
					before={before}
					filterItems={this.filterItems}
					items={results}
					onNavigateBack={this.navigateBack}
					setDateValue={this.setDateValue}
					types={types}
				/>

				{results &&
					!pending.results && (
					<Fill>
						{types === 'appointment,task' && (
							<CalendarSearchToolbar
								count={
									get(results, 'appointments.length', 0) +
										get(results, 'task.length', 0)
								}
								more={results.more}
								types="events and tasks"
							/>
						)}
						{types === 'appointment' && (
							<CalendarSearchToolbar
								count={results.length || 0}
								more={results.more}
								types="events"
							/>
						)}
						{types === 'task' && (
							<CalendarSearchToolbar
								count={results.length || 0}
								more={results.more}
								types="tasks"
							/>
						)}

						<CalendarPane
							calendars={calendars}
							listType={groupBy}
							items={results}
							visibleResults={visibleResults}
							pending={pending && pending.results}
							more={results && results.more}
							sortBy={sortBy}
							renderNoItems={this.renderNoItems}
							afterAction={refresh}
							afterBulkDelete={refresh}
							onItemClick={this.showEventPopover}
							onSort={this.handleSort}
							wide
							disablePreview
							disableMessageNavigation
							showFolderName
						/>
					</Fill>
				)}
			</Fill>
		);
	}
}
