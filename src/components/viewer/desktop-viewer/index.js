import { h } from 'preact';

import { Text } from 'preact-i18n';
import { Icon, Spinner } from '@zimbra/blocks';
import ZimletSlot from '../../zimlet-slot';
import Invitation from '../invitation';
import HtmlViewer from '../../html-viewer';
import NakedButton from '../../naked-button';
import Attachment from '../../attachment';
import UnreadControl from '../../unread-control';
import StarIcon from '../../star-icon';
import AddressList from '../../address-list';
import EmailTime from '../../email-time';

import { callWith } from '../../../lib/util';
import injectQuoteToggle from '../../../lib/quote-toggle';

import style from './style.less';
import cx from 'classnames';

export default function DesktopViewer({
	onReply,
	onReplyAll,
	onForward,
	onAddTrustedDomainOrAddress,
	onMore,
	onStarClicked,
	onReadStatusClicked,
	onTrustImages,
	onHeaderClicked,
	isUnread,
	isStarred,
	isConversation,
	disableStarIcon,
	disableReadIcon,
	attachments,
	fromDomain,
	from,
	sender,
	to,
	cc,
	message,
	loading,
	pending,
	imagesLoading,
	showLoadImagesBanner,
	html,
	fit
}) {
	return (
		<div class={style.viewerContent}>
			<div class={style.headers} onClick={onHeaderClicked}>
				{!disableStarIcon && (
					<StarIcon
						class={style.star}
						onClick={onStarClicked}
						starred={isStarred}
					/>
				)}
				{!disableReadIcon && (
					<UnreadControl
						class={style.readStatus}
						onChange={onReadStatusClicked}
						value={isUnread}
						visible
					/>
				)}

				<div class={cx(style.date, style.hideSmDown)}>
					<EmailTime time={message.date} />
				</div>
				{from && sender ?
					<div class={style.fromAddressList}>
						<AddressList
							type="from"
							addresses={sender}
							wrap={false}
							bold
						/>
						{' '}
						on behalf of{' '}
						<AddressList
							type="from"
							addresses={from}
							wrap={false}
							bold
						/>
					</div>
					:
					<AddressList
						type="from"
						addresses={from}
						className={style.fromAddressList}
						showEmail
					/>
				}
				<AddressList className={style.toAddressList} type="to" addresses={to} />
				<AddressList className={style.toAddressList} type="cc" addresses={cc} />
				<div class={cx(style.date, style.hideMdUp)}>
					<EmailTime time={message.date} />
				</div>
				<div class={style.attachments}>
					{attachments &&
						attachments.map(attachment => (
							<Attachment attachmentGroup={attachments} attachment={attachment} />
						))}
				</div>

				{message.invitations &&
					message.invitations.map(invitation => (
						<Invitation invitation={invitation} message={message} />
					))}
			</div>
			<div class={style.body}>
				{!loading && showLoadImagesBanner && (
					<div class={style.trustImages}>
						<div>
							<Text id="mail.viewer.messageContainsExternalImages" />.  <NakedButton linkColor onClick={onTrustImages}><Text id="mail.viewer.clickToLoad" /></NakedButton>
						</div>
						<div>
							<Text id="mail.viewer.alwaysDisplayImagesFrom" /> <NakedButton linkColor onClick={callWith(onAddTrustedDomainOrAddress, fromDomain)}>{fromDomain}</NakedButton> <Text id="mail.viewer.or" /> <NakedButton linkColor onClick={callWith(onAddTrustedDomainOrAddress, from)}>{from}</NakedButton>
						</div>
					</div>
				)}

				<HtmlViewer
					class={style.bodyInner}
					html={html}
					scale={fit}
					mutateDom={isConversation && injectQuoteToggle}
				/>
			</div>
			<footer class={style.footer}>
				<div class={style.actions}>
					<button class={style.button} onClick={onReply}>
						<Icon name="mail-reply" class={style.icon} />
						<span class={style.text}><Text id="buttons.reply" /></span>
					</button>

					<button class={style.button} onClick={onReplyAll}>
						<Icon name="mail-reply-all" class={style.icon} />
						<span class={style.text}><Text id="buttons.replyToAll" /></span>
					</button>

					<button class={style.button} onClick={onForward}>
						<Icon name="mail-forward" class={style.icon} />
						<span class={style.text}><Text id="buttons.forward" /></span>
					</button>

					<ZimletSlot name="desktop-viewer-footer" message={message} />

					<button class={style.button} onClick={onMore}>
						<Icon name="ellipsis-h" class={style.icon} />
						<span class={style.text}><Text id="buttons.more" /></span>
					</button>
				</div>
			</footer>
			{(pending || imagesLoading) && <Spinner class={style.spinner} />}
		</div>
	);
}
