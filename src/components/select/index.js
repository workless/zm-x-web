import { h, Component } from 'preact';
import cx from 'classnames';
import s from './style.less';

export default class Select extends Component {
	state = {
		selectedLabel: '',
		isOpen: false
	};

	handleClick = () => {
		const nextIsOpen = !this.state.isOpen;
		this.setState({ isOpen: nextIsOpen });
	};

	updateLabel = () => {
		if (this.props.collapseLabel) {
			setTimeout(() => {
				this.setState({
					selectedLabel: this.select.options[this.select.selectedIndex].text
				});
			}, 0);
		}
	};

	componentDidMount() {
		this.updateLabel();
	}

	componentWillUpdate(nextProps) {
		if (nextProps.value !== this.props.value) {
			this.setState({ isOpen: false });
		}
	}

	componentDidUpdate(prevProps) {
		if (this.props.value !== prevProps.value) {
			this.updateLabel();
		}
	}

	render(
		{ noBorder, noArrow, bold, collapseLabel, fullWidth, class: cls, ...rest },
		{ isOpen, selectedLabel }
	) {
		return (
			<div class={cx(s.container, fullWidth && s.fullWidth)}>
				{collapseLabel && (
					<div
						class={cx(
							s.collapseLabel,
							collapseLabel && s.collapsable,
							noBorder && s.noBorder,
							noArrow && s.noArrow,
							bold && s.bold,
							isOpen && s.hidden,
							cls
						)}
						onClick={this.handleClick}
					>
						{selectedLabel}
					</div>
				)}
				<select
					{...rest}
					class={cx(
						s.select,
						collapseLabel && s.collapsable,
						collapseLabel && !isOpen && s.hidden,
						noBorder && s.noBorder,
						noArrow && s.noArrow,
						bold && s.bold,
						cls
					)}
					ref={ref => (this.select = ref)}
				/>
			</div>
		);
	}
}
