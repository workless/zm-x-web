import { h, Component } from 'preact';
import { compose } from 'recompose';
import ContactCard from './contact-card';
import EmailTime from '../email-time';
import wire from 'wiretie';
import { connect } from 'preact-redux';
import { setPreviewAttachment } from '../../store/attachment-preview/actions';
import { configure } from '../../config';
import { getName } from '../../utils/contacts';
import cx from 'classnames';
import style from './style';

// Number of milliseconds to wait before loading additional details for the selected contact.
const LOAD_DETAILS_DELAY = 250;

export default class ContactDetails extends Component {

	/** Being a bit careful here not to fetch details for contacts when someone is scanning the list (ex: via arrow keys)
	 *	To avoid this, delay rendering the attachments/photos/messages details until 250ms has passed.
	 *	Unmounting or re-rendering with a new contact will reset the timer.
	 */

	state = {
		details: false
	};

	reset() {
		if (this.state.details) {
			this.setState({ details: false });
		}
		clearTimeout(this.detailsTimer);
		this.detailsTimer = setTimeout( () => {
			this.setState({ details: true });
		}, LOAD_DETAILS_DELAY);
	}

	componentDidMount() {
		this.reset();
	}

	componentWillReceiveProps({ contact }) {
		if (contact!==this.props.contact) this.reset();
	}

	componentWillUnmount() {
		clearTimeout(this.detailsTimer);
	}

	render({ contact }, { details }) {
		return (
			<div class={style.contactDetails}>
				<div class={style.inner}>
					<ContactCard contact={contact} />

					{ details && contact.attributes.email &&
						<div class={style.details}>
							<ContactMessages contact={contact} />
							<ContactFiles contact={contact} />
							<ContactPhotos contact={contact} />
						</div>
					}
				</div>
			</div>
		);
	}
}

const ContactMessages = compose(
	wire('zimbra', ({ contact }) => ({
		messages: contact.attributes && ['search', {
			query: `from:${contact.attributes.email}`,
			limit: 5
		}],
		folderMapping: 'folders.getIdMapping'
	})),
	configure({ slugs: 'routes.slugs' })
)( ({ contact, messages, pending, folderMapping, slugs }) => contact.attributes && (
	<div class={cx(style.contactMessages, (pending || !messages || !messages.length) && style.empty)}>
		<h3><strong>Messages</strong> from {getName(contact.attributes)}</h3>
		<div>
			{ Array.isArray(messages) && messages.map( message => {
				let folder = folderMapping && folderMapping[message.folderId];

				return (
					<a class={style.contactMessage} href={`/${slugs.email}/${encodeURIComponent(folder || 'Inbox')}/${slugs.conversation}/${message.conversationId || message.id}?selected=${message.id}`}>
						<EmailTime time={message.date} class={style.time} />
						<span class={style.folder} title={folder}>{folder}</span>
						<span class={style.title} title={message.subject}>{message.subject || '[No Subject]'}</span>
					</a>
				);
			}) }
			<div class={style.contactMoreMessages}>
				<a class={style.more} href={`/search/${slugs.email}?q=${encodeURIComponent('from:'+contact.attributes.email)}`}>View All</a>
			</div>
		</div>
	</div>
));

function getAttachments(messages, typeFilter) {
	if (!Array.isArray(messages)) return [];
	return messages.reduce( (attachments, message) => {
		attachments.push( ...(message.attachments || []).filter(typeFilter || Boolean).map( attachment => ({ attachment, message })) );
		return attachments;
	}, []);
}


const CONTACT_FILES_EXCLUDED = ['image/*', 'message/rfc822', 'text/calendar', 'application/ics'];
const CONTACT_FILES_EXCLUDED_REGEX = new RegExp(CONTACT_FILES_EXCLUDED.map(mime => mime.replace('*', '.*')).join('|'), 'i');

function contactFilesFilter({ contentType }) {
	return !CONTACT_FILES_EXCLUDED_REGEX.test(contentType);
}

const ContactFiles = wire('zimbra', ({ contact }) => ({
	messages: ['search', {
		query: `from:${contact.attributes.email} has:attachment NOT attachment:${CONTACT_FILES_EXCLUDED.join(' NOT attachment:')}`,
		fetch: true,
		limit: 5
	}],
	folderMapping: 'folders.getIdMapping'
}))( ({ contact, messages, pending, folderMapping }) => {
	let files = messages && getAttachments(messages,contactFilesFilter ).slice(0, 5) || [];
	let attachmentGroup = files && files.map(({ attachment }) => attachment);
	return (
		<div class={cx(style.contactFiles, (pending || !files.length) && style.empty)}>
			<h3><strong>Files</strong> from {getName(contact.attributes)}</h3>
			<div>
				{ files.map( file => <ContactFile {...file} attachmentGroup={attachmentGroup} folderMapping={folderMapping} /> ) }
			</div>
		</div>
	);
});


const ContactFile = connect(null, (dispatch, props) => ({
	preview: () => dispatch(setPreviewAttachment(props.attachment, props.attachmentGroup))
}))( ({ message, attachment, preview, folderMapping }) => {
	let folder = folderMapping && folderMapping[message.folderId],
		title = attachment.filename || attachment.name;

	return (
		<a class={style.contactFile} href="javascript:" onClick={preview}>
			<EmailTime time={message.date} class={style.time} />
			<span class={style.folder} title={folder}>{folder}</span>
			<span class={style.title} title={title}>{title}</span>
		</a>
	);
});

function contactPhotosFilter({ contentType }) {
	return contentType.match(/image\/.*/i);
}

const ContactPhotos = wire('zimbra', ({ contact }) => ({
	messages: ['search', {
		query: `from:${contact.attributes.email} has:attachment attachment:image/*`,
		fetch: true,
		limit: 5
	}]
}))( ({ contact, messages, pending }) => {
	let photos = messages && getAttachments(messages, contactPhotosFilter).slice(0, 5).map(({ attachment }) => attachment) || [];
	return (
		<div class={cx(style.contactPhotos, (pending || !photos.length) && style.empty)}>
			<h3><strong>Photos</strong> from {getName(contact.attributes)}</h3>
			<div>
				{ photos.map( photo => <ContactPhoto attachment={photo} attachmentGroup={photos} /> ) }
			</div>
		</div>
	);
});


const ContactPhoto = connect(null, (dispatch, props) => ({
	preview: () => dispatch(setPreviewAttachment(props.attachment, props.attachmentGroup))
}))( ({ attachment, preview }) =>
	(<a
		class={style.contactPhoto}
		title={attachment.filename}
		href="javascript:"
		onClick={preview}
		style={{
			backgroundImage: `url(${attachment.url})`
		}}
	 />)
);
