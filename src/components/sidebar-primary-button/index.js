import { h } from 'preact';
import s from './style.less';

const SidebarPrimaryButton = ({ onClick, text }) => (
	<button className={s.button} onClick={onClick}>
		{text}
	</button>
);

export default SidebarPrimaryButton;
