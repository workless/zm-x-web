import { h } from 'preact';

import s from './style.less';

const MailListFooter = ({ children }) => (
	<div class={s.footer}>{children}</div>
);

export default MailListFooter;
