import h from 'vhtml';
import inviteDate from './invite-date';

const htmlInviteEmail = ({
	subject,
	organizer,
	start,
	end,
	attendees,
	body
}) => (
	<html>
		<body id="htmlmode">
			<h3>The following is a new meeting request:</h3>
			<div>
				<table border="0">
					<tr>
						<th align="left">Subject:</th>
						<td>{subject}</td>
					</tr>
					<tr>
						<th align="left">Organizer:</th>
						<td>
							"{organizer.name}" &lt;{organizer.address}&gt;
						</td>
					</tr>
				</table>
				<table border="0">
					<tr>
						<th align="left">Time:</th>
						<td>{inviteDate(start, end)}</td>
					</tr>
				</table>
				<table border="0">
					<tr>
						<th align="left">Invitees:</th>
						<td>{attendees.map(a => a.address).join('; ')}</td>
					</tr>
				</table>
				<br />
				<div>
					<div style="white-space: pre-wrap;">{body}</div>
				</div>
			</div>
		</body>
	</html>
);

export default htmlInviteEmail;
