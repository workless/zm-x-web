import { h, Component } from 'preact';
import { Scrim } from '../';

/* eslint-disable react/jsx-no-bind, no-alert */

export default class ScrimDemo extends Component {


	render(props, { showScrim }) {
		return (
			<div>
				<h1>{'<Scrim />'}</h1>
				<p>Display a semi-transparent overlay over the first relativel positioned parent. Prevents interaction with elements underneath the overlay</p>
				<table style="width: 100%;">
					<thead>
						<tr>
							<th>Prop</th><th>Type</th><th>Default</th><th>Description</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>class</td>
							<td>String</td>
							<td>If supplied, is appended to the `class` attribute of the generated {'<button />'} tag</td>
							<td />
						</tr>
					</tbody>
				</table>

				<h2>Demo</h2>
				<button onClick={() => this.setState({ showScrim: !showScrim })}>Toggle Scrim</button>
				<div style="position: relative; margin: 10px; padding: 10px; border: 1px solid black; height: 100px">
					<p>I am a position:relative div, and I have {!showScrim ? 'NOT' : ''} been scrimmed!!</p>
					{showScrim && <Scrim />}
					<button onClick={() => alert("I've been clicked")}>Click Me To Show An Alert</button>
				</div>

			</div>
		);
	}
}
