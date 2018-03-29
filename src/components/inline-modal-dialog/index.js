import { h } from 'preact';
import { Button, Icon, ClickOutsideDetector } from '@zimbra/blocks';
import { Text } from 'preact-i18n';
import noop from 'lodash-es/noop';
import cx from 'classnames';

import style from './style.less';

export default function InlineModalDialog({
	closeOnClickOutside=true,
	dialogClassName,
	wrapperClassName,
	innerClassName,
	title,
	actionLabel,
	cancelLabel,
	onAction,
	onClose,
	children,
	disablePrimary
}) {
	const actions = [
		<Button onClick={onAction} styleType="primary" disabled={disablePrimary}>
			<Text id={actionLabel || 'buttons.ok'}>{actionLabel}</Text>
		</Button>,
		<Button onClick={onClose}>
			<Text id={cancelLabel || 'buttons.cancel'}>{cancelLabel}</Text>
		</Button>
	];
	return (
		<div class={dialogClassName}>
			<div class={cx(style.wrapper, wrapperClassName)}>
				<ClickOutsideDetector onClickOutside={closeOnClickOutside ? onClose : noop}>
					<div class={cx(style.inner, innerClassName)}>
						<div class={cx(style.toolbar, style.hideSmUp)}>
							{actions}
						</div>
						<div class={style.header}>
							{typeof title === 'string'
								? <Text id={title}>{title}</Text>
								: title
							}
							<Icon class={style.close} name="close" onClick={onClose} />
						</div>
						<div class={style.contentWrapper}>
							{children}
						</div>
						<div class={cx(style.footer, style.hideXsDown)}>
							{actions}
						</div>
					</div>
				</ClickOutsideDetector>
			</div>
		</div>
	);
}
