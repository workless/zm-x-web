import { h } from 'preact';
import style from './style';
import cx from 'classnames';

export default function Scrim(props) {
	return <div {...props} class={cx(style.scrim, props.class)} />;
}

