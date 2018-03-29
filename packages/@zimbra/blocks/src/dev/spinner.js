import { h } from 'preact';
import { Spinner } from '../';

export default () => (
	<div>
		<h1>{'<Spinner />'}</h1>
		<p>Implements a basic indeterminate progress indicator using a div with transparent rounded borders.</p>
		<table style="width: 100%;">
			<thead>
				<tr>
					<th>Prop</th><th>Type</th><th>Default</th><th>Description</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>block</td>
					<td>Boolean</td>
					<td>false</td>
					<td>If set to true, the spinner is centered vertically and horizontally in the containing element</td>
				</tr>
				<tr>
					<td>dark</td>
					<td>Boolean</td>
					<td>false</td>
					<td>If set to true, Shows a spinner that is appropriate for light backgrounds</td>
				</tr>
				<tr>
					<td>class</td>
					<td>String</td>
					<td>If supplied, is appended to the `class` attribute of the generated {'<button />'} tag</td>
					<td />
				</tr>
			</tbody>
		</table>

		<h2>Demos</h2>

		<h4><pre>{'<Spinner style="font-size:50px" />'}</pre></h4>
		<div style="width: 100px; height: 100px; border: 1px dashed #999">
			<Spinner style="font-size:50px" />
		</div>

		<h4><pre>{'<Spinner block/>'}</pre></h4>
		<div style="width: 100px; height: 100px; border: 1px dashed #999">
			<Spinner block />
		</div>

		<h4><pre>{'<Spinner style="..." />'}</pre></h4>
		<style>
			{`
			.custom-spinner {
				font-size: 30px;
				border-width: 3px;
				border-top-color:
				rgba(200,10,10,0.9);
				border-left-color: rgba(200,10,10,0.5);
				border-bottom-color: rgba(200,10,10,0.2);
				border-right-color: #EEE;
				box-shadow: 0 0 0 3px #EEE, inset 0 0 0 3px #EEE;
			}
			`}
		</style>
		<Spinner class="custom-spinner" />

		<h4><pre>{'<Spinner dark />'}</pre></h4>
		<div style="padding: 5px; width: 100px; background-color: black">
			<Spinner dark />
		</div>

	</div>
);
