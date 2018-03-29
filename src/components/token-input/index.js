import { h, Component } from 'preact';
import cx from 'classnames';
import style from './style';

const KEY_ENTER = 13;
const KEY_ESC = 27;
const KEY_SELECT = 93;
const KEY_F10 = 121;
const KEY_BACKSPACE = 8;
const KEY_DELETE = 46;
const KEY_LEFT = 37;
const KEY_RIGHT = 39;
const KEY_UP = 38;
const KEY_DOWN = 40;
const KEY_SEMICOLON = 186;
const KEY_COMMA = 188;

const memoize = (fn, mem = {}) => key =>
	key in mem ? mem[key] : (mem[key] = fn(key));

export default class TokenInput extends Component {
	state = {
		tokens: [],
		input: '',
		selected: null,
		verticalSelectedIndex: null,
		activateSelected: false,
		focussed: false
	};

	inputRef = c => {
		this.input = c;
	};

	autoSuggestRef = c => {
		this.autoSuggest = c;
	};

	onChange = e => {
		let input = e.target.value,
			tokens = this.state.tokens,
			{ onChange } = this.props;
		this.setState({ input });
		if (input) {
			tokens = tokens.concat(input);
		}
		if (onChange) onChange({ value: tokens });
	};

	acceptSuggestion = suggestion => {
		this.addValue(suggestion);
	};

	setVerticalSelection = index => {
		if (index && typeof index === 'object' && index.value) {
			this.setAutoSuggestValue(index.value);
			index = index.index;
		}
		if (index === -1) index = null;
		this.setState({ verticalSelectedIndex: index });
	};

	setAutoSuggestValue = value => {
		this.autoSuggestValue = value;
	};

	add = () => {
		let { input, verticalSelectedIndex } = this.state;
		if (verticalSelectedIndex != null) {
			return this.setState({ commitSelectedIndex: verticalSelectedIndex });
		}

		this.addValue(input);
	};

	addValue(value) {
		if (!value) return;
		let tokens = this.state.tokens.concat(this.createValue(value));
		this.setState({
			input: '',
			commitSelectedIndex: null,
			verticalSelectedIndex: null,
			tokens
		});
		if (this.props.onChange) this.props.onChange({ value: tokens });
	}

	remove = tokenOrIndex => {
		let tokens = this.state.tokens.slice();
		if (typeof tokenOrIndex !== 'number') {
			tokenOrIndex = tokens.indexOf(tokenOrIndex);
		}
		if (~tokenOrIndex) tokens.splice(tokenOrIndex, 1);
		this.setState({ tokens });
		if (this.props.onChange) this.props.onChange({ value: tokens });
	};

	createValue(value) {
		if (this.props.createValue) return this.props.createValue(value);
		return { value };
	}

	getValue(value) {
		return this.props.renderValue ? this.props.renderValue(value) : value.value;
	}

	handleKey = e => {
		let {
			selected,
			tokens,
			verticalSelectedIndex,
			activateSelected
		} = this.state;
		let selectionOffset =
			this.input && this.input.selectionStart === this.input.selectionEnd
				? this.input.selectionStart
				: -1;

		switch (e.keyCode) {
			case KEY_ENTER:
			case KEY_COMMA:
			case KEY_SEMICOLON:
				this.add();
				break;
			case KEY_ESC:
				if (selected != null) this.setState({ selected: null });
				else this.setState({ input: '' });
				// de-activate selection if it was activated:
				if (selected != null && activateSelected)
					this.setState({ activateSelected: false });
				break;
			case KEY_SELECT:
			case KEY_F10:
				if (selected != null) this.setState({ activateSelected: true });
				else return;
				break;
			case KEY_BACKSPACE:
				if (selected == null) {
					// special case: backspace at leftmost cursor position selects the last tag. hitting it again deletes it.
					if (selectionOffset === 0 && tokens.length) this.moveSelection(-1);
					return;
				}
				this.remove(selected);
				this.moveSelection(-1);
				break;
			case KEY_DELETE:
				if (selected == null) return;
				this.remove(selected);
				break;
			case KEY_LEFT:
				if (selectionOffset) return;
				this.moveSelection(-1);
				break;
			case KEY_RIGHT:
				if (selectionOffset || selected == null) return;
				this.moveSelection(1);
				break;
			case KEY_UP:
				if (verticalSelectedIndex == null) return;
				if (!verticalSelectedIndex--) verticalSelectedIndex = null;
				this.setState({ verticalSelectedIndex });
				break;
			case KEY_DOWN:
				if (verticalSelectedIndex == null) verticalSelectedIndex = -1;
				verticalSelectedIndex++;
				this.setState({ verticalSelectedIndex });
				break;
			default:
				if (selected != null) this.setState({ selected: null });
				if (activateSelected) this.setState({ activateSelected: false });
				return;
		}
		e.preventDefault();
		return false;
	};

