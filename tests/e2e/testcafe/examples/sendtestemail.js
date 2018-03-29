let zimbra = require('../utils/soap-client');
let email = 'ui.testing@ec2-13-59-112-76.us-east-2.compute.amazonaws.com';
let userAuthToken = null;

async function sendtestemail() {
	let xmlbody =
    `<SendMsgRequest xmlns='urn:zimbraMail'>
        <m> 
            <e t='t' a='${email}' /> 
            <e t='c' a='john.doe@ec2-13-59-112-76.us-east-2.compute.amazonaws.com' /> 
            <su>ABC</su> 
            <mp ct='text/plain'> 
                <content>ExampleContent</content> 
            </mp> 
        </m> 
    </SendMsgRequest>`;

	userAuthToken = await zimbra.getUserAuthToken('ui.testing@ec2-13-59-112-76.us-east-2.compute.amazonaws.com', 'yosemite-spider-pith');
	//console.log(userAuthToken)
	await zimbra.soapSend(userAuthToken,xmlbody);

}

sendtestemail();