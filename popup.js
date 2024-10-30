browser.tabs.query({
	active: true,
	currentWindow: true,
}).then(tabs => {
	let tabId = tabs[0].id;
	// console.log(messenger);
	messenger.messageDisplay.getDisplayedMessages(tabId).then((message_list) => {
		var message = message_list.messages[0];
		document.getElementById('antispam_recipients').value = message.recipients.join(', ');
		document.getElementById('antispam_sender').value = message.author;
		document.getElementById('antispam_subject').value = message.subject;
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
