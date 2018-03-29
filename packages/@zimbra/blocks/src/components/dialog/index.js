/* eslint-disable react/no-string-refs */
import { h, Component } from 'preact';
import ClickOutsideDetector from '../click-outside-detector';
import Portal from 'preact-portal';
import cx from 'classnames';
import style from './style';
import { TAB } from '../../constants/key-codes';
import focusable from 'focusable';
import linkRef from 'linkref';

export default function Dialog({ centered, onClickOutside, disableEscape, ...props }) {
	return (
		<ClickOutsideDetector onClickOutside={onClickOutside} disableEscape={disableEscape}>
			<div role="dialog" {...props} class={cx(style.dialog, centered && style.centered, props.class)} />
		</ClickOutsideDetector>
	);
}

export function FixedDialog(props) {
	return (
		<Portal into="body">
			<Dialog {...props} class={cx(style.fixed, props.class)} />
		</Portal>
	);
}

// TODO: Capture/prevent scrolling underneath Modal in iOS - Blocked by https://bugs.webkit.org/show_bug.cgi?id=153852
export class ModalDialog extends Component {
	static defaultProps = {
		centered: true // Unlike other dialogs, the ModalDialog is centered by default
	}

	handleKeyDown = (e) => {
		if (e.keyCode === TAB) {
			const focusableChildren = this.refs.container && this.refs.container.querySelectorAll(focusable);
			if (!focusableChildren || !focusableChildren.length) {
				e.preventDefault();
				return;
			}

			if (e.shiftKey) {
				if (e.target === focusableChildren[0]) {
					e.preventDefault();
					focusableChildren[focusableChildren.length - 1].focus();
				}
			}
			else if (e.target === focusableChildren[focusableChildren.length - 1]) {
				e.preventDefault();
				focusableChildren[0].focus();
			}
		}
	}

	componentWillMount() {
		document.body.classList.add(this.props.bodyClass || style.noScroll);
		addEventListener('keydown', this.handleKeyDown);
	}

	componentDidMount() {
		this.initialActiveElement = document.activeElement;
		let firstChild = this.refs.container && this.refs.container.querySelectorAll(focusable)[0];
		firstChild && firstChild.focus();
	}

	componentWillReceiveProps({ bodyClass }) {
		if (bodyClass !== this.props.bodyClass){
			document.body.classList.remove(this.props.bodyClass);
			bodyClass && document.body.classList.add(bodyClass);
		}
	}

	componentWillUnmount() {
		document.body.classList.remove(this.props.bodyClass || style.noScroll);
		removeEventListener('keydown', this.handleKeyDown);
		this.initialActiveElement && this.initialActiveElement.focus();
	}

	render({ overlayClass, into, disableOutsideClick, ...props }) {
		return (
			<Portal into={into || `body`}>
				<div ref={linkRef(this, 'container')} class={cx(style.overlay, overlayClass)}>
					{disableOutsideClick ? (
						<div role="dialog" {...props} class={cx(style.dialog, props.centered && style.centered, props.class)} />
					) : (
						<Dialog {...props} />
					)}
				</div>
			</Portal>
		);
	}
}
