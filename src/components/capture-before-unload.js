import { h, Component } from 'preact';
import { ClickOutsideDetector } from '@zimbra/blocks';

function reduceAncestors(node, fn, initialValue) {
	let result = fn(initialValue, node);
	while ((node = node.parentElement)) {
		result = fn(result, node);
	}
	return result;
}

function getFirstParentWithAttribute(node, attr) {
	return reduceAncestors(node, (acc, parent) => acc || parent && attr in parent && parent);
}


/**
 * Pass in a callback for `onBeforeUnload`, do something, then call the `handleAfterUnload` callback.
 * If the value passed to the `handleAfterUnload` callback is falsey, prevent the unload from happening.
 */
export default class CaptureBeforeUnload extends Component {
	handleClickOutside = (e) => {
		const clickedAnchor = getFirstParentWithAttribute(e.target, 'href');
		if (e.button === 2 || !clickedAnchor || clickedAnchor.href === location.href || this.handleAfterUnload || !this.props.onBeforeUnload) { return; }

		this.handleAfterUnload = (preventNavigateAway) => {
			if (!preventNavigateAway && clickedAnchor) {
				clickedAnchor.click();
			}
			delete this.handleAfterUnload;
		};

		e.stopPropagation();
		e.preventDefault();

		this.props.onBeforeUnload(this.handleAfterUnload);
	}

	render({ children }) {
		return (
			<ClickOutsideDetector onClickOutside={this.handleClickOutside}>
				{children}
			</ClickOutsideDetector>
		);
	}
}

