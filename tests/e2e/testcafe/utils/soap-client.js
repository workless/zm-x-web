import { profile } from '../profile/profile';
import { utilFunc } from '../page-model/common';
let rp = require('request-promise');

const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASS = process.env.ADMIN_PASS;

if (!ADMIN_USER || !ADMIN_PASS) {
	console.error('Error: ADMIN_USER and ADMIN_PASS must be set as environment variables for the testcafe test suite to run');
	process.exit(1);
}

class SoapClient {

	hostName= profile.serverName
	adminURL = 'https://' + this.hostName + ':7071/service/admin/soap'
	soapURL = 'https://' + this.hostName + '/service/soap';

	async getAdminAuthToken(adminLogin=ADMIN_USER,adminPassword=ADMIN_PASS) {
		let authRequestObject =
			`<AuthRequest xmlns='urn:zimbraAdmin'>
				<name>${adminLogin}</name>
				<password>${adminPassword}</password>
			</AuthRequest>`;

		let req = this.makeSOAPEnvelope(authRequestObject,'');
		try {
			let res = await rp.post({ uri: this.adminURL, body: req, strictSSL: false, timeout: 10000 });
			return JSON.parse(res).Body.AuthResponse.authToken[0]._content;
		}
		catch (err) {
			throw new Error(`${err.statusCode} ${JSON.parse(err.response.body).Body.Fault.Reason.Text}`);
		}
	}

	async createAccount(adminAuthToken, domain = null) {
		let date = new Date();
		let domainVal = domain || this.hostName;
		let email = `tc${date.valueOf()}@${domainVal}`;
		let password = 'zimbra';
		let createAccountRequestObj =
			`<CreateAccountRequest xmlns='urn:zimbraAdmin'>
				<sn>Cafe</sn>
				<givenName>Test</givenName>
				<displayName>TestCafe</displayName>
				<password>${password}</password>
				<name>${email}</name>
			</CreateAccountRequest>`;

		let req = this.makeSOAPEnvelope(createAccountRequestObj, adminAuthToken);
		try {
			let res = await rp.post({ uri: this.adminURL, body: req, strictSSL: false, timeout: 10000 });
			return { id: JSON.parse(res).Body.CreateAccountResponse.account[0].id, email, password };
		}
		catch (err) {
			throw new Error(`${err.statusCode} ${JSON.parse(err.response.body).Body.Fault.Reason.Text}`);
		}
	}

	async deleteAccount(userID, adminAuthToken) {
		let deleteAccountRequestObj =
			`<DeleteAccountRequest xmlns='urn:zimbraAdmin'>
				<id>${userID}</id>
			</DeleteAccountRequest>`;

		let req = this.makeSOAPEnvelope(deleteAccountRequestObj, adminAuthToken);
		try {
			await rp.post({ uri: this.adminURL, body: req, strictSSL: false, timeout: 10000 });
		}
		catch (err) {
			throw new Error(`${err.statusCode} ${JSON.parse(err.response.body).Body.Fault.Reason.Text}`);
		}
	}

	async getUserAuthToken(userID, password) {
		let authRequestObject =
			`<AuthRequest xmlns='urn:zimbraAccount'>
				<account by='name'>${userID}</account>
				<password>${password}</password>
			</AuthRequest>`;

		let req = this.makeSOAPEnvelope(authRequestObject);
		try {
			let res = await rp.post({ uri: this.soapURL, body: req, strictSSL: false, timeout: 10000 });
			return JSON.parse(res).Body.AuthResponse.authToken[0]._content;
		}
		catch (err) {
			throw new Error(`${err.statusCode} ${JSON.parse(err.response.body).Body.Fault.Reason.Text}`);
		}
	}

