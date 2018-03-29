import { h, Component } from 'preact';

const DELAY_FOR_PROPS_CSS_TRANSITION = 10;

/**
 * Displays a table of all of the key/value pairs for the props it is given,
 * except for `children`.  Children are rendered after the table
 */
export default class PropViewer extends Component {
	componentDidUpdate() {
		this.base.style.transition = 'none';
		this.base.style.backgroundColor = 'rgba(100,150,255,1)';
		setTimeout( () => {
			this.base.style.transition = 'background-color 200ms ease';
			this.base.style.backgroundColor='rgba(100,150,255,0)';
		}, DELAY_FOR_PROPS_CSS_TRANSITION);
	}

	render({ children, ...props }) {
		return (
			<div style="position: relative; min-height: 100px;">
				<table style="width:100%; margin:0 0 5px;">
					<tbody>
						{ Object.keys(props).map( key => (
							<tr>
								<td width="150">{key}</td>
								<td><pre style="display:inline">{JSON.stringify(props[key])}</pre></td>
							</tr>
						)) }
					</tbody>
				</table>
				{children}
			</div>
		);
	}
}
