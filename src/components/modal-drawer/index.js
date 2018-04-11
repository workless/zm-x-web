import { h, Component } from 'preact';
import { Localizer, Text } from 'preact-i18n';
import { Icon, ModalDialog } from '@zimbra/blocks';
import { ToolbarContainer } from '../toolbar';
import style from './style';
import cx from 'classnames';

export default class ModalDrawer extends Component {

	handleClickOutside = () => {
		this.setState({ mounted: false });
		setTimeout(this.props.onClickOutside, 250); // Match delay to animation duration in ./style.less
	}

	componentDidMount() {
		this.setState({ mounted: true }); // eslint-disable-line react/no-did-mount-set-state
	}

	render({ children, ...props }, { mounted }) {
		return (
			<ModalDialog {...props} onClickOutside={this.handleClickOutside} class={cx(style.modal, props.class)}>
				<div class={cx(style.container, !mounted && style.slideRight)}>
					<ToolbarContainer>
						<Localizer>
							<button
								class={style.close}
								aria-label={<Text id="buttons.close" />}
								onClick={this.handleClickOutside}
							>
								<Icon name="fa:arrow-left" />
							</button>
						</Localizer>
					</ToolbarContainer>,
					{children}
				</div>
			</ModalDialog>
		);
	}
}

