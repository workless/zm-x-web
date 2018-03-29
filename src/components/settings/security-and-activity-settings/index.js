import { h } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import style from '../style';

export default function SecurityAndActivitySettings({ value, onFieldChange }) {
	return (
		<div>
			<div class={cx(style.sectionTitle, style.hideMdUp)}>
				<Text id="settings.securityAndActivity.title" />
			</div>
			<div class={style.subsection}>
				<div class={cx(style.subsectionTitle, style.forSelect)}>
					<Text id="settings.securityAndActivity.showImagesSubsection">
						Show images in emails
					</Text>
				</div>
				<div class={style.subsectionBody}>
					<select
						onChange={onFieldChange('showImages')}
						class={style.select}
						value={value.showImages}
					>
						<option value="false">
							<Text id="settings.securityAndActivity.showImagesOption.never">
									Never by default
							</Text>
						</option>
						<option value="true">
							<Text id="settings.securityAndActivity.showImagesOption.always">
									Always, except in Junk folder
							</Text>
						</option>
					</select>
				</div>
			</div>
		</div>
	);
}
