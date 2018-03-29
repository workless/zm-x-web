import { h, Component } from 'preact';
import Router from 'preact-router';
import { configure } from '../config';
import ZimletSlot from '../components/zimlet-slot';
import split from '../lib/split-point';

import Mail from 'bundle-loader?name=mail-screen&lazy!../screens/mail';
import Conversation from 'bundle-loader?name=conversation-screen&lazy!../screens/conversation';
import Message from 'bundle-loader?name=message-screen&lazy!../screens/message';
import Contacts from 'bundle-loader?name=contacts-screen&lazy!../components/contacts';
import FixDuplicates from 'bundle-loader?name=fix-duplicates-screen&lazy!../components/contacts/fix-duplicates';
import Calendar from 'bundle-loader?name=calendar-screen&lazy!../components/calendar';
import MailSearch from 'bundle-loader?name=search-mail-screen&lazy!../screens/search/mail';
import CalendarSearch from 'bundle-loader?name=search-calendar-screen&lazy!../screens/search/calendar';
import Dev from 'bundle-loader?name=dev&lazy!@zimbra/blocks/src/dev';
import ZimletsSdk from 'bundle-loader?name=zimlets-sdk&lazy!../screens/sdk/zimlets';
import GraphiQL from 'bundle-loader?name=graphiql&lazy!../screens/graphiql';

const ErrorPage = () => (
	<div>
		<h2>Not Found</h2>
		<a href="/">Go Home</a>
	</div>
);

const Routes = {
	mail: split(Mail),
	conversation: split(Conversation),
	message: split(Message),
	contacts: split(Contacts),
	fixDuplicates: split(FixDuplicates),
	calendar: split(Calendar),
	search: {
		mail: split(MailSearch),
		calendar: split(CalendarSearch)
	},
	dev: split(Dev),
	zimletsSdk: split(ZimletsSdk),
	graphiql: split(GraphiQL),
	error: ErrorPage
};

@configure('routes.slugs')
export default class AppRouter extends Component {
	render({ slugs, ...props }) {
		return (
			<ZimletSlot name="routes" slugs={slugs}>
				{ slotContent => (
					<Router {...props}>
						<Routes.mail path={`/`} />
						<Routes.conversation path={`/${slugs.conversation}/:id`} />
						<Routes.message path={`/${slugs.message}/:id`} />
						<Routes.mail path={`/${slugs.email}/:folderName`} />
						<Routes.mail path={`/${slugs.email}/:folderName/:type/:id`} />
						<Routes.calendar path={`/${slugs.calendar}`} />
						<Routes.contacts path={`/${slugs.contacts}`} />
						<Routes.contacts path={`/${slugs.contacts}/new`} contact="new" />
						<Routes.contacts path={`/${slugs.contacts}/:folder`} />
						<Routes.contacts path={`/${slugs.contacts}/:folder/:contact`} />
						<Routes.fixDuplicates path={`/fix-duplicate-contacts`} />
						<Routes.search.mail path={`/search/${slugs.email}`} />
						<Routes.search.calendar path={`/search/${slugs.calendar}`} />
						<Routes.zimletsDev path="/dev/zimlets" />
						<Routes.zimletsSdk path="/sdk/zimlets" />
						<Routes.dev path={`/dev/:block?`} />
						<Routes.graphiql path="/graphiql" />
						{slotContent}
						<Routes.error default />
					</Router>
				) }
			</ZimletSlot>
		);
	}
}
