let parseString = require('xml2js').parseString;
let js2xmlparser = require('js2xmlparser');
let util = require('util');
let email = 'ui.testing@ec2-13-59-112-76.us-east-2.compute.amazonaws.com';

let xmlwithplus =
  "<SendMsgRequest xmlns='urn:zimbraMail'>" +
        '<m>' +
            "<e t='t' a='ui.testing@ec2-13-59-112-76.us-east-2.compute.amazonaws.com'/>" +
            "<e t='c' a='john.doe@ec2-13-59-112-76.us-east-2.compute.amazonaws.com'/>" +
            '<su>ABC</su>' +
            "<mp ct='text/plain'>" +
                '<content>ExampleContent</content>' +
            '</mp>' +
            '</m>' +
    '</SendMsgRequest>';

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

parseString(xmlbody, (err, result) => {
	console.log(util.inspect(result, false, null));
});


let json = {
	SendMsgRequest:
        {
        	'@': {
        		xmlns: 'urn:zimbraMail'
        	},
        	m:
                [{
                	e:
                        [{
                        	'@':
                                {
                                	t: 't',
                                	a: 'ui.testing@ec2-13-59-112-76.us-east-2.compute.amazonaws.com'
                                }
                        },
                        {
                        	'@':
                                {
                                	t: 'c',
                                	a: 'john.doe@ec2-13-59-112-76.us-east-2.compute.amazonaws.com'
                                }
                        }],
                	su: ['ABC'],
                	mp:
                        [{ '@': { ct: 'text/plain' }, content: ['ExampleContent'] }]
                }]
        }
};

//console.log(js2xmlparser.parse("soap:Envelope",json));


