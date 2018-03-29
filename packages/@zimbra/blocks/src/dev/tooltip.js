import { h } from 'preact';
import { Tooltip } from '../';

export default () => (
	<div>
		<h1>{'<Tooltip />'}</h1>
		<p>Given any component a custom tooltip</p>
		<table style="width: 100%;">
			<thead>
				<tr>
					<th>Prop</th><th>Type</th><th>Default</th><th>Description</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>position</td>
					<td>String</td>
					<td />
					<td>[top|left|bottom|right]</td>
				</tr>
				<tr>
					<td>anchor</td>
					<td>String</td>
					<td />
					<td>[left|right]</td>
				</tr>
				<tr>
					<td>visible</td>
					<td>Boolean</td>
					<td>false</td>
					<td>Whether the tooltip is visible or not</td>
				</tr>
				<tr>
					<td>children</td>
					<td>Function|Components</td>
					<td />
					<td>The content of the tooltip</td>
				</tr>
			</tbody>
		</table>

		<h2>Demo</h2>
		<pre>
			{`
<div>
	I am a div with a custom tooltip.
	<Tooltip visible position="right">
		This is my custom tooltip
		<img src="..."/>
	</Tooltip>
</div>
	`}
			</pre>

			<div style="width: 100px; position: relative; border: 1px solid #555;" >
				I am a div with a custom tooltip.
				<Tooltip visible position="right" style="width: 100px; margin-left: 10px;">
					This is my custom tooltip
				<img src="data:image/jpeg;base64,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" />
			</Tooltip>
		</div>


	</div>
);
