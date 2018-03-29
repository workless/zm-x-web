import { h } from 'preact';
import cx from 'classnames';
import s from './style.less';

const CloseButton = (props) => (
	<button aria-label="Close" {...props} class={cx(s.closeButton, props.class)} />
);

export default CloseButton;
