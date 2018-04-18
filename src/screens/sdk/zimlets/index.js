import { h, Component } from 'preact';
import linkState from 'linkstate';
import TextInput from '../../../components/text-input';
import ZimletLoader from '../../../components/zimlet-loader';
import { Button } from '@zimbra/blocks';
import zimletLocalStorage from '../../../utils/zimlet-storage';
import { callWith } from '../../../lib/util';
import style from './style';


export default class ZimletsSdk extends Component {

	state = {
		url: 'https://localhost:8081/index.js',
		zimlets: zimletLocalStorage.get() || {}
	}

	handleLoadZimlets = (zimlets) => {
		this.setState({
			zimlets: {
				...this.state.zimlets,
				...zimlets
			}
		});
	}

	removeZimlet = (name) => {
		let { zimlets } = this.state;
		delete zimlets[name];
		zimletLocalStorage.set(zimlets);
		this.setState({ zimlets });
	}

	addZimlet = () => {
		const { zimlets, name, url } = this.state;

		console.log(`Adding Zimlet ${name}: ${url}`); // eslint-disable-line no-console

		if (zimlets[name]) {
			return this.setState({ error: 'Zimlet with that name is already loaded' });
		}

		zimlets[name] = { url };
		zimletLocalStorage.set(zimlets);

		this.setState({
			name: '',
			url: '',
			latest: name,
			zimlets: {
				...zimlets,
				[name]: { url }
			}
		});
	}

	render({ }, { url, name, latest, zimlets, error }) {
		return (
			<div class={style.root}>
				<ZimletLoader zimlets={zimlets} onLoadZimlets={this.handleLoadZimlets} />
				<header>
					<h2>Zimlets SDK</h2>
				</header>
				<div class={style.main}>
					<div class={style.description}>
						Use this page to load a remote zimlet javascript bundle for testing.
					</div>
					<form onSubmit={this.addZimlet} action="javascript:">
						<TextInput value={name}	onInput={linkState(this, 'name')} placeholder="Zimlet Name" />
						<TextInput type="url" value={url} onInput={linkState(this, 'url')} />
						<Button type="submit">Load Zimlet</Button>
					</form>

					{ latest &&
							<div class={style.running}>
								Successfully started <b>{latest}</b> zimlet. The zimlet will remain loaded and running until this browser tab is closed or reloaded.
							</div>
					}
					<hr />
					<table>
						<caption>Running Zimlets</caption>
						<thead>
							<tr>
								<th>Zimlet Name</th>
								<th>Zimlet URL</th>
								<th>Remove</th>
							</tr>
						</thead>

						<tbody>
							{Object.keys(zimlets).map((zimletName) => (
								<tr>
									<td>{zimletName}</td>
									<td>{zimlets[zimletName].url}</td>
									<td><a onClick={callWith(this.removeZimlet, zimletName)}>Remove</a></td>
								</tr>
							))}
						</tbody>
					</table>

					{error &&
						<div class={style.error}>
							Error loading/starting {latest} zimlet: {error}
						</div>
					}
					<div class={style.showZimlets}>
						<a href="?zimletSlots=show">Click here</a> to show available zimlet slots
					</div>
				</div>

			</div>
		);
	}
}
