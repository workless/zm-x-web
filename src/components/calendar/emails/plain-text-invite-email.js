import inviteDate from './invite-date';

export default function plainTextInviteEmail({
	subject,
	organizer,
	start,
	end,
	attendees,
	body
}) {
	return `
The following is a new meeting request:

Subject: ${subject}
Organizer: "${organizer.name}" <${organizer.address}>

Time: ${inviteDate(start, end)}

Invitees: ${attendees.map(a => a.address).join('; ')}

*~*~*~*~*~*~*~*~*~*

${body}
`.trim();
}
