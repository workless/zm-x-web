import { h } from 'preact';
import PropTypes from 'prop-types';
import cx from 'classnames';

import { Icon } from '@zimbra/blocks';

import s from './style.less';

const StarIcon = ({ class: cls, icon, starred, size, ...rest }) => (
	<Icon
		{...rest}
		size={size || 'sm'}
		aria-checked={starred ? 'true' : 'false'}
		aria-label="Starred"
		class={cx(s.star, starred && s.starred, cls)}
		name="star"
		role="checkbox"
	/>
);

StarIcon.propTypes = {
	class: PropTypes.string
};

export default StarIcon;
