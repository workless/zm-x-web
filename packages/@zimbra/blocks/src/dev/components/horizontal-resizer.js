import { h, Component } from 'preact';

export default class HorizontalResizer extends Component {
	onDown = e => {
		this.down = true;
		addEventListener('mousemove', this.onMove);
		addEventListener('mouseup', this.onUp);
		return e.preventDefault(), false;
	};

	onMove = e => {
		if (!this.start) {
			this.start = {
				pageX: e.pageX,
				pageY: e.pageY,
				width: this.state.width || this.base.offsetWidth
			};
		}
		let dx = e.pageX - this.start.pageX,
			maxWidth = this.props['max-width'] || this.props.maxWidth,
			minWidth = this.props['min-width'] || this.props.minWidth || 0,
			width = Math.max(+minWidth, this.start.width + dx);
		if (maxWidth) width = Math.min(width, +maxWidth);
		this.setState({ width });
	};

	onUp = () => {
		this.down = this.start = null;
		removeEventListener('mousemove', this.onMove);
		removeEventListener('mouseup', this.onUp);
	};

	render({ children, ...props }, { width='' }) {
		return (
			<div {...props} style={{ position: 'relative', overflow: 'visible', width }}>
				{children}
				<div onMouseDown={this.onDown} style="position:absolute; right:-7px; top:0; width:7px; height:100%; background:#CCC; z-index:999; cursor:ew-resize;">
					<span style="position:absolute; top:50%; left:0; margin-top:-.5em; font-size:30px; color:#777; text-shadow:0 1px 0 #FFF;">᠁</span>
				</div>
			</div>
		);
	}
}
