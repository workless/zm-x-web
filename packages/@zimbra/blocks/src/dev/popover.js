import { h } from 'preact';
import { Popover } from '../';

const ANCHORS = ['start', 'center', 'end'];
const PLACEMENTS = ['bottom', 'left', 'top', 'right'];

let contents = (
	<div style="width: 300px; height: 200px;">
		<h2>contents</h2>
		<div>These are the contents of my popover</div>
	</div>
);

export default function PopoverDemo() {
	return (
		<div>
			<h1>{'<Popover />'}</h1>
			<p>Standard Buttons for consistent styling/interaction</p>
			<table style="width: 100%;">
				<thead>
					<tr>
						<th>Prop</th><th>Type</th><th>Default</th><th>Description</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>text</td>
						<td>String</td>
						<td />
						<td>The text of the toggle element</td>
					</tr>
					<tr>
						<td>containerClass</td>
						<td>String</td>
						<td />
						<td>Optional class for the container.</td>
					</tr>
					<tr>
						<td>toggleClass</td>
						<td>String</td>
						<td />
						<td>Optional class for the toggle container.</td>
					</tr>
					<tr>
						<td>titleClass</td>
						<td>String</td>
						<td />
						<td>Optional class for the toggle title.</td>
					</tr>
					<tr>
						<td>popoverClass</td>
						<td>String</td>
						<td />
						<td>Optional class for the popover.</td>
					</tr>
					<tr>
						<td>anchor</td>
						<td>String</td>
						<td>start</td>
						<td>(start/center/end) The anchor point from where the popover will be displayed.  If false, will be centered</td>
					</tr>
					<tr>
						<td>icon</td>
						<td>String</td>
						<td />
						<td>optional - The name prop of an Icon tag if an icon should be displayed</td>
					</tr>
					<tr>
						<td>iconPosition</td>
						<td>String</td>
						<td />
						<td>(right/left) Whether or not the icon is on the left or right.</td>
					</tr>
					<tr>
						<td>focusAfterClosing</td>
						<td>Boolean</td>
						<td />
						<td>(true/false) If true, the Popover will re-focus its button after it closes.</td>
					</tr>
				</tbody>
			</table>

			<h2>Demos</h2>
			Click on the centered text to open the popover.  Try scrolling to see how the popover moves to stay in view
			<div >
				{ PLACEMENTS.map(p => (
					<div>
						<h3>placement={p}</h3>
						<div style="width: 100%; margin: 0 auto; text-align: center;">
							{ ANCHORS.map(a => (
								<div style="margin-bottom: 10px; ">
									<Popover placement={p} anchor={a} arrow text={`anchor=${a}`}>{contents}</Popover>
								</div>
							))}
						</div>
					</div>
				))}

				<h3>icon, iconPosition</h3>
				<div style="width: 100%; margin: 0 auto; text-align: center;">
					<div style="margin-bottom: 10px; ">
						<Popover iconPosition="left" toggleClass="test" icon="cog" text="icon=cog iconPosition=left">{contents}</Popover>
					</div>
					<div style="margin-bottom: 10px; ">
						<Popover iconPosition="right" toggleClass="test" icon="cog" text="icon=cog iconPosition=right">{contents}</Popover>
					</div>
				</div>
				<h3>custom target prop</h3>
				<div style="width: 100%; margin: 0 auto; text-align: center;">
					<div style="margin-bottom: 10px; ">
						<Popover iconPosition="left" toggleClass="test" icon="cog" target={
							<div style="width: 100px; height: 100px; background: green;">
								this is a custom target
							</div>
						}
						>{contents}</Popover>
					</div>
				</div>
			</div>
			<div style="height: 1000px" />
		</div>
	);
}
