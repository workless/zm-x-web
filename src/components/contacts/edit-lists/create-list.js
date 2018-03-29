import { h, Component } from 'preact';
import linkState from 'linkstate';
import wire from 'wiretie';
import { Localizer, Text } from 'preact-i18n';
import cx from 'classnames';
import style from './style';

@wire('zimbra', null, zimbra => ({
	createContactGroup: zimbra.contacts.createGroup
}))
export default class CreateList extends Component {
	create = () => {
		let { createContactGroup, onCreate } = this.props,
			{ name } = this.state;
		if (!name) return;
		this.setState({ working: true, error: null });
		createContactGroup( name )
			.then( (contactGroup) => {
				this.setState({
					working: false,
					name: ''
				});
				if (onCreate) onCreate(contactGroup);
			})
			.catch( err => {
				let error = String(err.message || err);
				if (error.match(/exists/)) {
					error = <Text id="contacts.editLists.LIST_ALREADY_EXISTS" />;
				}
				this.setState({
					working: false,
					error
				});
			});

	};

	dismissError = () => {
		this.setState({ error: null });
	};

	render({ createContactGroup, onCreate, ...props }, { name, working, error }) {
		return (
			<form {...props} class={cx(props.class, style.createList, error && style.hasError)} onSubmit={this.create} action="javascript:">
				<Localizer>
					<input
						class={style.createListInput}
						value={name}
						onInput={linkState(this, 'name')}
						disabled={working}
						pattern='^[^"/:]+$'
						placeholder={<Text id="contacts.editLists.NEW_LIST" />}
					/>
				</Localizer>

				{ error && (
					<span class={style.error} onClick={this.dismissError}>{error}</span>
				) }
			</form>
		);
	}
}
