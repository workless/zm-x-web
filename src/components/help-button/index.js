import { h, Component } from 'preact';
import { Popover, Icon } from '@zimbra/blocks';
import cx from 'classnames';
import style from './style';

export default class HelpButton extends Component {
	static defaultProps = {
		anchor: 'center',
		icon: 'question-circle'
	};

	close = () => {
		this.setState({ active: false }, () => {
			this.setState({ active: null });
		});
	};

	render({ icon, anchor, title, more, children, class: c }, { active }) {
		return (
			<Popover active={active} anchor={anchor} icon={icon} toggleClass={cx(style.helpButton, c)} popoverClass={style.helpPopover}>
				<button class={style.close} onClick={this.close}>
					<Icon name="close" />
				</button>

				{ title &&
					<h6>{title}</h6>
				}

				{children}

				{ more &&
					<p>
						<a href={typeof more==='string' ? more : '/help'}>More Help</a>
					</p>
				}
			</Popover>
		);
	}
}
