import { h, Component } from 'preact';

import MailListFooter from '../mail-list-footer';

const TIMEOUT = 500;

export default class LoadingFooter extends Component {
	state = {
		visible: false
	};

	setVisible = () => {
		this.setState({ visible: true });
	}

	componentDidMount() {
		this.timeout = setTimeout(this.setVisible, TIMEOUT);
	}

	componentWillUnmount() {
		clearTimeout(this.setVisible);
	}

	render(props, { visible }) {
		return (
			<MailListFooter>
				{visible ? 'Loading…' : ''}
			</MailListFooter>
		);
	}
}
