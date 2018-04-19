import { h, Component } from 'preact';
import DesktopViewer from './desktop-viewer';
import MobileViewer from './mobile-viewer';
import { message as messageType } from '../../constants/types';
import cx from 'classnames';
import { getEmailHTMLDocument } from '../../lib/html-email';
import { getEmailDomain, getId, hasFlag, isAddressTrusted } from '../../lib/util';
import array from '@zimbra/util/src/array';
import wire from 'wiretie';
import { connect } from 'preact-redux';
import { bindActionCreators } from 'redux';
import * as emailActionCreators from '../../store/email/actions';
import { getUserPref } from '../../store/email/selectors';
import { getFolder } from '../../store/folders/selectors';
import { flagMailItem, readMailItem } from '../../store/mail/actions';
import find from 'lodash-es/find';
import cloneDeep from 'lodash-es/cloneDeep';
import style from './style';

@connect(
	(state, { message }) => {
		const { email = {} } = state;

		return {
			fit: email.fit === true,
			displayExternalImagesPref: getUserPref(
				state,
				'zimbraPrefDisplayExternalImages'
			),
			trustedSendersPref: getUserPref(
				state,
				'zimbraPrefMailTrustedSenderList'
			),
			folder: getFolder(state, message.folderId)
		};
	},
	bindActionCreators.bind(null, {
		...emailActionCreators,
		flagMailItem,
		readMailItem
	})
)
@wire(
	'zimbra',
	null,
	zimbra => ({
		isPreloaded: zimbra.images.isPreloaded,
		isPreloading: zimbra.images.isPreloading,
		preloadImage: zimbra.images.preload
	})
)
export default class Viewer extends Component {

	state = {
		tmpTrustedSenders: []
	}

	reply = () => this.props.onReply(this.props.message);
	replyAll = () => this.props.onReplyAll(this.props.message);
	forward = () => this.props.onForward(this.props.message);
	more = () => undefined;

	//temporarily trust the images for the duration of this browser session
	trustImages = () => {
		this.setState({ tmpTrustedSenders: this.state.tmpTrustedSenders.concat(this.getFromAddress()) });
	};

	addTrustedDomainOrAddress = (domainOrAddress) => {
		//store the preference of trusting the domain or address long term
		this.props.setUserPrefs({
			zimbraPrefMailTrustedSenderList: array(this.props.trustedSendersPref).concat(domainOrAddress)
		});
		this.trustImages();
	}

	shouldShowExternalImages = () => {
		let { displayExternalImagesPref, trustedSendersPref } = this.props;
		//if user always allows external images to be shown in global pref, then show images
		if (displayExternalImagesPref) return true;
		//if user has temporarily authorized this sender, then show images
		let from = this.getFromAddress();
		if (from && this.state.tmpTrustedSenders.indexOf(from) !== -1) return true;
		//check address against trusted addresses/domains pref
		return isAddressTrusted(from, trustedSendersPref);
	}

	getFromAddress = () => find(this.props.message.emailAddresses, ['type', 'f']).address;

	getText(message) {
		return (message && (message.html || message.text)) || '';
	}

	preloadImages(resources) {
		let { isPreloaded, isPreloading, preloadImage } = this.props,
			total = 1,
			loaded = 0,
			done = () =>
				++loaded === total && this.setState({ imagesLoading: false });
		for (let i = 0; i < resources.length; i++) {
			if (!isPreloaded(resources[i]) && !isPreloading(resources[i])) {
				total++;
				preloadImage(resources[i]).then(done);
			}
		}
		if (total > 1) {
			done();
			this.setState({ imagesLoading: true });
			return true;
		}
		return false;
	}

	isFlagged = () => hasFlag(this.props.message, 'flagged');

	isUnread = () => hasFlag(this.props.message, 'unread');


	handleStarClick = e => {
		e.stopPropagation();
		this.props.flagMailItem({
			id: this.props.message.id,
			type: messageType,
			value: !this.isFlagged()
		});
	};

	handleReadStatusClick = (e, unread) => {
		e.stopPropagation();
		this.props.readMailItem({
			value: !unread,
			id: this.props.message.id,
			type: messageType
		});
	};

	handleHeaderClick = e => {
		let { target, currentTarget } = e;
		if (target!==currentTarget && target.parentNode!==currentTarget) return;
		this.props.onHeaderClick && this.props.onHeaderClick(this.props.message);
	};

	componentWillReceiveProps(nextProps) {
		if (getId(nextProps.message) !== getId(this.props.message)) {
			this.setState({
				imagesLoading: false
			});
		}
	}

	render(
		{
			message,
			inline,
			focus,
			fit,
			isConversation,
			pending,
			folder,
			disableStarIcon,
			disableReadIcon,
			matchesScreenSm,
			matchesScreenMd
		},
		{ imagesLoading }
	) {
		let resources = [];
		let allowImages = this.shouldShowExternalImages();
		let fromDomain = getEmailDomain(this.getFromAddress());
		let html = getEmailHTMLDocument(cloneDeep(message), { allowImages, resources });
		let externalImages = resources.filter(c => c.mode === 'external');

		if (!imagesLoading && resources.length && allowImages) {
			imagesLoading = this.preloadImages(resources);
		}

		let attachments =
			message.attachments &&
			message.attachments.filter(
				attachment =>
					!attachment.contentId ||
					html.indexOf(attachment.contentId.replace(/[<>]/g, '')) === -1
			);

		let loading = pending || !html;

		const showLoadImagesBanner = folder &&
			(folder.name === 'Junk' || !allowImages) && externalImages.length > 0;

		const viewerProps = {
			onHeaderClicked: this.handleHeaderClick,
			onStarClicked: this.handleStarClick,
			onReadStatusClicked: this.handleReadStatusClick,
			onForward: this.forward,
			onReply: this.reply,
			onReplyAll: this.replyAll,
			onAddTrustedDomainAddress: this.addTrustedDomainOrAddress,
			onTrustImages: this.trustImages,
			onMore: this.more,
			isConversation,
			isUnread: this.isUnread(),
			isStarred: this.isFlagged(),
			disableReadIcon,
			disableStarIcon,
			attachments,
			message,
			matchesScreenSm,
			fromDomain,
			loading,
			pending,
			imagesLoading,
			showLoadImagesBanner,
			html,
			fit,
			from: message.from,
			sender: message.sender,
			to: message.to,
			cc: message.cc,
			bcc: message.bcc
		};

		return (
			<div
				class={cx(
					style.viewer,
					inline ? style.inline : style.full,
					focus && style.focus,
					loading && style.loading
				)}
			>
				{matchesScreenMd
					? <DesktopViewer {...viewerProps} />
					: <MobileViewer {...viewerProps} />}
			</div>
		);
	}
}