	async noteGetFolder(userAuthToken) {
		let requestObj =
			`<GetFolderRequest xmlns='urn:zimbraMail'>
				<folder>
					<path>/Notepad</path>
				</folder>
				<view>note</view>
			</GetFolderRequest>`;

		let req = this.makeSOAPEnvelope(requestObj,userAuthToken);
		try {
			let res = await rp.post({ uri: this.soapURL, body: req, strictSSL: false, timeout: 10000 });
			return JSON.parse(res).Body.GetFolderResponse.folder[0].id;
		}
		catch (err) {
			throw new Error(`${err.statusCode} ${JSON.parse(err.response.body).Body.Fault.Reason.Text}`);
		}
	}

	async noteCreateFolder(userAuthToken, parentFolder, folderName) {
		let requestObj =
			`<CreateFolderRequest xmlns='urn:zimbraMail'>
				<folder>
					<l>${parentFolder}</l>
					<name>${folderName}</name>
					<view>note</view>
					<sync>1</sync>
				</folder>
			</CreateFolderRequest>`;

		let req = this.makeSOAPEnvelope(requestObj, userAuthToken);
		try {
			let res = await rp.post({ uri: this.soapURL, body: req, strictSSL: false, timeout: 10000 });
			return JSON.parse(res).Body.CreateFolderResponse.folder[0].id;
		}
		catch (err) {
			throw new Error(`${err.statusCode} ${JSON.parse(err.response.body).Body.Fault.Reason.Text}`);
		}
	}

	async noteCreateNote(userAuthToken, folderID, subject, body='') {
		let requestObj =
			`<CreateNoteRequest xmlns='urn:zimbraMail'>
				<note>
					<l>${folderID}</l>
					<content>
						{"subject":"${subject}","body":"${body}"}
					</content>
				</note>
			</CreateNoteRequest>`;

		let req = this.makeSOAPEnvelope(requestObj, userAuthToken);
		try {
			let res = await rp.post({ uri: this.soapURL, body: req, strictSSL: false, timeout: 10000 });
			return { id: JSON.parse(res).Body.CreateNoteResponse.note[0].id };
		}
		catch (err) {
			throw new Error(`${err.statusCode} ${JSON.parse(err.response.body).Body.Fault.Reason.Text}`);
		}
	}

	async contactGetFolder(userAuthToken) {
		let requestObj =
			`<GetFolderRequest xmlns='urn:zimbraMail'>
				<view>contact</view>
			</GetFolderRequest>`;

		let req = this.makeSOAPEnvelope(requestObj,userAuthToken);
		try {
			let res = await rp.post({ uri: this.soapURL, body: req, strictSSL: false, timeout: 10000 });
			return JSON.parse(res).Body.GetFolderResponse.folder[0].folder[0].id;
		}
		catch (err) {
			throw new Error(`${err.statusCode} ${JSON.parse(err.response.body).Body.Fault.Reason.Text}`);
		}
	}

	async createContact(userAuthToken, folderID, firstName, lastName='sampleUser@zimbra.com', email) {
		let requestObj =
			`<CreateContactRequest xmlns='urn:zimbraMail'>
				<cn l='${folderID}'>
					<a n='firstName'>${firstName}</a>
					<a n='lastName'>${lastName}</a>
					<a n='email'>${email}</a>
				</cn>
			 </CreateContactRequest>`;

		let req = this.makeSOAPEnvelope(requestObj, userAuthToken);
		try {
			let res = await rp.post({ uri: this.soapURL, body: req, strictSSL: false, timeout: 10000 });
			return JSON.parse(res).Body.CreateContactResponse.cn[0].id;
		}
		catch (err) {
			throw new Error(`${err.statusCode} ${JSON.parse(err.response.body).Body.Fault.Reason.Text}`);
		}
	}

	async createContactList(userAuthToken, folderID, listName) {
		let requestObj =
			`<CreateContactRequest xmlns='urn:zimbraMail'>
				<cn l='${folderID}'>
					<a n='type'>group</a>
					<a n='nickname'>${listName}</a>
					<a n='fileAs'>8:${listName}</a>
				</cn>
			</CreateContactRequest>`;

		let req = this.makeSOAPEnvelope(requestObj, userAuthToken);
		try {
			let res = await rp.post({ uri: this.soapURL, body: req, strictSSL: false, timeout: 10000 });
			return JSON.parse(res).Body.CreateContactResponse.cn[0].id;
		}
		catch (err) {
			throw new Error(`${err.statusCode} ${JSON.parse(err.response.body).Body.Fault.Reason.Text}`);
		}
	}

