import { cloneElement, Component } from 'preact';

/** Parses props (from HTML attributes) using JSON.parse and forwards them on to its child. */
export default class PropInterpolator extends Component {
	render({ children, ...props }) {
		for (let i in props) {
			if (props.hasOwnProperty(i)) {
				props[i] = JSON.parse(props[i]);
			}
		}
		return cloneElement(children[0], props);
	}
}
