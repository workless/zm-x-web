import { h } from 'preact';
import cx from 'classnames';
import style from './style';

const USE_FONTAWESOME_FALLBACK = [
	'refresh',
	'times',
	'list',
	'angle-right',
	'angle-left',
	'angle-down',
	'angle-up',
	'file-image-o',
	'file-audio-o',
	'file-video-o',
	'file-text-o',
	'file-o',
	'user-circle-o',
	'circle',
	'eye',
	'exclamation-triangle'
];

export default function Icon({ name, size = 'md', ...props }) {
	if (name && USE_FONTAWESOME_FALLBACK.indexOf(name) !== -1) {
		name = 'fa:' + name;
	}

	// If `name` is preceded by `fa:`, treat this Icon like a FontAwesome Icon
	if (name && name.indexOf('fa:') === 0) {
		return <FontAwesome name={name.substr(3)} size={size} {...props} />;
	}

	return (
		<span
			role="img"
			{...props}
			class={cx('zimbra-icon', name && `zimbra-icon-${name}`, style[size], props.class, props.className)}
			tabIndex={props.onClick ? '0' : false}
		/>
	);
}

export function FontAwesome({ name, size = 'md', ...props }) {
	return (
		<span
			role="img"
			{...props}
			class={cx('fa', name && `fa-${name}`, style[size], props.class, props.className)}
			tabIndex={props.onClick ? '0' : false}
		/>
	);
}
