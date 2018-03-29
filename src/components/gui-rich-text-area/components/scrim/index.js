import { h } from 'preact';
import { Scrim, Icon } from '@zimbra/blocks';
import Centered from '../../../centered';
import style from './style';
import cx from 'classnames';

function CenteredScrim({ children, ...props }) {
	return (
		<Scrim {...props} class={cx(style.scrim, props.class)}>
			<Centered>
				{children}
			</Centered>
		</Scrim>
	);
}

export function EmbedScrim(props) {
	return (
		<CenteredScrim {...props} class={cx(style.embed, props.class)}>
			<div><Icon name="file-image-o" /></div>
			Drag and drop inline images here
		</CenteredScrim>
	);
}

export function AttachScrim(props) {
	return (
		<CenteredScrim {...props} class={cx(style.attach, props.class)}>
			<Icon name="paperclip" />
			Drag and drop attachments here
		</CenteredScrim>
	);
}
