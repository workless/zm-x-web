import { h, Component } from 'preact';
import preactRedux from 'preact-redux';
const { connect } = preactRedux;
import { bindActionCreators } from 'redux';
import * as emailActionCreators from '../../store/email/actions';
import s from './style.less';

@connect(null, bindActionCreators.bind(null, { modalCompose: emailActionCreators.openModalCompose }))
export default class ComposeButton extends Component {
	render({ modalCompose }) {
		return (
			<button
				className={s.composeButton}
				onClick={modalCompose}
			>
				New Message
			</button>
		);
	}
}