	async mailGetFolder(userAuthToken) {
		let requestObj =
			`<GetFolderRequest xmlns='urn:zimbraMail'>
			<view>message</view>
			</GetFolderRequest>`;

		let req = this.makeSOAPEnvelope(requestObj,userAuthToken);
		try {
			let res = await rp.post({ uri: this.soapURL, body: req, strictSSL: false, timeout: 10000 });
			return JSON.parse(res).Body.GetFolderResponse.folder[0].id;
		}
		catch (err) {
			throw new Error(`${err.statusCode} ${JSON.parse(err.response.body).Body.Fault.Reason.Text}`);
		}
	}

	async mailCreateFolder(userAuthToken, parentFolder, folderName) {
		let requestObj =
			`<CreateFolderRequest xmlns='urn:zimbraMail'>
				<folder>
					<l>${parentFolder}</l>
					<name>${folderName}</name>
					<view>message</view>
					<sync>1</sync>
				</folder>
			</CreateFolderRequest>`;
		 
		let req = this.makeSOAPEnvelope(requestObj, userAuthToken);
		try {
			let res = await rp.post({ uri: this.soapURL, body: req, strictSSL: false, timeout: 10000 });
			return JSON.parse(res).Body.CreateFolderResponse.folder[0].id;
		}
		catch (err) {
			throw new Error(`${err.statusCode} ${JSON.parse(err.response.body).Body.Fault.Reason.Text}`);
		}
	}

	async sendMessage(userAuthToken, to,subject='ABC', body='ExampleContent',cc='') {
		let requestObj =
			`<SendMsgRequest xmlns='urn:zimbraMail'>
				<m>
					<e t='t' a='${to}' />
					<e t='c' a='${cc}' />
					<su>${subject}</su>
					<mp ct='text/plain'>
						<content>${body}</content>
					</mp>
				</m>
			</SendMsgRequest>`;

		let req = this.makeSOAPEnvelope(requestObj, userAuthToken);
		try {
			let res = await rp.post({ uri: this.soapURL, body: req, strictSSL: false, timeout: 10000 });
			return JSON.parse(res).Body;
		}
		catch (err) {
			throw new Error(`${err.statusCode} ${JSON.parse(err.response.body).Body.Fault.Reason.Text}`);
		}
	}

	async soapSend(userAuthToken, requestObj) {
		let req = this.makeSOAPEnvelope(requestObj, userAuthToken);
		try {
			let res = await rp.post({ uri: this.soapURL, body: req, strictSSL: false, timeout: 10000 });
			return JSON.parse(res).Body;
		}
		catch (err) {
			throw new Error(`${err.statusCode} ${JSON.parse(err.response.body).Body.Fault.Reason.Text}`);
		}
	}

	makeSOAPEnvelope(requestObject, authToken) {
		return (
			`<?xml version='1.0'?>
			<soap:Envelope xmlns:soap='http://www.w3.org/2003/05/soap-envelope'>
				<soap:Header>
					<context xmlns='urn:zimbra'>
						<authToken>${authToken}</authToken>
						<userAgent name='zmsoap'/>
						<format xmlns='' type='js'/>
						<nosession></nosession>
					</context>
				</soap:Header>
				<soap:Body>
					${requestObject}
				</soap:Body>
			</soap:Envelope>`
		);
	}

	// Task related soap request

	async getTaskFolder(userAuthToken,folderName = 'Tasks') {
		let requestObj =`<GetFolderRequest xmlns='urn:zimbraMail'>
                <folder>
                    <path>/${folderName}</path>
                </folder>
                <view>tasks</view>
            </GetFolderRequest>`;

		let req = this.makeSOAPEnvelope(requestObj,userAuthToken);
		try {
			let res = await rp.post({ uri: this.soapURL, body: req, strictSSL: false, timeout: 10000 });
			return JSON.parse(res).Body.GetFolderResponse.folder[0].id;
		}
		catch (err) {
			throw new Error(`${err.statusCode} ${JSON.parse(err.response.body).Body.Fault.Reason.Text}`);
		}
	}

