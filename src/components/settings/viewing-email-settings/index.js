import { h } from 'preact';
import { Text } from 'preact-i18n';

import cx from 'classnames';
import style from '../style';

export default function ViewingEmailSettings({ value, onFieldChange }) {
	return (
		<div>
			<div class={cx(style.sectionTitle, style.hideMdUp)}>
				<Text id="settings.viewingEmail.title" />
			</div>
			<div class={style.subsection}>
				<div class={style.subsectionTitle}>
					<Text id="settings.viewingEmail.messageListsSubsection">
						When viewing message lists
					</Text>
				</div>
				<div class={style.subsectionBody}>
					<ul class={style.list}>
						<li>
							<label>
								<input
									onChange={onFieldChange('messageListsEnableConversations')}
									type="checkbox"
									checked={value.messageListsEnableConversations}
								/>
								<Text id="settings.viewingEmail.enableConversationsLabel">
									Enable conversations
								</Text>
							</label>
						</li>
						<li>
							<label>
								<input
									onChange={onFieldChange('messageListsShowSnippets')}
									type="checkbox"
									checked={value.messageListsShowSnippets}
								/>
								<Text id="settings.viewingEmail.showSnippetsLabel">
									Show snippets
								</Text>
							</label>
						</li>
						<li>
							<label>
								<input
									onChange={onFieldChange('messageListsGroupByList')}
									type="checkbox"
									checked={value.messageListsGroupByList}
								/>
								<Text id="settings.viewingEmail.groupByListLabel">
									Group by date
								</Text>
							</label>
						</li>
					</ul>
				</div>
			</div>
			<div class={cx(style.subsection, style.hideXsDown)}>
				<div class={style.subsectionTitle}>
					<Text id="settings.viewingEmail.multitaskingSubsection">
						Multitasking
					</Text>
				</div>
				<div class={style.subsectionBody}>
					<ul class={style.list}>
						<li>
							<label>
								<input
									type="radio"
									name="multitasking"
									value="tabs"
									onChange={onFieldChange('multitasking')}
									checked={value.multitasking === 'tabs'}
								/>
								<Text id="settings.viewingEmail.tabsLabel">
									Tabs
								</Text>
							</label>
						</li>
						<li>
							<label>
								<input
									type="radio"
									name="multitasking"
									value="recent"
									onChange={onFieldChange('multitasking')}
									checked={value.multitasking === 'recent'}
								/>
								<Text id="settings.viewingEmail.recentLabel">
									Recent
								</Text>
							</label>
						</li>
					</ul>
				</div>
			</div>
			<div class={cx(style.subsection, style.hideXsDown)}>
				<div class={cx(style.subsectionTitle, style.forSelect)}>
					<Text id="settings.viewingEmail.previewPaneSubsection">
						Preview pane
					</Text>
				</div>
				<div class={style.subsectionBody}>
					<select
						onChange={onFieldChange('previewPane')}
						class={style.select}
						value={value.previewPane}
					>
						<option value="right">
							<Text id="settings.viewingEmail.previewPaneOption.right">
									Preview pane on the right
							</Text>
						</option>
						<option value="bottom">
							<Text id="settings.viewingEmail.previewPaneOption.bottom">
									Preview pane on the bottom
							</Text>
						</option>
						<option value="off">
							<Text id="settings.viewingEmail.previewPaneOption.none">
									None
							</Text>
						</option>
					</select>
				</div>
			</div>
			<div class={cx(style.subsection, style.hideXsDown)}>
				<div class={cx(style.subsectionTitle, style.forSelect)}>
					<Text id="settings.viewingEmail.messageListDensitySubsection">
						Message list density
					</Text>
				</div>
				<div class={style.subsectionBody}>
					<select
						onChange={onFieldChange('messageListDensity')}
						class={style.select}
						value={value.messageListDensity}
					>
						<option value="slim">
							<Text id="settings.viewingEmail.messageListDensityOption.slim">
								Slim
							</Text>
						</option>
						<option value="regular">
							<Text id="settings.viewingEmail.messageListDensityOption.regular">
								Regular
							</Text>
						</option>
						<option value="relaxed">
							<Text id="settings.viewingEmail.messageListDenistyOption.relaxed">
								Relaxed
							</Text>
						</option>
					</select>
				</div>
			</div>
			<div class={style.subsection}>
				<div class={cx(style.subsectionTitle, style.forSelect)}>
					<Text id="settings.viewingEmail.markAsReadSubsection">
						Mark as read
					</Text>
				</div>
				<div class={style.subsectionBody}>
					<select
						onChange={onFieldChange('markAsRead')}
						class={style.select}
						value={value.markAsRead}
					>
						<option value="0">
							<Text id="settings.viewingEmail.markAsReadOption.immediately">
								Immediately
							</Text>
						</option>
						<option value="2">
							<Text id="settings.viewingEmail.markAsReadOption.2seconds">
								After 2 seconds
							</Text>
						</option>
						<option value="5">
							<Text id="settings.viewingEmail.markAsReadOption.5seconds">
								After 5 seconds
							</Text>
						</option>
						<option value="-1">
							<Text id="settings.viewingEmail.markAsReadOptions.never">
								Never
							</Text>
						</option>
					</select>
				</div>
			</div>
			<div class={style.subsection}>
				<div class={cx(style.subsectionTitle, style.forSelect)}>
					<Text id="settings.viewingEmail.afterMovingMessageSubsection">
						After moving message
					</Text>
				</div>
				<div class={style.subsectionBody}>
					<select
						onChange={onFieldChange('afterMoveMessage')}
						class={style.select}
						value={value.afterMoveMessage}
					>
						<option value="adaptive">
							<Text id="settings.viewingEmail.afterMovingMessageOption.back">
								Go back to the original folder
							</Text>
						</option>
						<option value="previous">
							<Text id="settings.viewingEmail.afterMovingMessageOption.previous">
								Show previous email message
							</Text>
						</option>
						<option value="next">
							<Text id="settings.viewingEmail.afterMovingMessageOption.next">
								Show next email message
							</Text>
						</option>
					</select>
				</div>
			</div>
			<div class={style.subsection}>
				<div class={style.subsectionTitle}>
					<span class={style.hideXsDown}>
						<Text id="settings.viewingEmail.desktopNotificationsSubsection">
							Desktop notifications
						</Text>
					</span>
					<span class={style.hideMdUp}>
						<Text id="settings.viewingEmail.mobileNotificationsSubsection">
							Notifications
						</Text>
					</span>
				</div>
				<div class={style.subsectionBody}>
					<label>
						<input
							onChange={onFieldChange('enableDesktopNotifications')}
							type="checkbox"
							checked={value.enableDesktopNotifications}
						/>
						<span class={style.hideXsDown}>
							<Text id="settings.viewingEmail.desktopNotificationsLabel">
								Enable desktop notifications
							</Text>
						</span>
						<span class={style.hideSmUp}>
							<Text id="settings.viewingEmail.mobileNotificationsLabel">
								Enable notifications
							</Text>
						</span>
					</label>
				</div>
			</div>
			<div class={cx(style.subsection, style.hideXsDown)}>
				<div class={style.subsectionTitle}>
					<Text id="setings.viewingEmail.mailVersionSubsection">
						Mail version
					</Text>
				</div>
				<div class={style.subsectionBody}>
					<ul class={style.list}>
						<li>
							<label>
								<input
									type="radio"
									name="mailVersion"
									value="advanced"
									checked={value.mailVersion === 'advanced'}
									onChange={onFieldChange('mailVersion')}
								/>
								<strong><Text id="settings.viewingEmail.fullFeatured">Full featured</Text></strong>
								<Text id="settings.viewingEmail.advancedLabel">
									&nbsp;(recommended) - View photo slideshows, drag and drop attachments, personalize your theme, and more.
								</Text>
							</label>
						</li>
						<li>
							<label>
								<input
									type="radio"
									name="mailVersion"
									value="standard"
									checked={value.mailVersion === 'standard'}
									onChange={onFieldChange('mailVersion')}
								/>
								<strong><Text id="settings.viewingEmail.mailVersionBasicLabel">Basic</Text></strong>
							</label>
						</li>
					</ul>
				</div>
			</div>
		</div>
	);
}
