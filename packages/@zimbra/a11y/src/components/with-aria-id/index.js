import { h, Component } from 'preact';

const A11Y_ID_COUNTERS = {};

//TODO: Support baseName as a function of props + returning of multiple unique Ids
export default function ariaIDProvider(baseName) {
	A11Y_ID_COUNTERS[baseName] = (A11Y_ID_COUNTERS[baseName] || 0) + 1;

	return function(Child) {
		return class AriaIDProvider extends Component {
			a11yId = `${baseName}_${++A11Y_ID_COUNTERS[baseName]}`;

			render(props) {
				return <Child {...props} a11yId={this.a11yId} />;
			}
		};
	};
}