import { h } from 'preact';
import { ContainerSize } from '../';
import HorizontalResizer from './components/horizontal-resizer';
import PropInterpolator from './components/prop-interpolator';
import PropViewer from './components/prop-viewer';

export default () => (
	<div>
		<h1>{'<ContainerSize />'}</h1>
		<p>Wrapper component that provides its own dimensions (width/height) as props to its only child.</p>
		<p>Re-renders itself and its children in response to resize.</p>
		<table style="width: 100%;">
			<thead>
				<tr>
					<th>Prop</th><th>Type</th><th>Default</th><th>Description</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>width</td>
					<td>Number/Boolean</td>
					<td>null</td>
					<td> Default width, or `false` to ignore width changes and not pass `width` to children</td>
				</tr>
				<tr>
					<td>height</td>
					<td>Number/Boolean</td>
					<td>null</td>
					<td>Default height, or `false` to ignore width changes and not pass `height` to children</td>
				</tr>
				<tr>
					<td>dimensions</td>
					<td>Boolean</td>
					<td>true</td>
					<td>Controls whether `width` and `height` props are passed to children</td>
				</tr>
				<tr>
					<td>padding</td>
					<td>Boolean</td>
					<td>true</td>
					<td>Controls whether padding is included when calculating available width & height</td>
				</tr>
				<tr>
					<td>excludePadding</td>
					<td>Boolean</td>
					<td />
					<td>Opposite alias of `padding`: if `true`, padding is excluded when calculating dimensions</td>
				</tr>
				<tr>
					<td>defer</td>
					<td>Boolean</td>
					<td>false</td>
					<td>If `true`, no initial size detection is performed on mount</td>
				</tr>
				<tr>
					<td>onBeforeResize</td>
					<td>Function</td>
					<td />
					<td>Invoked prior to re-rendering in response to a resize, passed a _mutable_ `{'{ width, height }'}` object</td>
				</tr>
			</tbody>
		</table>

		<h2>Example</h2>

		<pre>
			{`
			<ContainerSize>
				({ width, height }) => (
					<div style={{ width, height }} />
				)
			</ContainerSize>
			`}
		</pre>

		<pre>
			{`
			const Inner = ({ width }) => (
				<div style={{ width }} />
			);

			<ContainerSize padding={false} height={false}>
				<Inner />
			</ContainerSize>
		`}
		</pre>

		<h2>Demo: Defaults</h2>
		<div style="max-width:700px; background:#E8E8E8;">
			<HorizontalResizer min-width="100" max-width="700">
				<ContainerSize style="background:#EEE; border:1px solid #AAA;">
					<PropViewer>
						The props passed to a child component are shown above.
					</PropViewer>
				</ContainerSize>
			</HorizontalResizer>
		</div>


		<h2>Demo: Excluding Padding</h2>

		<div style="max-width:700px; background:#E8E8E8;">
			<HorizontalResizer min-width="100" max-width="700">
				<h4>default</h4>
				<div style="border:10px solid #2bbb90; padding:10px; background:#c4aed4;">
					<ContainerSize excludePadding style="background:#EEE; border:1px solid #AAA;">
						<PropViewer>
							The props passed to a child component are shown above.
						</PropViewer>
					</ContainerSize>
				</div>
				<h4>padding=false</h4>
				<div style="border:10px solid #2bbb90; padding:10px; background:#c4aed4;">
					<ContainerSize exclude-padding style="margin:-10px; background:#EEE; border:1px solid #AAA;">
						<PropViewer>
							The props passed to a child component are shown above.
						</PropViewer>
					</ContainerSize>
				</div>
				<h4>width=false</h4>
				<div>
					<PropInterpolator width="false">
						<ContainerSize style="background:#EEE; border:1px solid #AAA;">
							<PropViewer>
								The props passed to a child component are shown above.
							</PropViewer>
						</ContainerSize>
					</PropInterpolator>
				</div>
				<h4>dimensions=false</h4>
				<div>
					<PropInterpolator dimensions="false">
						<ContainerSize style="background:#EEE; border:1px solid #AAA;">
							<PropViewer>
								The props passed to a child component are shown above.
							</PropViewer>
						</ContainerSize>
					</PropInterpolator>
				</div>
			</HorizontalResizer>
		</div>
	</div>
);
