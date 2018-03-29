import { h } from 'preact';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { compose } from 'recompose';

import ActionMenuMailSort from '../action-menu-mail-sort';
import withMediaQuery from '../../enhancers/with-media-query';
import { minWidth, screenSmMax } from '../../constants/breakpoints';

import s from './style.less';

const MailListHeader = ({
	selected,
	allSelected,
	currentFolder,
	sortBy,
	onToggleSelectAll,
	onSort,
	onGroupByChange,
	children,
	wide,
	matchesMediaQuery,
	...rest
}) => {
	const showSelected = !matchesMediaQuery && currentFolder && selected.size > 0;
	const showUnread = !matchesMediaQuery && currentFolder && !showSelected;
	return (
		<div {...rest} class={cx(s.mailListHeader, wide && s.wide, rest.class)}>
			<div class={s.leftContainer}>
				<input
					type="checkbox"
					class={s.checkbox}
					indeterminate={selected.length > 0 && !allSelected}
					checked={allSelected}
					onChange={onToggleSelectAll}
				/>
				{showUnread && (
					<div class={s.title}>
						{currentFolder.name}
						{currentFolder.unread > 0 && (
							<span class={s.count}>
								{currentFolder.unread}
							</span>
						)}
					</div>
				)}
				{showSelected && (
					<div class={s.title}>
						Selected
						<span class={s.count}>
							{selected.size}
						</span>
					</div>
				)}
			</div>
			{children}
			<ActionMenuMailSort sortBy={sortBy} onSort={onSort} />
		</div>
	);
};

MailListHeader.defaultProps = {
	allSelected: false
};

MailListHeader.propTypes = {
	selected: PropTypes.array.isRequired,
	allSelected: PropTypes.bool,
	onToggleSelectAll: PropTypes.func.isRequired
};

export default compose(
	withMediaQuery(minWidth(screenSmMax))
)(MailListHeader);
