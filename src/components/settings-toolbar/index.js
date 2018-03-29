import { h } from 'preact';
import { Text } from 'preact-i18n';

import Toolbar from '../toolbar';
import ToolbarTitle from '../toolbar/title';
import ToolbarSVGActionButton from '../toolbar/svg-action-button';
import { callWith } from '../../lib/util';

import { Button } from '@zimbra/blocks';

import s from './style';

export default function SettingsToolbar({
	onClickSave,
	onClickCancel,
	onOpenItem,
	matchesScreenSm,
	activeId
}) {
	return (
		<Toolbar className={s.toolbar}>
			{matchesScreenSm
				? (
					<div class={s.container}>
						<div class={s.leftContainer}>
							<ToolbarTitle
								text="settings.modal.title"
							/>
						</div>
						<div class={s.rightContainer}>
							<Button
								styleType="primary"
								brand="primary"
								onClick={onClickSave}
							>
								<Text id="settings.modal.saveLabel" />
							</Button>
							<Button
								onClick={onClickCancel}
							>
								<Text id="settings.modal.cancelLabel" />
							</Button>
						</div>
					</div>
				)
				: activeId
					? (
						<div class={s.container}>
							<ToolbarSVGActionButton
								onClick={callWith(onOpenItem, null)}
								iconClass={s.arrowBackIcon}
							/>
							<div class={s.rightContainer}>
								<Button
									styleType="primary"
									brand="primary"
									onClick={onClickSave}
								>
									<Text id="settings.modal.saveLabel" />
								</Button>
								<Button
									onClick={onClickCancel}
								>
									<Text id="settings.modal.cancelLabel" />
								</Button>
							</div>
						</div>
					)
					: (
						<div class={s.container}>
							<div class={s.leftContainer}>
								<ToolbarTitle
									text="settings.modal.title"
								/>
							</div>
							<div class={s.rightContainer}>
								<ToolbarSVGActionButton
									onClick={callWith(onClickCancel)}
									iconClass={s.closeIcon}
								/>
							</div>
						</div>
					)}
		</Toolbar>
	);
}