	async createTask(userAuthToken, folderID, taskName, userEmail,dueDate='20180214', notes='testSoapNotes',priority='Normal') {
		let priorityVal = 0;
		if (String(priority.toUpperCase()).indexOf('NORMAL') >= 0 ) {
			priorityVal = 9;
		}
		else if (String(priority.toUpperCase()).indexOf('URGENT') >= 0) {
			priorityVal = 1;
		}
		else {
			priorityVal = 5;
		}
		let requestObj =
            `<CreateTaskRequest xmlns='urn:zimbraMail'>
                <m l='${folderID}' su='${folderID}'>
                    <inv>
                        <comp priority='${priorityVal}' name='${taskName}' status='NEED' noBlob='true'>
                            <e d='${dueDate}' />
                            <or a='${userEmail}' d='${userEmail}' />
                        </comp>
                    </inv>
                    <mp ct='text/plain'>
                        <content>${notes}</content>
                    </mp>
                    <e a='${userEmail}' t='f' />
                </m>
             </CreateTaskRequest>`;

		let req = this.makeSOAPEnvelope(requestObj, userAuthToken);
		try {
			let res = await rp.post({ uri: this.soapURL, body: req, strictSSL: false, timeout: 10000 });
			return JSON.parse(res).Body.CreateTaskResponse.calItemId;
		}
		catch (err) {
			throw new Error(`${err.statusCode} ${JSON.parse(err.response.body).Body.Fault.Reason.Text}`);
		}
	}

	async createTaskList(userAuthToken, folderName) {
		let requestObj =`<CreateFolderRequest xmlns='urn:zimbraMail'>
                <folder>
                    <l>1</l>
                    <name>${folderName}</name>
                    <view>task</view>
                    <sync>1</sync>
                </folder>
            </CreateFolderRequest>`;

		let req = this.makeSOAPEnvelope(requestObj, userAuthToken);
		try {
			let res = await rp.post({ uri: this.soapURL, body: req, strictSSL: false, timeout: 10000 });
			return JSON.parse(res).Body.CreateFolderResponse.folder[0].id;
		}
		catch (err) {
			throw new Error(`${err.statusCode} ${JSON.parse(err.response.body).Body.Fault.Reason.Text}`);
		}
	}

	// calendar related soap request

	async createAppointment(userAuthToken, apptSubject, orgUserEmail, attendeeUserEmail, startDateTime,endDateTime, apptbody){
		let timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		let start = await utilFunc.convertDateTime(startDateTime);
		let end = await utilFunc.convertDateTime(endDateTime);

		let requestObj = `<CreateAppointmentRequest xmlns='urn:zimbraMail'>
					   <m>
					   <inv method='REQUEST' class='PUB' type='event' fb='B' transp='O' allDay='0' name='${apptSubject}'>
							<s tz='${timezone}' d='${start}' />
							<e tz='${timezone}' d='${end}' />
							<or a='${orgUserEmail}'/>
							<at role='REQ' ptst='NE' rsvp='1' a='${attendeeUserEmail}' />
						</inv>
						<e a='${attendeeUserEmail}' t='t'/>
						<mp ct='text/plain'>
							<content>${apptbody}</content>
						</mp>
						<su>${apptSubject}</su>
					</m>
				</CreateAppointmentRequest>`;
		let req = this.makeSOAPEnvelope(requestObj, userAuthToken);
		try {
			let res = await rp.post({ uri: this.soapURL, body: req, strictSSL: false, timeout: 10000 });
			return JSON.parse(res).Body.CreateAppointmentResponse.apptId;
		}
		catch (err) {
			throw new Error(`${err.statusCode} ${JSON.parse(err.response.body).Body.Fault.Reason.Text}`);
		}
	}

