import { h } from 'preact';
import { ClickOutsideDetector } from '../';

/* eslint-disable react/jsx-no-bind, no-alert*/

export default () => (
	<div>
		<h1>{'<ClickOutsideDetector />'}</h1>
		<p>Determines if a user clicked outside of the elements that this component contains, or if the user typed the escape key</p>
		<table style="width: 100%;">
			<thead>
				<tr>
					<th>Prop</th><th>Type</th><th>Default</th><th>Description</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>onClickOutside</td>
					<td>Function</td>
					<td />
					<td>If supplied, called when it is determined that a user clicked outside of the contained elements</td>
				</tr>
				<tr>
					<td>children</td>
					<td>Function|Components</td>
					<td />
					<td>Element to be wrapped by the click outside detector</td>
				</tr>
			</tbody>
		</table>

		<h2>Demo</h2>

		<ClickOutsideDetector onClickOutside={() => alert('Clicked outside')}>
			<div style="background-color: #CCC; width: 200px; height: 200px; " >
				<strong>Click anywhere outside me or hit the escape key to display a window alert</strong>
			</div>
		</ClickOutsideDetector>

	</div>
);
