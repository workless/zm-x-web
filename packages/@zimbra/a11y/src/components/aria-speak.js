import { h, Component } from 'preact';
import ScreenReaderText from './screen-reader-text';

/**
 * A live region that will read out `props.message` as soon as it is rendered.
 * *Use this sparingly!! Live regions can disrupt user experience*
 * @param {String} props.message       the message to be spoken
 */
export default class AriaSpeak extends Component {
	shouldComponentUpdate(nextProps) {
		// Manually clear textContent to avoid speaking the same message twice.
		return this.props.message !== nextProps.message && ((this.base.textContent = '') || true);
	}

	render({ message }) {
		return <ScreenReaderText role="status">{message}</ScreenReaderText>
	}
}
