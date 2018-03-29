import { h } from 'preact';
import { message } from '../../constants/types';
import Mail from '../mail';

const Message = props => (
	<Mail {...props} type={message} disableList disableMessageNavigation />
);

export default Message;
