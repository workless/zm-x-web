import { h, Component } from 'preact';
import { AffixBottom } from '../';

const EXAMPLE = `
// Create a regular Toolbar. Make sure to pass down all props with {...props}.
function Toolbar(props) {
	return (
		<div {...props}>
			Fixed Footer
		</div>
	);
}

// Affix the Toolbar within a container. Make sure the container is "position: relative".
class AffixedToolbar extends Component {
	setContainerRef = (r) => { this.container = r; }
	getContainerRef = () => this.container

	render() {
		return (
			<div style="position: relative" ref={this.setContainerRef}>
				<p>Lorem Ipsum</p>
				<AffixBottom container={this.getContainerRef}>
					{/* Child must be a component, cannot be a <div> */}
					<Toolbar />
				</AffixBottom>
			</div>
		);
	}
}
`;

export default function AffixBottomDemo() {
	return (
		<div>
			<h1>{'<AffixBottom />'}</h1>
			<p>A helper for sticky scrolling components.</p>
			<Props />
			<h2>Example</h2>

			<pre>
				{EXAMPLE}
			</pre>

			<h2>Demos</h2>
			<p>A toolbar that stays fixed while scrolling. It pops into view at 150px below the top of the container, and renders 15px from the bottom of the viewport.</p>
			<AffixedToolbar />

		</div>
	);
}

class AffixedToolbar extends Component {
	setContainerRef = (r) => { this.container = r; }
	getContainerRef = () => this.container

	render() {
		return (
			<div>
				<div style="position: relative" ref={this.setContainerRef}>
					<div style="background-color: #f0f0f0; position: relative; height: 1200px; width: 100%;">
						<p>Lots of content</p>
						<p>Lots of content</p>
						<p>Lots of content</p>
						<p>Lots of content</p>
						<p>Lots of content</p>
						<p>Lots of content</p>
						<p>Lots of content</p>
					</div>
					<AffixBottom offsetTop={150} viewportOffsetBottom={15} container={this.getContainerRef}>
						<Toolbar style="width: 100%;" />
					</AffixBottom>
				</div>
				<div>
					<p>More content that is not affixed</p>
					<p>More content that is not affixed</p>
					<p>More content that is not affixed</p>
					<p>More content that is not affixed</p>
				</div>
			</div>
		);
	}
}

function Toolbar(props) {
	return (
		<div {...props}>
			<div style="text-align: center; background-color: #ccc; height: 40px; width: 100%">
				{Array(...Array(8)).map((_, i) => <button style="margin: 0 5px">{i+1}</button>)}
			</div>
		</div>
	);
}

function Props() {
	return (
		<table style="width: 100%;">
			<thead>
				<tr>
					<th>Prop</th><th>Type</th><th>Default</th><th>Description</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>container</td>
					<td>HTMLElement|Function</td>
					<td />
					<td>The element which defines boundaries for the affixed component. Can be a function which returns an HTMLElement.</td>
				</tr>
				<tr>
					<td>children</td>
					<td>Component</td>
					<td />
					<td>A single child, the Component to be affixed. NOTE: The child <b>must</b> be a Component, and forward all props to it's base element.</td>
				</tr>
				<tr>
					<td>[offsetTop]</td>
					<td>Number</td>
					<td>0</td>
					<td>The distance from the top of <kbd>container</kbd> to fix the element at</td>
				</tr>
				<tr>
					<td>[viewportOffsetBottom]</td>
					<td>Number</td>
					<td>0</td>
					<td>The distance from the bottom of the viewport in pixels to render the affixed component.</td>
				</tr>
			</tbody>
		</table>
	);
}
