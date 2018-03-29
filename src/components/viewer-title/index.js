import { h } from 'preact';
import { Text } from 'preact-i18n';

import StarIcon from '../star-icon';
import UnreadControl from '../unread-control';

import cx from 'classnames';
import s from './style.less';

const ViewerTitle = ({
	subject,
	count,
	isFlagged,
	isUnread,
	onStar,
	onMarkRead,
	className,
	matchesScreenMd,
	matchesScreenSm
}) => {
	const showCount = count && count > 1;
	const countText = matchesScreenSm ? `(${count})` : count;
	return (
		<div class={cx(s.header, className)}>
			<StarIcon
				class={s.star}
				onClick={onStar}
				starred={isFlagged}
				size={matchesScreenMd ? 'sm' : 'md'}
			/>
			<UnreadControl
				class={cx(s.readStatus, s.hideXsDown)}
				onChange={onMarkRead}
				value={isUnread}
				visible
			/>
			<div class={s.headerText}>
				<span class={s.subject}>{subject || <Text id="mail.noSubject" />}</span>
				{showCount && (
					<span class={s.countText}>&nbsp;{countText}</span>
				)}
			</div>
		</div>
	);
};

export default ViewerTitle;
