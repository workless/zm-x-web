import { h } from 'preact';
import cx from 'classnames';
import tail from 'lodash-es/tail';
import toPairs from 'lodash-es/toPairs';
import colors from '../../constants/colors';
import style from './style';

const ColorPicker = ({ value, onChange, ...rest }) => (
	<div class={cx(style.colorPicker, rest.class)}>
		{tail(toPairs(colors)).map(([v, color]) => (
			<div class={style.colorInputContainer}>
				<div
					class={style.colorInput}
					style={{ backgroundColor: color }}
					// eslint-disable-next-line react/jsx-no-bind
					onClick={() => onChange(v, color)}
				/>
				{value && value.toString() === v.toString() && (
					<div class={style.colorInputHighlight} />
				)}
			</div>
		))}
	</div>
);

export default ColorPicker;
