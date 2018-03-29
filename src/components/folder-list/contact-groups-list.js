import { h } from 'preact';
import PureComponent from '../../lib/pure-component';
import FolderListItem from './item';
import wire from 'wiretie';
import { connect } from 'preact-redux';
import cx from 'classnames';
import style from './style';

@connect( ({ email={} }) => ({
	account: email.account
}))
@wire('zimbra', ({ account, lastUpdated }) => ({
	contactGroups: account && ['contacts.listOnlyGroups',
		{ lastUpdated }
	]
}))
export default class ContactGroupsList extends PureComponent {
	contactGroupLink = contactGroup => {
		let { urlSlug, urlPrefix, onDrop } = this.props;
		return (
			<FolderListItem
				folder={contactGroup}
				depth={1}
				onDrop={onDrop}
				dropTargetType="contactGroup"
				urlPrefix={urlPrefix==null ? 'group:' : urlPrefix}
				urlSlug={urlSlug}
				urlSuffixProp="id"
				nameProp="fileAsStr"
			/>
		);
	};

	render({ account, contactGroups, label, urlSlug, urlPrefix, onDrop, lastUpdated, ...props }) {
		return (
			<div {...props} class={cx(style.folderList, style.contactGroupsList, props.class)}>
				{ label && contactGroups && contactGroups.length>0 && (
					<div class={style.divider}>{label}</div>
				) }

				{ contactGroups && contactGroups.map(this.contactGroupLink) }
			</div>
		);
	}
}
