import { h } from 'preact';
import { conversation } from '../../constants/types';
import Mail from '../mail';

const Conversation = props => (
	<Mail {...props} type={conversation} disableList disableMessageNavigation />
);

export default Conversation;
