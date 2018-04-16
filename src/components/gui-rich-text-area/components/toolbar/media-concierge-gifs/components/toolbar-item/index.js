import { h, Component } from 'preact';
import style from './style';
import ToolbarItemTooltip from '../toolbar-item-tooltip';

import CollapsedSubmenu from '../../../collapsed-submenu';

export default class ToolbarItem extends Component {
	handleTogglePopover = (active) => { this.setState({ active }); }

	handleClickGif = () => {
		this.setState({ active: false });
	}

	render(props, { active }) {
		return (
			<CollapsedSubmenu
				active={active}
				onToggle={this.handleTogglePopover}
				popoverClass={style.popover}
				icon="GIF"
			>
				<ToolbarItemTooltip onClickGif={this.handleClickGif} />
			</CollapsedSubmenu>
		);
	}
}
