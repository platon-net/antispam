console.log("Hello from tabAnalyze.js");
import * as fnc from "./functions.js";

var folderID = null;

document.addEventListener("DOMContentLoaded", function () {
	/* ----------------------------------------------------
	 * Initialize
	 */
	const params = new URLSearchParams(window.location.search);
	folderID = params.get('folder_id');
	/* ----------------------------------------------------
	 * Button Send onClick
	 */
	document
		.getElementById("antispam_button_run_analyze")
		.addEventListener("click", async function () {
			var params = {folderID: folderID};
			document.getElementById("processing").innerHTML = "Processing...";
			analyzeRun(params);
		});
});

function analyzeRun(params, callback) {
	browser.runtime.sendMessage(
		{ name: "analyzeRun", params: params },
		function (response) {
			console.log('analyzeRun', response);
			if (response.status != "OK") {
				document.getElementById("processing").innerHTML =
					"Error: " + response.msg;
				return false;
			}
			document.getElementById("antispam_folder_name").innerHTML = response.folder.name;
			fnc.tableClear('antispam_messages');
			for (var i = 0; i < response.unread.length; i++) {
				var message = response.unread[i];
				// console.log('message', message);
				let id = message.id;
				let subject = escapeHTML(message.subject);
				let sender = escapeHTML(message.author);
				let sender_domain = getDomainFromEmail(message.author);
				let recipients = escapeHTML(message.recipients.join(", "));
				let ipaddresses = extractIPAddresses(message.full.headers.received);
				fnc.tableAdd(
					"antispam_messages",
					[id, sender, sender_domain, recipients, subject, ipaddresses, '']
				);
			}
			if (callback != null) callback(result);
			document.getElementById("processing").innerHTML = "Done";
		}
	);
}
