/*eslint no-mixed-spaces-and-tabs: ["off", "smart-tabs"]*/
import { profile } from '../profile/profile';
import { soap } from './soap-client';
let request = require('request');
let fs = require('fs');

export default class Inject {

	async send(userAuth, filename) {
		let cookie = request.cookie(`ZM_AUTH_TOKEN=${userAuth}`);
		// Set the headers for the request
		let headers = {
			'Content-Type': 'multipart/form-data; charset=UTF-8',
			Cookie: cookie
		};
		let options = {
			url: `https://${profile.serverName}/service/upload`,
			method: 'POST',
			headers,
			formData: {
				'upload-file': fs.createReadStream(filename)
			}
		};
		let attachmentID = null;
		request(options, (error, response, body) => {
			if (!error && response.statusCode === 200) {
				// Print out the response body
				attachmentID = body.substr(body.indexOf('null')+7,body.lastIndexOf(');') - (body.indexOf('null')+8));
				soap.addMessage(userAuth,attachmentID);
			}
			else {
				throw new Error('Error occured in uploading the file' + error);
			}
		});
	}
}