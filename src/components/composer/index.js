import { h } from 'preact';
import loadComposer from 'bundle-loader?name=composer&lazy!./composer';
import split from '../../lib/split-point';
import { Spinner } from '@zimbra/blocks';
import style from './loading.less';

export default split(loadComposer, 'composer', (
	<div class={style.loading}>
		<Spinner block class={style.spinner} />
	</div>
));
