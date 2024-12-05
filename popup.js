browser.tabs.query({
	active: true,
	currentWindow: true,
}).then(tabs => {
	let tabId = tabs[0].id;
	// console.log(messenger);
	messenger.messageDisplay.getDisplayedMessages(tabId).then((message_list) => {
		var message = message_list.messages[0];
		// console.log(message);
		document.getElementById('antispam_recipients').value = message.recipients.join(', ');
		document.getElementById('antispam_sender').value = message.author;
		document.getElementById('antispam_sender_domain').value = getDomainFromEmail(message.author);
		document.getElementById('antispam_subject').value = message.subject;
		messenger.messages.getFull(message.id).then((message_part) => {
			// console.log(message_part);
			let replyto = message_part.headers['reply-to'];
			if (replyto != null) {
				document.getElementById('antispam_replyto').value = replyto.join(', ');
				document.getElementById('antispam_replyto_domain').value = getDomainFromEmail(replyto);
			}
			document.getElementById('antispam_ipaddresses').value = extractIPAddresses(message_part.headers.received);
		});
	});
});

document.addEventListener('DOMContentLoaded', function() {
	/* ----------------------------------------------------
	 * Initialize
	 */

	/* ----------------------------------------------------
	 * Button Send onClick
	 */
	document.getElementById('antispam_button_send').addEventListener('click', function() {
		var maildata = {
			recipients: document.getElementById('antispam_recipients').value,
			sender: document.getElementById('antispam_sender').value,
			subject: document.getElementById('antispam_subject').value
		};
		document.body.textContent = 'Sending...';
		antispamAdd(maildata);
	});

});


function antispamAdd(maildata, callback) {
	browser.runtime.sendMessage({'name': 'antispamAdd', 'maildata': maildata}, function(response){
		// console.log(response);
		var result_html = 'N/A';
		if (response.success == true) {
			result_html = 'OK';
			if (response.result != null
				&& response.result.message != null)
			{
				result_html += ': ' + response.result.message;
			}
		} else {
			result_html = response.message;
		}
		document.body.textContent = result_html;
	});
}

function getDomainFromEmail(email) {
	if (Array.isArray(email)) {
		let domains = [];
		for (let i = 0; i < email.length; i++) {
			domains.push(getDomainFromEmail(email[i]));
		}
		return domains.join(', ');
	}
	if (email == null) return null;
	const domain = email.split('@')[1].replace(/[<>]/g, '');
	return domain;
}

function extractIPAddresses(text) {
	let ignored_ip = ['127.0.0.1', '192.168.'];
	if (Array.isArray(text)) {
		let ips = [];
		for (let i = 0; i < text.length; i++) {
			ips = ips.concat(extractIPAddresses(text[i]));
		}
		ips = ips.reduce((acc, item) => {
			for (let j = 0; j < ignored_ip.length; j++) {
				if (item.startsWith(ignored_ip[j])) {
					return acc;
				}
			}
			if (!acc.includes(item)) {
				acc.push(item);
			}
			return acc;
		}, []);
		return ips.join(', ');
	}
	if (text == null) return [];
	const ipPattern = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
	const matches = text.match(ipPattern);
	return matches || [];
}
