import { h, Component } from 'preact';
import cx from 'classnames';
import clipboard from 'clipboard-polyfill';
import s from './style.less';

import NakedButton from '../naked-button';

export default class ShareInfoCard extends Component {
	static defaultProps = {
		onCopySuccess() {},
		onCopyFailure() {}
	};

	handleCopyLink = () => {
		clipboard
			.writeText(this.props.url)
			.then(this.props.onCopySuccess, this.props.onCopyFailure);
	};

	render({ children, title, url, resetable, onReset, bodyClass }) {
		return (
			<div class={s.card}>
				<div class={s.header}>
					<div>{title}</div>
					{resetable && (
						<NakedButton onClick={onReset} linkColor>
							Reset
						</NakedButton>
					)}
				</div>
				<div class={cx(s.body, bodyClass)}>
					{url ? (
						<div class={s.urlContainer}>
							<div class={s.url}>
								<a href={url} target="_blank">
									{url}
								</a>
							</div>
							<NakedButton
								class={s.copyLink}
								onClick={this.handleCopyLink}
								linkColor
							>
								Copy link
							</NakedButton>
						</div>
					) : (
						children
					)}
				</div>
			</div>
		);
	}
}
