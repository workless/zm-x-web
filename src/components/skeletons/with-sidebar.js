import { h } from 'preact';
import s from './style.less';
import Fill from '../fill';

export default function SkeletonWithSidebar({ accountInfoData, preferencesData, calendarsData }) {
	const errors = [ accountInfoData.error, preferencesData.error, calendarsData.error ].filter(Boolean);

	if (errors.length) { errors.forEach((err) => console.error(err)); }

	return (
		<Fill>
			<div class={s.sidebar} />

			{errors.length && (
				<div class={s.main}>
					<h2>The application has encountered an error</h2>
					{errors.map((error) => <p>{error.message}</p>)}
				</div>
			)}
		</Fill>
	);
}
