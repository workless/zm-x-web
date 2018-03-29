import { Component } from 'preact';
import { graphql, compose } from 'react-apollo';
import { withProps } from 'recompose';
import get from 'lodash/get';

import { hasFlag } from '../../lib/util';

import { types as apiClientTypes } from '@zimbra/api-client';
import ActionMutation from '../../graphql/queries/action.graphql';
import accountInfo from '../account-info';

const { ActionOps, ActionType } = apiClientTypes;
class MarkAsRead extends Component {
	markAsRead = props => {
		props.action({
			type: ActionType[props.type],
			ids: [props.item.id],
			op: ActionOps.read
		});
	};

	scheduleMarkAsRead = props => {
		if (
			props.item &&
			props.markAsReadAfterSeconds !== -1 &&
			hasFlag(props.item, 'u')
		) {
			this.timeout = setTimeout(() => {
				this.markAsRead(props);
			}, props.markAsReadAfterSeconds ? props.markAsReadAfterSeconds * 1000 : 0);
		}
	};

	componentDidMount() {
		this.scheduleMarkAsRead(this.props);
	}

	componentWillReceiveProps(nextProps) {
		const id = get(this.props, 'item.id');
		const nextId = get(nextProps, 'item.id');
		if (nextId && nextId !== id) {
			clearTimeout(this.timeout);
			this.scheduleMarkAsRead(nextProps);
		}
	}

	componentWillUnmount() {
		clearTimeout(this.timeout);
	}

	render({ children }) {
		return children[0] || null;
	}
}

export default compose(
	accountInfo(),
	withProps(({ account: { prefs } }) => ({
		markAsReadAfterSeconds: prefs.zimbraPrefMarkMsgRead
	})),
	graphql(ActionMutation, {
		props: ({ mutate }) => ({
			action: variables =>
				mutate({
					variables
				})
		})
	})
)(MarkAsRead);
