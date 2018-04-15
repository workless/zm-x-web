import { h } from 'preact';
import { getFrequency } from '../../utils/recurrence';

export default function Recurrence({ recurrence, ...props }) {
	return <span {...props}>{getFrequency(recurrence)}</span>;
}