	async createNewCalendar(userAuthToken, calendarName) {
		let requestObj =`<CreateFolderRequest xmlns='urn:zimbraMail'>
                <folder>
                    <l>1</l>
                    <name>${calendarName}</name>
					<view>appointment</view>
					<color>3</color>
                    <sync>1</sync>
                </folder>
            </CreateFolderRequest>`;

		let req = this.makeSOAPEnvelope(requestObj, userAuthToken);
		try {
			let res = await rp.post({ uri: this.soapURL, body: req, strictSSL: false, timeout: 10000 });
			return JSON.parse(res).Body.CreateFolderResponse.folder[0].id;
		}
		catch (err) {
			throw new Error(`${err.statusCode} ${JSON.parse(err.response.body).Body.Fault.Reason.Text}`);
		}
	}

	async getCalendarFolder(userAuthToken,folderName = 'Calendar') {
		let requestObj =`<GetFolderRequest xmlns='urn:zimbraMail'>
                <folder>
                    <path>/${folderName}</path>
                </folder>
                <view>calendar</view>
            </GetFolderRequest>`;

		let req = this.makeSOAPEnvelope(requestObj,userAuthToken);
		try {
			let res = await rp.post({ uri: this.soapURL, body: req, strictSSL: false, timeout: 10000 });
			return JSON.parse(res).Body.GetFolderResponse.folder[0].id;
		}
		catch (err) {
			throw new Error(`${err.statusCode} ${JSON.parse(err.response.body).Body.Fault.Reason.Text}`);
		}
	}

	async shareCalendarAsPublic(userAuthToken, calendarName) {
		let calendarId = await this.getCalendarFolder(userAuthToken,calendarName);

		let requestObj =`<BatchRequest xmlns='urn:zimbra' onerror='continue'>
			<FolderActionRequest xmlns='urn:zimbraMail' requestId='0'>
				<action op='grant' id='${calendarId}'>
					<grant gt='pub' inh='1' perm='r' pw='' />
				</action>
			</FolderActionRequest>
		</BatchRequest>`;

		let req = this.makeSOAPEnvelope(requestObj,userAuthToken);
		try {
			let res = await rp.post({ uri: this.soapURL, body: req, strictSSL: false, timeout: 10000 });
			return JSON.parse(res).Body.BatchResponse.FolderActionResponse[0].action.id;
		}
		catch (err) {
			throw new Error(`${err.statusCode} ${JSON.parse(err.response.body).Body.Fault.Reason.Text}`);
		}
	}

	async createDomain(adminAuthToken, domainName) {

		let requestObj =
			`<CreateDomainRequest xmlns='urn:zimbraAdmin'>
				<name>${domainName}</name>
			</CreateDomainRequest>`;

		let req = this.makeSOAPEnvelope(requestObj, adminAuthToken);
		try {
			let res = await rp.post({ uri: this.adminURL, body: req, strictSSL: false, timeout: 10000 });
			return JSON.parse(res).Body.CreateDomainResponse.domain[0].id;
		}
		catch (err) {
			throw new Error(`${err.statusCode} ${JSON.parse(err.response.body).Body.Fault.Reason.Text}`);
		}
	}

	async deleteDomain(adminAuthToken, domainId) {

		let requestObj =
			`<DeleteDomainRequest xmlns='urn:zimbraAdmin'>
				<id>${domainId}</id>
			</DeleteDomainRequest>`;

		let req = this.makeSOAPEnvelope(requestObj, adminAuthToken);
		try {
			await rp.post({ uri: this.adminURL, body: req, strictSSL: false, timeout: 10000 });
		}
		catch (err) {
			throw new Error(`${err.statusCode} ${JSON.parse(err.response.body).Body.Fault.Reason.Text}`);
		}
	}

	async addMessage(userAuthToken, attachmentId, folder) {

		let requestObj =
			`<AddMsgRequest xmlns='urn:zimbraMail'>
			<m l='${folder}' f='u' aid='${attachmentId}'></m>
			</AddMsgRequest>`;

		await this.soapSend(userAuthToken,requestObj);
	}
}

export let soap = new SoapClient();

