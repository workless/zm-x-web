import { h } from 'preact';
import cx from 'classnames';
import s from './style.less';

const ModalToast = ({ error, children }) => (
	<div class={cx(s.modalToast, error && s.error)}>{children}</div>
);

export default ModalToast;
