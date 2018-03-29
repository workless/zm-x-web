import { h, Component } from 'preact';
import { Button, Icon } from '@zimbra/blocks';
import HelpButton from '../../help-button';
import ContactEditor from '../editor';
import linkRef from 'linkref';
import cx from 'classnames';
import { mergeDuplicateContacts } from './util';
import { getId, callWith } from '../../../lib/util';
import { getName } from '../../../utils/contacts';
import style from './style';


export default class DuplicateEditor extends Component {
	state = this.getInitialState(this.props);

	toggleEdit = () => {
		this.setState({ edit: !this.state.edit });
	};

	saveEdits = () => {
		this.setState({
			edit: false,
			mergedContact: this.editorValue || this.state.mergedContact
		});
	};

	toggle = id => {
		let toMerge = { ...this.state.toMerge };
		toMerge[id] = toMerge[id]===false;
		this.setState({
			toMerge,
			mergedContact: mergeDuplicateContacts(this.props.duplicate.contacts, toMerge)
		});
	};

	save = () => {
		let { duplicate, onSave, next } = this.props,
			{ toMerge } = this.state,
			contacts = duplicate.contacts,
			merged = {
				...duplicate,
				...mergeDuplicateContacts(contacts, toMerge),
				id: duplicate.id
			};
		delete merged.contacts;

		(onSave || next)({
			duplicate,
			contacts,
			merged,
			toMerge
		});
	};

	handleEditorChange = ({ contact }) => {
		// avoiding a pointless re-render here:
		this.editorValue = contact;
	};

	getInitialState({ duplicate }) {
		return {
			toMerge: {},
			mergedContact: mergeDuplicateContacts(duplicate.contacts, {}),
			edit: false
		};
	}

	componentWillReceiveProps(props) {
		if (props.duplicate!==this.props.duplicate) {
			this.setState(this.getInitialState(props));
		}
	}

	render({ duplicate, listPosition, listLength, next, onCancel }, { toMerge, mergedContact, edit }) {
		return (
			<div class={style.fixDuplicates}>
				<header class={style.header}>
					<h2>Fix Duplicates</h2>
					<h3 class={style.duplicatesTitle}>
						Duplicates ({duplicate.contacts.length} {duplicate.exactMatch ? 'exact' : 'similar'})
						<HelpButton title="Duplicates" anchor="left" more>
							<p>These contacts are possible duplicates because they share similar or exact information. To learn how duplicates are determined, see Help.</p>
						</HelpButton>
					</h3>
					<h3 class={style.previewTitle}>
						Merged Preview
						<HelpButton title="Merged Preview" more>
							<p>Here is a preview of the final, merged contact. ALL INFORMATION IS MERGED, so your contacts' information is never lost. Duplicates will only be merged after you click "Save and Next".</p>
						</HelpButton>
					</h3>
					<span class={style.listPosition}>
						Contact {listPosition} of {listLength}
					</span>
				</header>

				<div class={style.editor}>
					<div class={style.sidebar}>
						{ duplicate.contacts.map( contact =>
							(<div class={style.duplicate}>
								<label>
									<input type="checkbox" checked={toMerge[getId(contact)]!==false} onClick={callWith(this.toggle, getId(contact))} />
									Merge this duplicate
								</label>
								<div class={style.duplicatePreview}>
									<h4>{getName(contact.attributes)}</h4>
									<dl>
										<dt>Email</dt>
										<dd>{contact.attributes.email}</dd>
									</dl>
								</div>
							</div>)
						) }
					</div>

					<div class={style.preview}>
						<header class={style.previewHeader}>
							{ edit ? [
								<Button class={style.doneEditing} styleType="floating" onClick={this.saveEdits}>
									<Icon name="check" class={style.icon} /> Done Editing
								</Button>,
								<Button class={style.discardEdits} styleType="floating" onClick={this.toggleEdit}>
									<Icon name="close" class={style.icon} /> Discard Edits
								</Button>
							] : (
								<Button class={style.edit} styleType="floating" onClick={this.toggleEdit}>
									<Icon name="pencil" class={style.icon} /> Edit
								</Button>
							) }
							<h4>{getName(mergedContact.attributes)}</h4>
						</header>

						<ContactEditor
							ref={linkRef(this, 'editor')}
							class={cx(style.contactEditor, edit && style.editing)}
							showCard={false}
							showFooter={false}
							allowMove={false}
							skipMissing
							onChange={this.handleEditorChange}
							readonly={!edit}
							contact={mergedContact}
						/>
					</div>

					<footer class={style.footer}>
						<div class={style.buttons}>
							<Button onClick={this.save}>Save and Next</Button>
							<Button onClick={next}>Skip</Button>
							<Button onClick={onCancel}>Back to List</Button>
						</div>
					</footer>
				</div>
			</div>
		);
	}
}
