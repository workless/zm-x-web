import { h } from 'preact';
import { Button } from '../';

export default function ButtonDemo() {
	return (
		<div>
			<h1>{'<Button />'}</h1>
			<p>Standard Buttons for consistent styling/interaction</p>
			<table style="width: 100%;">
				<thead>
					<tr>
						<th>Prop</th><th>Type</th><th>Default</th><th>Description</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>styleType</td>
						<td>String</td>
						<td />
						<td>optional - The type style the button should have (see examples below).  <pre>primary</pre>, <pre>secondary</pre>, and <pre>floating</pre> are valid options</td>
					</tr>
					<tr>
						<td>type</td>
						<td>String</td>
						<td />
						<td>optional - same as the <pre>type</pre> attribute for the html <pre>{'<button/>'}</pre> tag.  This should only be used if you want to set it to <pre>"submit"</pre> to have a button that submits a form.</td>
					</tr>
					<tr>
						<td>size</td>
						<td>String</td>
						<td>regular</td>
						<td>Size of the button.  <pre>regular</pre> and <pre>large</pre> are valid options.</td>
					</tr>
					<tr>
						<td>brand</td>
						<td>String</td>
						<td />
						<td>If supplied, applies the less variable {'@brand-${brand}'}, e.g. <pre>@brand-primary</pre>, to the color variables for the button. If not supplied then no brand styling is used and the color applied is <pre>@link-color</pre>.  valid values include <pre>primary</pre>, <pre>success</pre>, <pre>info</pre>, <pre>warning</pre>, and <pre>danger</pre>.</td>
					</tr>
					<tr>
						<td>icon</td>
						<td>Function|Component</td>
						<td />
						<td>If supplied, inserts the icon next to the text of the button</td>
					</tr>
					<tr>
						<td>iconName</td>
						<td>String</td>
						<td />
						<td>If supplied add an {'<Icon />'} component with that name prop next to the text of the button</td>
					</tr>
					<tr>
						<td>iconPosition</td>
						<td>String</td>
						<td>left</td>
						<td>[left|right] Location of the icon relative to the text</td>
					</tr>
					<tr>
						<td>disabled</td>
						<td>Boolean</td>
						<td>false</td>
						<td>Whether the button is disabled (different styling, not clickable) or not.  By default, the button is enabled</td>
					</tr>
					<tr>
						<td>class</td>
						<td>String</td>
						<td>If supplied, is appended to the <pre>class</pre> attribute of the generated {'<button />'} tag</td>
						<td />
					</tr>
					<tr>
						<td>on*</td>
						<td>Function</td>
						<td />
						<td>Supports all standard button event handlers, like onClick</td>
					</tr>
				</tbody>
			</table>

			<h2>Example</h2>

			<pre>
				{'<Button styleType="floating" size="large" brand="primary" disabled onClick={this.handleClick}>Brand Primary Disabled</Button>'}
			</pre>

			<h2>Demos</h2>
			<p>Each section of demos is a variation on the <pre>type</pre> and <pre>size</pre> props.  Within each section, all variants of the <pre>disabled</pre> and <pre>brand</pre> props are shown.</p>

			<h3>Default</h3>
			<Button>Default</Button>
			<Button disabled>Disabled</Button>

			<h3>Primary Regular</h3>
			<div><pre>styleType="primary"</pre></div>
			<Button styleType="primary" >Default</Button>
			<Button styleType="primary" disabled>Disabled</Button>
			<Button styleType="primary" brand="primary">Brand Primary</Button>
			<Button styleType="primary" brand="primary" disabled>Brand Primary Disabled</Button>
			<Button styleType="primary" brand="success">Brand Success</Button>
			<Button styleType="primary" brand="success" disabled>Brand Success Disabled</Button>
			<Button styleType="primary" brand="info">Brand Info</Button>
			<Button styleType="primary" brand="info" disabled>Brand Info Disabled</Button>
			<Button styleType="primary" brand="warning">Brand Warning</Button>
			<Button styleType="primary" brand="warning" disabled>Brand Warning Disabled</Button>
			<Button styleType="primary" brand="danger">Brand Danger</Button>
			<Button styleType="primary" brand="danger" disabled>Brand Danger Disabled</Button>


			<h3>Secondary Regular</h3>
			<div><pre>styleType="secondary"</pre></div>
			<Button styleType="secondary">Default</Button>
			<Button styleType="secondary" disabled>Disabled</Button>
			<Button styleType="secondary" brand="primary">Brand Primary</Button>
			<Button styleType="secondary" brand="primary" disabled>Brand Primary Disabled</Button>
			<Button styleType="secondary" brand="success">Brand Success</Button>
			<Button styleType="secondary" brand="success" disabled>Brand Success Disabled</Button>
			<Button styleType="secondary" brand="info">Brand Info</Button>
			<Button styleType="secondary" brand="info" disabled>Brand Info Disabled</Button>
			<Button styleType="secondary" brand="warning">Brand Warning</Button>
			<Button styleType="secondary" brand="warning" disabled>Brand Warning Disabled</Button>
			<Button styleType="secondary" brand="danger">Brand Danger</Button>
			<Button styleType="secondary" brand="danger" disabled>Brand Danger Disabled</Button>

			<h3>Floating Regular</h3>
			<div><pre>styleType="floating"</pre></div>
			<Button styleType="floating">Default</Button>
			<Button styleType="floating" disabled>Disabled</Button>
			<Button styleType="floating" brand="primary">Brand Primary</Button>
			<Button styleType="floating" brand="primary" disabled>Brand Primary Disabled</Button>
			<Button styleType="floating" brand="success">Brand Success</Button>
			<Button styleType="floating" brand="success" disabled>Brand Success Disabled</Button>
			<Button styleType="floating" brand="info">Brand Info</Button>
			<Button styleType="floating" brand="info" disabled>Brand Info Disabled</Button>
			<Button styleType="floating" brand="warning">Brand Warning</Button>
			<Button styleType="floating" brand="warning" disabled>Brand Warning Disabled</Button>
			<Button styleType="floating" brand="danger">Brand Danger</Button>
			<Button styleType="floating" brand="danger" disabled>Brand Danger Disabled</Button>

			<h3>Default Large</h3>
			<div><pre>size="large"</pre></div>

			<Button size="large">Default</Button>
			<Button size="large" disabled>Disabled</Button>

			<h3>Primary Large</h3>
			<div><pre>styleType="primary" size="large"</pre></div>

			<Button styleType="primary" size="large">Default</Button>
			<Button styleType="primary" size="large" disabled>Disabled</Button>
			<Button styleType="primary" size="large" brand="primary">Brand Primary</Button>
			<Button styleType="primary" size="large" brand="primary" disabled>Brand Primary Disabled</Button>
			<Button styleType="primary" size="large" brand="success">Brand Success</Button>
			<Button styleType="primary" size="large" brand="success" disabled>Brand Success Disabled</Button>
			<Button styleType="primary" size="large" brand="info">Brand Info</Button>
			<Button styleType="primary" size="large" brand="info" disabled>Brand Info Disabled</Button>
			<Button styleType="primary" size="large" brand="warning">Brand Warning</Button>
			<Button styleType="primary" size="large" brand="warning" disabled>Brand Warning Disabled</Button>
			<Button styleType="primary" size="large" brand="danger">Brand Danger</Button>
			<Button styleType="primary" size="large" brand="danger" disabled>Brand Danger Disabled</Button>

			<h3>Secondary Large</h3>
			<div><pre>styleType="secondary" size="large"</pre></div>
			<Button styleType="secondary" size="large">Default</Button>
			<Button styleType="secondary" size="large" disabled>Disabled</Button>
			<Button styleType="secondary" size="large" brand="primary">Brand Primary</Button>
			<Button styleType="secondary" size="large" brand="primary" disabled>Brand Primary Disabled</Button>
			<Button styleType="secondary" size="large" brand="success">Brand Success</Button>
			<Button styleType="secondary" size="large" brand="success" disabled>Brand Success Disabled</Button>
			<Button styleType="secondary" size="large" brand="info">Brand Info</Button>
			<Button styleType="secondary" size="large" brand="info" disabled>Brand Info Disabled</Button>
			<Button styleType="secondary" size="large" brand="warning">Brand Warning</Button>
			<Button styleType="secondary" size="large" brand="warning" disabled>Brand Warning Disabled</Button>
			<Button styleType="secondary" size="large" brand="danger">Brand Danger</Button>
			<Button styleType="secondary" size="large" brand="danger" disabled>Brand Danger Disabled</Button>

			<h3>Floating Large</h3>
			<div><pre>styleType="floating" size="large"</pre></div>
			<Button styleType="floating" size="large">Default</Button>
			<Button styleType="floating" size="large" disabled>Disabled</Button>
			<Button styleType="floating" size="large" brand="primary">Brand Primary</Button>
			<Button styleType="floating" size="large" brand="primary" disabled>Brand Primary Disabled</Button>
			<Button styleType="floating" size="large" brand="success">Brand Success</Button>
			<Button styleType="floating" size="large" brand="success" disabled>Brand Success Disabled</Button>
			<Button styleType="floating" size="large" brand="info">Brand Info</Button>
			<Button styleType="floating" size="large" brand="info" disabled>Brand Info Disabled</Button>
			<Button styleType="floating" size="large" brand="warning">Brand Warning</Button>
			<Button styleType="floating" size="large" brand="warning" disabled>Brand Warning Disabled</Button>
			<Button styleType="floating" size="large" brand="danger">Brand Danger</Button>
			<Button styleType="floating" size="large" brand="danger" disabled>Brand Danger Disabled</Button>


			<h3>With Icons</h3>
			<div><pre>iconName=""</pre></div>
			<Button iconName="pencil">default pencil</Button>
			<Button iconName="question-circle" styleType="primary" size="large">large primary question-circle</Button>
			<Button iconName="home" styleType="primary" size="large">large primary home</Button>

			<Button styleType="secondary" iconName="arrow-up" size="large">large secondary arrow-up</Button>
			<Button styleType="secondary" iconName="arrow-down" size="large">large secondary arrow-down</Button>

			<Button styleType="floating" iconName="arrow-down" iconPosition="right">floating arrow-down with iconPostion="right"</Button>
		</div>
	);
}
