import { h } from 'preact';
import { Text } from 'preact-i18n';
import format from 'date-fns/format';
import styles from './style';

export function SavedAt({ date }) {
	return date && (
		<span class={styles.saved}>
			<Text id="composer.SAVED" fields={{ time: format(date, 'h:mm A') }} />
		</span>
	);
}
