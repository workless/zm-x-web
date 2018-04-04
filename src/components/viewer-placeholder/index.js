import { h } from 'preact';
import { Icon } from '@zimbra/blocks';
import PropTypes from 'prop-types';

import s from './style.less';

const ViewerPlaceholder = ({ numSelected }) => (
	<div class={s.placeholder}>
		<Icon name="envelope" />
		{numSelected > 0 &&
			<div class={s.numOverlay}>
				{numSelected}
			</div>
		}
	</div>
);

ViewerPlaceholder.defaultProps = {
	numSelected: 0
};


ViewerPlaceholder.propTypes = {
	numSelected: PropTypes.number
};

export default ViewerPlaceholder;
