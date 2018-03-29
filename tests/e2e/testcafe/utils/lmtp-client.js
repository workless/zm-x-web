/*eslint no-mixed-spaces-and-tabs: ["off", "smart-tabs"]*/

import { profile } from '../profile/profile';
const net = require('net');
const fs = require('fs');

export default class LmtpClient {
    lmtpPort = 7025;
    hostName = profile.serverName
	client = new net.Socket();

	async send(email,filename) {
    	this.client.connect(this.lmtpPort, this.hostName, () => {
    		// console.log(`Initiated connection with ${this.hostName}:${this.hostName}`);
    	});

    	this.client.on('data', (chunk) => {
    		const response = chunk.toString('utf8');
    		// console.log(`[${this.hostName}:${this.hostName}]: ${response}`);

    		if (response.indexOf('LMTP server ready') !== -1) {
    			this.sendLine(`LHLO ${this.hostName}`);
    		}

    		if (response.indexOf('250 PIPELINING') !== -1) {
    			this.sendLine(`MAIL FROM:<${email}>`);
    		}

    		if (response.indexOf('Sender OK') !== -1) {
    			this.sendLine(`RCPT TO:<${email}>`);
    		}

    		if (response.indexOf('Recipient OK') !== -1) {
    			this.sendLine('DATA');
    		}

    		if (response.indexOf('End data with <CR><LF>') !== -1) {
    			this.sendLine(fs.readFileSync(filename));
    			this.sendLine('\r\n.\r\n');
    		}

    		if (response.indexOf('Delivery OK') !== -1) {
    			this.sendLine('QUIT');
    		}

    		if (response.indexOf('Zimbra LMTP server closing connection') !== -1) {
    			this.client.end();
    		}
    	});

    	await this.client.on('close', async () => {
			await this.client.destroy();
    	});
	}
        
	sendLine(line) {
    	this.client.write(line + '\n', 'utf8');
	}
}

//export let lmtp = new LmtpClient();

