import { h, Component } from 'preact';
import cx from 'classnames';
import style from './style';

export default class SmartSpinner extends Component {
	render({ block, ...props }) {
		const Child = block
				? BlockSpinner
				: Spinner;

		return <Child {...props} />;
	}
}

function Spinner(props) {
	return (
		<span {...props} class={cx(style.spinner, props.class)} />
	);
}

function BlockSpinner(props) {
	return (
		<div class={cx(style.blockSpinner, props.class)}>
			<div>
				<Spinner {...props} class={style.innerSpinner} />
			</div>
		</div>
	);
}
