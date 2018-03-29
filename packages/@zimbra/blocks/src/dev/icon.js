import { h } from 'preact';
import rawIconLess from '!!raw-loader!@zimbra/x-ui/icons.less';
import { Icon } from '../';

// match all the lines in the icons.less file which represent Cube Icon names
const ICONS = rawIconLess.split('\n')
	.filter((line) => line.match(/\.zimbra-icon-.*:before/))
	.map((line) => line.replace(/\.zimbra-icon-(.*):before.*/, '$1').trim());

export default function IconDemo() {
	return (
		<div style="text-align:center;">
			<h1>{'<Icon />'}</h1>
			<p>Show a given font-awesome icon.  See <a href="http://fontawesome.io/icons/">http://fontawesome.io/icons/</a> for the full list.</p>
			<table style="width: 100%;">
				<thead>
					<tr>
						<th>Prop</th><th>Type</th><th>Default</th><th>Description</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>name</td>
						<td>String</td>
						<td />
						<td>Zimbra icon name. If the name is preceded by "fa:", it will be a FontAwesome icon instead.</td>
					</tr>
					<tr>
						<td>size</td>
						<td><div>String</div> One of [xs/sm/md/lg]</td>
						<td>md</td>
						<td>The size of the icon, as set by the theme stylesheet (variables @icon-size-[xs/sm/md/lg]).</td>
					</tr>
					<tr>
						<td>class</td>
						<td>String</td>
						<td />
						<td>If supplied, is appended to the `class` attribute of the generated tag</td>
					</tr>
				</tbody>
			</table>

			<h2>Example</h2>

			{ ICONS.map( name => (
				<section style="margin: 40px; display: inline-block;">
					<Icon name={name} title={`name="${name}" size="xs"`} size="xs" style="vertical-align:middle; color:#555;" />
					<Icon name={name} title={`name="${name}" size="sm"`}  size="sm" style="vertical-align:middle; color:#555;" />
					<Icon name={name} title={`name="${name}" size="md"`}  size="md" style="vertical-align:middle; color:#555;" />
					<Icon name={name} title={`name="${name}" size="lg"`}  size="lg" style="vertical-align:middle; color:#555;" />
					<Icon name={name} title={`name="${name}" custom styles`} style="vertical-align:middle; padding:10px; margin:0 0 0 8px; border-radius:50%; background:#555; color:#fff;" />
					<pre style="margin:10px 0 0;">{`<Icon name="${name}" />`}</pre>
				</section>
			)) }
		</div>
	);
}
