import { h } from 'preact';
import { callWith } from '../../lib/util';
import { Tooltip, ClickOutsideDetector, Icon } from '@zimbra/blocks';
import style from './style.less';

export default function HelpTooltip({
	toggleTooltip,
	name,
	tooltipsVisibility,
	dismiss,
	children
}) {
	const visible = tooltipsVisibility[name];
	return (
		<ClickOutsideDetector onClickOutside={visible && dismiss}>
			<div class={style.tooltipContainer} onClick={callWith(toggleTooltip, name)}>
				<Tooltip class={style.tooltip} visible={visible}>
					{children}
					<Icon name="close" class={style.close} onClick={dismiss} />
				</Tooltip>
			</div>
		</ClickOutsideDetector>
	);
}
