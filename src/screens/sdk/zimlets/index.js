import { h, Component } from 'preact';
import linkState from 'linkstate';
import TextInput from '../../../components/text-input';
import ZimletLoader from '../../../components/zimlet-loader';
import { Button } from '@zimbra/blocks';
import zimletLocalStorage from '../../../utils/zimlet-storage';
import style from './style';


export default class ZimletsSdk extends Component {

	state = {
		url: 'https://localhost:8081/index.js',
		zimlets: this.persistedZimlets ? { ...this.persistedZimlets } : {}
	}

	handleLoadZimlets = (zimlets) => {
		this.setState({
			zimlets: {
				...this.state.zimlets,
				...zimlets
			}
		});
	}

	persistedZimlets = zimletLocalStorage.get();

	handlePersistZimlet = (name) => (e) => {
		let zimlets = zimletLocalStorage.get();

		if (e.target.checked) {
			zimlets[name] = { url: this.state.zimlets[name].url };

			this.persistedZimlets = zimlets;
			zimletLocalStorage.set(zimlets);
		}
		else if (zimlets) {
			delete zimlets[name];
			this.persistedZimlets = zimlets;
			zimletLocalStorage.set(zimlets);
		}
	}

	addZimlet = () => {
		const { zimlets, name, url } = this.state;
		console.log(`Adding Zimlet ${name}: ${url}`); // eslint-disable-line no-console

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

	loadRemoteZimlet = () => {
		let { zimlets } = this.props;
		let { url, name } = this.state;
		zimlets.loadZimletByUrl(url, { name, compat: false })
			.then( result =>
				Promise.resolve().then(result.init).then( () => result )
			)
			.catch( error => this.setState({ error }));
	};

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

					{ zimlets && !!Object.keys(zimlets).length && ([
						latest && (
							<div class={style.running}>
								Successfully started <b>{latest}</b> zimlet. The zimlet will remain loaded and running until this browser tab is closed or reloaded.
							</div>
						),
						<table>
							<caption>Running Zimlets</caption>
							<tr>
								<th>Persisted</th>
								<th>Zimlet Name</th>
								<th>Zimlet URL</th>
							</tr>
							{Object.keys(zimlets) && Object.keys(zimlets).map((zimletName) => (
								<tr>
									<td>
										<span>
											<input checked={zimletName in this.persistedZimlets} type="checkbox" onClick={this.handlePersistZimlet(zimletName)} />
											<label>Persist</label>
										</span>
									</td>
									<td>{zimletName}</td>
									<td>{zimlets[zimletName].url}</td>
								</tr>
							))}
						</table>
					])}
					{error &&
						<div class={style.error}>
							Error loading/starting {latest} zimlet: {error.message}
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
