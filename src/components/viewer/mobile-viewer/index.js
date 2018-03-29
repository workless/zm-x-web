import { h } from 'preact';

import { Text } from 'preact-i18n';
import { Icon, Spinner } from '@zimbra/blocks';
import Invitation from '../invitation';
import HtmlViewer from '../../html-viewer';
import NakedButton from '../../naked-button';
import UnreadControl from '../../unread-control';
import StarIcon from '../../star-icon';
import AddressList from '../../address-list';
import EmailTime from '../../email-time';
import ActionMenuMailReply from '../../action-menu-mail-reply';
import AttachmentGrid from '../../attachment-grid';

import { callWith } from '../../../lib/util';
import injectQuoteToggle from '../../../lib/quote-toggle';

import style from './style.less';
import cx from 'classnames';

export default function MobileViewer({
	isUnread,
	isStarred,
	isConversation,
	onAddTrustedDomainOrAddress,
	onHeaderClicked,
	onStarClicked,
	onReply,
	onReplyAll,
	onForward,
	onTrustImages,
	onReadStatusClicked,
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
	imagesLoading,
	showLoadImagesBanner,
	pending,
	matchesScreenSm,
	html,
	fit
}) {
	return (
		<div class={style.viewerContent}>
			<div class={style.headers} onClick={onHeaderClicked}>
				<div class={style.header}>
					{!disableReadIcon && (
						<UnreadControl
							class={cx(style.readStatus, style.hideXsDown)}
							onChange={onReadStatusClicked}
							value={isUnread}
							visible
						/>
					)}
					<div class={style.addressColumn}>
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
								showEmail={matchesScreenSm}
								className={style.fromAddressList}
							/>
						}
						<AddressList className={style.toAddressList} type="to" addresses={to} />
						<AddressList className={style.toAddressList} type="cc" addresses={cc} />
						<div class={cx(style.date, style.hideMdUp)}>
							<EmailTime time={message.date} />
						</div>
					</div>
					<div class={style.controls}>
						<div>
							<ActionMenuMailReply
								onReply={onReply}
								onReplyAll={onReplyAll}
								onForward={onForward}
								actionButtonClass={style.replyActionButton}
								popoverClass={style.replyPopover}
								iconClass={style.replyActionButtonIconClass}
							/>
							{!disableStarIcon && (
								<StarIcon
									class={cx(style.star, style.hideBelowXs)}
									onClick={onStarClicked}
									starred={isStarred}
									size="md"
								/>
							)}
						</div>
						{attachments && (
							<div>
								<span class={style.attachmentLabel}>
									{attachments.length}
								</span>
								<Icon name="paperclip" size="sm" />
							</div>
						)}
					</div>
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
			{attachments && (
				<div class={style.attachments}>
					<AttachmentGrid
						attachments={attachments}
					/>
				</div>
			)}
			<footer class={cx(style.footer, style.hideSmUp)}>
				<div class={style.actions}>
					<button class={style.button} onClick={onReply}>
						<Icon name="mail-reply" class={style.icon} />
						<span class={style.text}><Text id="buttons.reply" /></span>
					</button>

					{to.length > 1 && (
						<button class={style.button} onClick={onReplyAll}>
							<Icon name="mail-reply-all" class={style.icon} />
							<span class={style.text}><Text id="buttons.replyToAll" /></span>
						</button>
					)}

					<button class={style.button} onClick={onForward}>
						<Icon name="mail-forward" class={style.icon} />
						<span class={style.text}><Text id="buttons.forward" /></span>
					</button>
				</div>
			</footer>
			{(pending || imagesLoading) && <Spinner class={style.spinner} />}
		</div>
	);
}
