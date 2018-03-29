import { h } from 'preact';
import s from './style.less';
import Fill from '../fill';

const SkeletonWithSidebar = () => (
	<Fill>
		<div class={s.sidebar} />
	</Fill>
);

export default SkeletonWithSidebar;
