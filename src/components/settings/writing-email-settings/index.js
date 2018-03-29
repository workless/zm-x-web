import { h } from 'preact';
import { Text } from 'preact-i18n';
import { Button } from '@zimbra/blocks';
import cx from 'classnames';
import {
	FONT_FAMILY,
	FONT_SIZE,
	FONT_FAMILY_LABEL_TO_DISPLAY,
	FONT_SIZE_LABEL_TO_DISPLAY
} from '../../../constants/fonts';
import style from '../style';

export default function WritingEmailSettings({ value, onFieldChange }) {
	return (
		<div>
			<div class={cx(style.sectionTitle, style.hideMdUp)}>
				<Text id="settings.writingEmail.title" />
			</div>
			<div class={style.subsection}>
				<div class={style.subsectionTitle}>
					<Text id="settings.writingEmail.whenSendingMessageSubsection">
						When sending messages
					</Text>
				</div>
				<div class={style.subsectionBody}>
					<ul class={style.list}>
						<li>
							<label>
								<input
									onChange={onFieldChange('whenSendingMessageAddToContacts')}
									type="checkbox"
									checked={value.whenSendingMessageAddToContacts}
								/>
								<Text id="setings.writingEmail.addToContactsLabel">
									Automatically add new recipients to Contacts
								</Text>
							</label>
						</li>
						<li>
							<label>
								<input
									type="checkbox"
									onChange={onFieldChange('whenSendingMessageGenerateLinkPreviews')}
									checked={value.whenSendingMessageGenerateLinkPreviews}
								/>
								<Text id="settings.writingEmail.generateLinkPreview">
									Automatically generate a preview of links
								</Text>
							</label>
						</li>
					</ul>
				</div>
			</div>
			<div class={cx(style.subsection, style.hideXsDown)}>
				<div class={style.subsectionTitle}>
					<Text id="settings.writingEmail.undoSendSubsection">
						Undo send
					</Text>
				</div>
				<div class={style.subsectionBody}>
					<label>
						<input
							type="checkbox"
							checked={value.undoSendEnabled}
							onChange={onFieldChange('undoSendEnabled')}
						/>
						<Text id="settings.writingEmail.enableUndoSend">
									Enable undo send
						</Text>
					</label>
				</div>
			</div>
			<div class={cx(style.subsection, style.hideXsDown)}>
				<div class={cx(style.subsectionTitle, style.forSelect)}>
					<Text id="settings.writingEmail.richTextFontSubsection">
						Default rich text font
					</Text>
				</div>
				<div class={style.subsectionBody}>
					<select
						class={cx(style.select, style.half)}
						value={value.defaultRichTextFont}
						onChange={onFieldChange('defaultRichTextFont')}
					>
						{FONT_FAMILY.map(fontFamily => (
							<option value={fontFamily.value}>
								{FONT_FAMILY_LABEL_TO_DISPLAY[fontFamily.label]}
							</option>
						))}
					</select>
					<select
						class={cx(style.select, style.half)}
						value={value.defaultRichTextSize}
						onChange={onFieldChange('defaultRichTextSize')}
					>
						{FONT_SIZE.map(fontSize => (
							<option value={fontSize.value}>
								{FONT_SIZE_LABEL_TO_DISPLAY[fontSize.label]}
							</option>
						))}
					</select>
					<div class={style.richTextPreview}>
						<span>Sample</span>
					</div>
				</div>
			</div>
			<div class={style.subsection}>
				<div class={cx(style.subsectionTitle, style.forSelect)}>
					<Text id="settings.writingEmail.defaultSendingAccountSubsection">
						Default sending account
					</Text>
				</div>
				<div class={style.subsectionBody}>
					<select class={style.select} disabled>
						<option>Primary (johndoe@example.com)</option>
					</select>
				</div>
			</div>
			<div class={style.subsection}>
				<div class={cx(style.subsectionTitle, style.forSelect)}>
					<Text id="settings.writingEmail.sendOnlyAddressSubsection">
						Add send only address
					</Text>
				</div>
				<div class={style.subsectionBody}>
					<div class={style.inputGroup}>
						<input type="text" class={style.textInput} disabled /> <Button>Verify</Button>
					</div>
					<Text id="settings.writingEmail.editSignature">
						Note: To edit your signature, go to Accounts.
					</Text>
				</div>
			</div>
		</div>
	);
}
