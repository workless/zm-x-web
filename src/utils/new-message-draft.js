export default function newMessageDraft() {
	return {
		attachments: [],
		bcc: [],
		cc: [],
		flag: 'd',
		rt: 'w',
		subject: '',
		to: []
	};
}