	moveSelection(offset) {
		let { selected, tokens } = this.state;
		if (selected == null) {
			if (offset === -1) selected = tokens.length - 1;
		}
		else {
			selected = Math.max(0, selected + offset);
			if (selected === tokens.length) selected = null;
		}
		if (selected !== this.state.selected) {
			this.setState({
				selected,
				activateSelected: false,
				verticalSelectedIndex: null
			});
		}
	}

	handleFocus = () => {
		if (!this.state.focussed) {
			this.setState({ focussed: true });
		}
		if (!this.pause && this.state.selected != null) {
			this.setState({ selected: null, activateSelected: false });
		}
	};

	handleBlur = () => {
		if (this.state.focussed) {
			this.add();
			// a short delay after adding (to allow for async setState if triggered).
			setTimeout(this.reset);
		}
	};

	reset = () => {
		this.setState({
			input: '',
			commitSelectedIndex: null,
			focussed: false,
			selected: null,
			activateSelected: false,
			verticalSelectedIndex: null
		});
	};

	refocus = e => {
		if (!this.state.focussed) {
			this.pause = true;
			this.input.focus();
			this.pause = false;
			if (e) {
				e.preventDefault();
				e.stopPropagation();
				return false;
			}
		}
	};

	handleInputClick = () => {
		this.handleFocus();
	};

	selectIndex = memoize(index => selected => {
		this.setState({
			selected: selected !== false && index,
			activateSelected: false
		});
		return false;
	});

	activateIndex = memoize(index => activated => {
		if (activated === false) this.setState({ activateSelected: false });
		else this.setState({ selected: index, activateSelected: true });
	});

	getRenderTokenProps = (token, index) => {
		const value = this.getValue(token);
		return {
			token,
			index,
			value,
			activated:
				this.state.selected === index && this.state.activateSelected === true,
			activate: this.activateIndex(index),
			selected: this.state.selected === index,
			onClick: this.selectIndex(index),
			select: this.selectIndex(index),
			invalid: this.props.validateToken
				? !this.props.validateToken(value, token)
				: false
		};
	};

	update = props => {
		let tokens = props.value;
		if (typeof tokens === 'string') {
			tokens = tokens
				.split(/\s*,\s*/)
				.map(this.props.createValue || (value => ({ value })));
		}
		let input = '';
		if (typeof tokens[tokens.length - 1] === 'string') {
			tokens = tokens.slice();
			input = tokens.pop();
		}
		this.setState({ tokens, input });
	};

	componentDidMount() {
		this.update(this.props);
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.value !== this.props.value) {
			this.update(nextProps);
		}
	}

	render(
		{
			renderValue,
			renderAutoSuggest,
			renderToken,
			createValue,
			class: c,
			onChange,
			onInput,
			value,
			children,
			placeholder,
			wasPreviouslySelected,
			previouslySelectedLabel,
			...props
		},
		{ input, tokens, verticalSelectedIndex, commitSelectedIndex, focussed }
	) {
		renderToken =
			renderToken ||
			(typeof children[0] === 'function' && children[0]) ||
			renderDefaultToken;

		return (
			<div
				class={cx(style.tokenInput, focussed && style.focussed, c)}
				focussed={focussed}
				onClick={this.refocus}
				onMouseDown={this.refocus}
			>
				<div class={style.tokens}>
					{tokens.map(this.getRenderTokenProps).map(renderToken)}
				</div>

				<div class={style.inputWrap}>
					<input
						class={style.input}
						{...props}
						ref={this.inputRef}
						value={input}
						onInput={this.onChange}
						onClick={this.handleInputClick}
						onFocus={this.handleFocus}
						onBlur={this.handleBlur}
						onKeyDown={this.handleKey}
						placeholder={tokens.length === 0 && placeholder}
					/>

					{focussed &&
						renderAutoSuggest &&
						h(renderAutoSuggest, {
							tokens,
							wasPreviouslySelected,
							previouslySelectedLabel,
							commitSelectedIndex,
							value: input,
							selectedIndex: verticalSelectedIndex,
							onSelectionChange: this.setVerticalSelection,
							onSelect: this.acceptSuggestion,
							onRemove: this.remove
						})}
				</div>
			</div>
		);
	}
}

const renderDefaultToken = ({ value, selected, select }) => (
	<button
		style={selected ? 'background:rgba(0,0,0,0.2);' : ''}
		onClick={select}
	>
		{value}
	</button>
);
