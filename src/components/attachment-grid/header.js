import { h } from 'preact';
import NakedButton from '../naked-button';
import { Icon } from '@zimbra/blocks';

import cx from 'classnames';
import s from './style.less';

export default function AttachmentGridHeader({ attachments, removable, onViewAll, onDownloadAll, onRemoveAll }) {
	if (removable && attachments.length > 0) {
		return (
			<div class={cx(s.hideBelowXs, s.buttonsContainer)}>
				<div>
					{attachments.length} Attachments
				</div>
				<div class={s.buttonDivider}>
					<NakedButton
						onClick={onRemoveAll}
						class={s.button}
					>
					Remove All
					</NakedButton>
				</div>
			</div>
		);
	}
	 else if (!removable) {
		return (
			<div class={cx(s.hideBelowXs, s.buttonsContainer)}>
				<div>
					{attachments.length} Attachments
				</div>
				<div class={s.buttonDivider}>
					<NakedButton
						onClick={onViewAll}
						class={s.button}
					>
						View All
					</NakedButton>
				</div>
				<div class={cx(s.buttonDivider, s.lastButtonDivider)}>
					<NakedButton
						onClick={onDownloadAll}
						class={s.button}
					>
						Download All <Icon size="sm" name="angle-down" class={s.angleIcon} />
					</NakedButton>
				</div>
			</div>
		);
	}
}