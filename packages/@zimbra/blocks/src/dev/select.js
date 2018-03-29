/* eslint-disable no-alert */
/* eslint-disable react/jsx-no-bind */
import { h, Component } from 'preact';
import { Select, Option } from '../';

const ITEMS = [
	'one',
	'two',
	'three',
	'four',
	'five'
];

export default function SelectDemo({ url }) {
	return (
		<div>
			<h1>{'<Select />'}</h1>

			<h2><pre>{`<Select />`} - Props</pre></h2>
			<ul style="margin-left: 15px;">
				<li>
					<strong>value</strong> - The selected value
				</li>
				<li>
					<strong>onChange</strong> - Callback to be fired once an item in the select box is selected.  Returns value and title.
				</li>
				<li>
					<strong>anchor</strong> - (left/right/center) The anchor point from where the popover will be displayed.
				</li>
				<li>
					<strong>icon</strong> - The name for an Icon
				</li>
				<li>
					<strong>iconPosition</strong> - (right/left) Whether or not the icon is on the left or right.
				</li>
				<li>
					<strong>displayValue</strong> - Text to override the default active title.
				</li>
				<li>
					<strong>typeahead</strong> - (boolean=true) If true, the Select component will jump to a selection if it is typed while the component is focused.
				</li>
				<li>
					<strong>forceOpen</strong> - (boolean) Whether to force the Options Menu to be in the open (active) state despite the Select box having focus or not
				</li>
				<li>
					<strong>disabled</strong> - (boolean) Whether the select box is disabled or not.
				</li>
			</ul>

			<h2><pre>{`<Option />`} - Props</pre></h2>
			<ul style="margin-left: 15px;">
				<li>
					<strong>value</strong> - The value of the item.
				</li>
				<li>
					<strong>title</strong> - The display value of the item.
				</li>
				<li>
					<strong>icon</strong> - The icon that appears next to the display value.
				</li>
				<li>
					<strong>iconPosition</strong> - (right/left) Whether or not the icon is on the left or right.
				</li>
			</ul>

			<h3>Default Selected Value</h3>
			<Select value="four" iconPosition="left">
				{ ITEMS.map( name => (
					<Option value={name} />
				)) }
			</Select>
			<pre style="background-color: #eee; padding: 0 20px; margin: 10px 0 0;">{`
<Select value="four" iconPosition="left">
<Option value="one" />
<Option value="two" />
<Option value="three" />
<Option value="four" />
<Option value="five" />
</Select>
			`}</pre>


			<h3>Icon On The Left</h3>
			<Select iconPosition="left">
				{ ITEMS.map( name => (
					<Option value={name} />
				)) }
			</Select>
			<pre style="background-color: #eee; padding: 0 20px; margin: 10px 0 0;">{`
<Select iconPosition="left">
<Option value="one" />
<Option value="two" />
<Option value="three" />
<Option value="four" />
<Option value="five" />
</Select>
			`}</pre>

			<h3>Icon On The Right</h3>
			<Select iconPosition="right">
				{ ITEMS.map( name => (
					<Option value={name} />
				)) }
			</Select>
			<pre style="background-color: #eee; padding: 0 20px; margin: 10px 0 0;">{`
<Select iconPosition="right">
<Option value="one" />
<Option value="two" />
<Option value="three" />
<Option value="four" />
<Option value="five" />
</Select>
			`}</pre>

			<h3>Custom Icon</h3>
			<Select iconPosition="right" icon="edit">
				{ ITEMS.map( name => (
					<Option value={name} />
				)) }
			</Select>
			<pre style="background-color: #eee; padding: 0 20px; margin: 10px 0 0;">{`
<Select iconPosition="right" icon="edit">
<Option value="one" />
<Option value="two" />
<Option value="three" />
<Option value="four" />
<Option value="five" />
</Select>
			`}</pre>

			<h3>On Change</h3>
			<Select onChange={(e) => alert(e.value)} iconPosition="right">
				{ ITEMS.map( name => (
					<Option value={name} />
				)) }
			</Select>
			<pre style="background-color: #eee; padding: 0 20px; margin: 10px 0 0;">{`
<Select onChange={ (e) => alert(e.value) } iconPosition="right">
<Option value="one" />
<Option value="two" />
<Option value="three" />
<Option value="four" />
<Option value="five" />
</Select>
			`}</pre>

			<h3>Value Different From Title</h3>
			<Select onChange={(e) => alert(e.value)} iconPosition="right">
				<Option title="Foo" value="one" />
				<Option title="Bar" value="two" />
				<Option title="Baz" value="three" />
			</Select>
			<pre style="background-color: #eee; padding: 0 20px; margin: 10px 0 0;">{`
<Select onChange={ (e) => alert(e.value) } iconPosition="right">
<Option title="Foo" value="one" />
<Option title="Bar" value="two" />
<Option title="Baz" value="three" />
</Select>
			`}</pre>

			<h3>Custom Title</h3>
			<Select onChange={(e) => alert(e.value)} displayValue="FooBar" iconPosition="right">
				<Option title="Foo" value="one" />
				<Option title="Bar" value="two" />
				<Option title="Baz" value="three" />
			</Select>
			<pre style="background-color: #eee; padding: 0 20px; margin: 10px 0 0;">{`
<Select onChange={ (e) => alert(e.value) } displayValue="FooBar" iconPosition="right">
<Option title="Foo" value="one" />
<Option title="Bar" value="two" />
<Option title="Baz" value="three" />
</Select>
			`}</pre>

			<h3>Disabled</h3>
			<Select onChange={(e) => alert(e.value)} displayValue="FooBar" disabled="true" iconPosition="right">
				<Option title="Foo" value="one" />
				<Option title="Bar" value="two" />
				<Option title="Baz" value="three" />
			</Select>
			<pre style="background-color: #eee; padding: 0 20px; margin: 10px 0 0;">{`
<Select onChange={ (e) => alert(e.value) } displayValue="FooBar" disabled="true" iconPosition="right">
<Option title="Foo" value="one" />
<Option title="Bar" value="two" />
<Option title="Baz" value="three" />
</Select>
			`}</pre>

			<h3>Truncate - Align Left/Icon on Right</h3>
			<Select style={'max-width: 150px'} iconPosition="right">
				<Option value="1234567890123456789012345678901234567890" iconPosition="right" />
				<Option value="Untruncated" iconPosition="right" />
				<Option value="This value is too long and should be truncated" iconPosition="right" />
			</Select>
			<pre style="background-color: #eee; padding: 0 20px; margin: 10px 0 0;">{`
<Select style={'max-width: 150px'} iconPosition="right">
<Option value="1234567890123456789012345678901234567890" iconPosition="right" />
<Option value="Untruncated" iconPosition="right" />
<Option value="This value is too long and should be truncated" iconPosition="right" />
</Select>
			`}</pre>

			<h3>Truncate - Align Right/Icon on Left</h3>
			<Select style={'max-width: 150px'} iconPosition="left">
				<Option value="1234567890123456789012345678901234567890" iconPosition="left" />
				<Option value="Untruncated" iconPosition="left" />
				<Option value="This value is too long and should be truncated" iconPosition="left" />
			</Select>
			<pre style="background-color: #eee; padding: 0 20px; margin: 10px 0 0;">{`
<Select style={"max-width: 150"} iconPosition="left">
<Option value="1234567890123456789012345678901234567890" iconPosition="left" />
<Option value="Untruncated" iconPosition="left" />
<Option value="This value is too long and should be truncated" iconPosition="left" />
</Select>
			`}</pre>

			<h3><pre>forceOpen</pre></h3>
			<ForcedOpenSelect />
		</div>
	);
}

class ForcedOpenSelect extends Component {


	toggleOptionsMenu = () => this.setState({ forceOpen: !this.state.forceOpen })

	handleChange = ({ value }) => this.setState({ value });

	render(props, { forceOpen='false', value }) {
		return (
			<div>
				<pre>{`<Select forceOpen={${forceOpen}} />`}</pre>
				<label style="font-weight: bold;">Force Select Open? <input type="checkbox" checked={forceOpen} onClick={this.toggleOptionsMenu} style="margin-right: 20px;" /></label>
				<Select value={value} iconPosition="left" forceOpen={forceOpen} onChange={this.handleChange}>
					{ ITEMS.map( name => (
						<Option value={name} />
					)) }
				</Select>
			</div>
		);
	}

}
