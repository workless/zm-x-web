import { h, Component } from 'preact';
import cx from 'classnames';
import PropTypes from 'prop-types';

import s from './style.less';

export default class PreviewResizeControl extends Component {
	static propTypes = {
		onDragStart: PropTypes.func,
		onDrag: PropTypes.func,
		onDragEnd: PropTypes.func
	};

	state = {
		isMoving: false,
		start: 0
	};

	offset = (e) => (
		(e.pageY || e.clientY) - this.state.start
	)

	handleMouseDown = (e) => {
		if (e.button !== 0) { return; }

		const start = e.pageY || e.clientY || 0;
		this.setState({ start, isMoving: true });
		this.props.onDragStart(start);
		document.addEventListener('mousemove', this.handleMouseMove);
		document.addEventListener('mouseup', this.handleMouseUp);
	}

	handleMouseUp = (e) => {
		document.removeEventListener('mousemove', this.handleMouseMove);
		document.removeEventListener('mouseup', this.handleMouseUp);
		this.setState({ start: 0, isMoving: false });
		this.props.onDragEnd(this.offset(e));
	}

	handleMouseMove = (e) => {
		e.preventDefault();
		this.props.onDrag(this.offset(e));
	}

	render(props, { style, isMoving }) {
		return (
			<div
				class={cx(s.previewResizeControl, isMoving && s.moving, props.class)}
				onMouseDown={this.handleMouseDown}
				style={style}
			>
				<div class={s.visibleBar} />
				<div class={s.hiddenBar} />
			</div>
		);
	}
}
