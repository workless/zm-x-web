import { h, Component } from 'preact';

const FALLBACK = <div />;

export default function splitPoint(load, importName, fallbackContent) {
	return function SplitPointWrapper(props) {
		return (<SplitPoint load={load} importName={importName} fallbackContent={fallbackContent} {...props} />);
	};
}

export class SplitPoint extends Component {
	componentWillMount() {
		let setChild = child => {
			if (this.props.importName) {
				child = child[this.props.importName] || child;
			}
			if (child && typeof child==='object' && child.default) {
				child = child.default;
			}
			if (child!==this.state.child) {
				this.setState({ child });
			}
		};

		let ret = this.props.load(setChild);
		if (ret && ret.then) ret.then(setChild);
	}

	render({ load, fallbackContent, ...props }, { child }) {
		return child ? h(child, props) : fallbackContent || FALLBACK;
	}
}
