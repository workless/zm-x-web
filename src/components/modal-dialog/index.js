import { h } from 'preact';
import {
	Button,
	Spinner,
	ModalDialog as ModalDialogBlock
} from '@zimbra/blocks';
import ErrorAlert from '../error-alert';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import style from './style';

function ModalDialog({
	scrollable = false,
	cancelButton = true,
	title,
	pending,
	buttons,
	actionLabel,
	cancelLabel,
	onAction,
	onClose,
	children,
	disablePrimary,
	disableEscape,
	disableOutsideClick,
	contentClass,
	supplementalFooter,
	error,
	...props
}) {
	return (
		<ModalDialogBlock
			overlayClass={style.backdrop}
			class={cx(style.dialog, scrollable && style.scrollable, props.class)}
			onClickOutside={onClose}
			disableEscape={disableEscape}
			disableOutsideClick={disableOutsideClick}
		>
			<div class={style.inner}>
				<header class={style.header}>
					<h2>
						{typeof title === 'string' ? (
							<Text id={title}>{title}</Text>
						) : (
							title
						)}
					</h2>
					<Button
						styleType="floating"
						class={style.actionButton}
						onClick={onClose}
					/>
				</header>

				<div class={cx(style.content, contentClass)} disabled={pending}>
					{error && <ErrorAlert>{error}</ErrorAlert>}
					{children}
				</div>

				<footer class={style.footer}>
					{buttons !== false && (buttons || (
						<Button
							styleType="primary"
							brand="primary"
							onClick={onAction}
							disabled={pending || disablePrimary}
						>
							<Text id={actionLabel}>{actionLabel}</Text>
						</Button>
					))}

					{cancelButton !== false && (
						<Button onClick={onClose}>
							<Text
								id={cancelLabel || (buttons && buttons.cancel) || 'buttons.cancel'}
							>
								{cancelLabel}
							</Text>
						</Button>
					)}

					{supplementalFooter}
				</footer>

				{pending && <Spinner class={style.spinner} />}
			</div>
		</ModalDialogBlock>
	);
}

ModalDialog.defaultProps = {
	actionLabel: 'buttons.ok'
};

export default ModalDialog;
