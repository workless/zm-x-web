import { h, Component } from 'preact';
import { Icon, Select, Option } from '@zimbra/blocks';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import styles from './style';

export class SelectMenu extends Component {
	state = {
		selectedValue: this.props.title
	}

	handleSelection = (selectedOption) => {
		let selectedCmd = this.props.submenu.menuItems[selectedOption.value];
		this.props.onChange(selectedCmd);

		this.setState({ selectedValue: this.props.title });
	}

	renderOption = ({ icon, label }, index) => {
		let title = icon ? <Icon name={icon} /> : <Text id={`compose.toolbar.${label}`} />;
		return (
			<Option iconPosition="right" icon="" class={styles.item} title={title} highlightClass={styles.highlight}  value={index} />
		);
	}

	render({ menuIcon, submenu, title }, { selectedValue }) {
		return (
			<Localizer>
				<Select
					typeahead={false}
					class={cx(styles.submenuWrapper, submenu.iconMenu && styles.iconMenu)}
					toggleButtonClass={cx(styles.toggle, styles.toolbarButton)}
					anchor="left"
					dropup
					icon={menuIcon}
					iconPosition="left"
					value={selectedValue}
					displayValue={<Text id={`compose.toolbar.${title}`} />}
					buttonIconClass={styles.toggleIcon}
					onChange={this.handleSelection}
				>
					{
						submenu.menuItems.map(this.renderOption)
					}
				</Select>
			</Localizer>
		);
	}
}
