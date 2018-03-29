import { h } from 'preact';
import style from './style';

export default function ScreenReaderText(props) {
	return (
		<div {...props} class={style['sr-only']} />
	);
}

