import { h } from 'preact';
import cx from 'classnames';
import s from './style.less';

const AlignedLabel = ({ width, align = 'right', ...rest }) => (
	<label
		{...rest}
		class={cx(s.alignedLabel, s[align], rest.class)}
		style={{
			width,
			minWidth: width
		}}
	/>
);

AlignedLabel.defaultProps = {
	width: '110px'
};

export default AlignedLabel;
