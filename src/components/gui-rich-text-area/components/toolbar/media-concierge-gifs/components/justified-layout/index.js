import { h, Component } from 'preact';
import InfiniteScroll from '../../../../../../infinite-scroll';
import style from './style';
import cx from 'classnames';

export default class JustifiedLayout extends Component {
	renderRow = (row) => <div>{row}</div>

	render(props) {
		return (
			<InfiniteScroll
				renderRow={this.renderRow}
				rowHeight={112}
				{...props}
				class={cx(style.justified, props.class)}
			/>
		);
	}
}
