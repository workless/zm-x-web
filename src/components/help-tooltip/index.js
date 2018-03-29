import { h } from 'preact';
import { Tooltip, ClickOutsideDetector, Icon } from '@zimbra/blocks';
import style from './style.less';

export default function HelpTooltip({
	toggleTooltip,
	name,
	tooltipsVisibility,
	dismiss,
	children
}) {
	/* eslint-disable react/jsx-no-bind */
	return (
		<ClickOutsideDetector onClickOutside={this.dismiss}>
			<div class={style.tooltipContainer} onClick={() => toggleTooltip(name)}>
				<Tooltip class={style.tooltip} visible={tooltipsVisibility[name]}>
					{children}
					<Icon name="close" class={style.close} onClick={e => dismiss(e)} />
				</Tooltip>
			</div>
		</ClickOutsideDetector>
	);
	/* eslint-enable react/jsx-no-bind */
}
