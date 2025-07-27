browser.tabs
	.query({
		active: true,
		currentWindow: true,
	})
	.then((tabs) => {
		let tabId = tabs[0].id;
		// console.log(messenger);
		messenger.messageDisplay
			.getDisplayedMessages(tabId)
			.then((message_list) => {
				var message = message_list.messages[0];
				// console.log(message);
				let sender_email = extractEmail(message.author);
				let sender_domain = getDomainFromEmail(message.author);
				// Form Info
				let subdomains = extractSubdomains(sender_domain);
				document.getElementById("info_sender").innerText = sender_email;
				document.getElementById("info_sender_subdomains").innerHTML = "";
				for (let i = 0; i < subdomains.length; i++) {
					document
						.getElementById("info_sender_subdomains")
						.appendChild(subdomainLine(subdomains[i]));
				}
				// Form Summary
				document.getElementById("antispam_recipients").value =
					message.recipients.join(", ");
				document.getElementById("antispam_sender").value = sender_email;
				document.getElementById("antispam_sender_domain").value = sender_domain;
				document.getElementById("antispam_subject").value = message.subject;
				messenger.messages.getFull(message.id).then((message_part) => {
					// console.log(message_part);
					let replyto = message_part.headers["reply-to"];
					if (replyto != null) {
						document.getElementById("antispam_replyto").value =
							replyto.join(", ");
						document.getElementById("antispam_replyto_domain").value =
							getDomainFromEmail(replyto);
					}
					document.getElementById("antispam_ipaddresses").value =
						extractIPAddresses(message_part.headers.received);
				});
			});
	});

document.addEventListener("DOMContentLoaded", function () {
	/* ----------------------------------------------------
	 * Initialize
	 */

	/* ----------------------------------------------------
	 * Buttons
	 */
	document
		.getElementById("button_form_info_show")
		.addEventListener("click", function () {
			switchForm("form_info");
		});

	document
		.getElementById("button_form_summary_show")
		.addEventListener("click", function () {
			switchForm("form_summary");
		});

	document
		.getElementById("info_copy_sender")
		.addEventListener("click", function () {
			toClipboard(
				document.getElementById("info_sender").innerText,
				document.getElementById("info_copy_sender")
			);
		});

	document
		.getElementById("info_filter_sender")
		.addEventListener("click", function () {
			filterSender(document.getElementById("info_sender").innerText);
		});

	/* ----------------------------------------------------
	 * Button Send onClick
	 */
	document
		.getElementById("antispam_button_send")
		.addEventListener("click", function () {
			var maildata = {
				recipients: document.getElementById("antispam_recipients").value,
				sender: document.getElementById("antispam_sender").value,
				subject: document.getElementById("antispam_subject").value,
			};
			document.body.textContent = "Sending...";
			antispamAdd(maildata);
		});
});

function switchForm(form_id) {
	document.querySelectorAll(".form").forEach((element) => {
		element.classList.add("hide");
	});
	document.getElementById(form_id).classList.remove("hide");
}

function antispamAdd(maildata, callback) {
	browser.runtime.sendMessage(
		{ name: "antispamAdd", maildata: maildata },
		function (response) {
			// console.log(response);
			var result_html = "N/A";
			if (response.success == true) {
				result_html = "OK";
				if (response.result != null && response.result.message != null) {
					result_html += ": " + response.result.message;
				}
			} else {
				result_html = response.message;
			}
			document.body.textContent = result_html;
		}
	);
}

function subdomainLine(subdomain) {
	const line = document.createElement("div");

	// Create a button for copying to clipboard
	const button = document.createElement("button");
	button.id = "info_copy_subdomain";
	button.title = browser.i18n.getMessage("copy_to_clipboard");
	button.addEventListener("click", function (event) {
		toClipboard(subdomain, button);
	});

	const img = document.createElement("img");
	img.src = "images/copy.svg";
	img.alt = browser.i18n.getMessage("copy_to_clipboard");
	img.width = 20;
	img.height = 20;

	button.appendChild(img);

	// Create a button for filter
	const button_filter = document.createElement("button");
	button_filter.id = "info_filter_subdomain";
	button_filter.title = browser.i18n.getMessage("filter");
	button_filter.addEventListener("click", function (event) {
		filterDomain(subdomain);
	});

	const img_filter = document.createElement("img");
	img_filter.src = "images/filter.svg";
	img_filter.alt = browser.i18n.getMessage("filter");
	img_filter.width = 20;
	img_filter.height = 20;

	button_filter.appendChild(img_filter);

	// Create text Subdomain
	const span = document.createElement("span");
	span.textContent = " " + subdomain + " ";

	// Brackets and spaces
	const bracketStart = document.createTextNode(" [ ");
	const separator1 = document.createTextNode("  ");
	const separator2 = document.createTextNode(" | ");
	const separator3 = document.createTextNode("  ");
	const bracketEnd = document.createTextNode(" ]");

	// Links
	const aHttp = document.createElement("a");
	aHttp.href = "http://" + subdomain;
	aHttp.target = "_blank";
	aHttp.textContent = "HTTP";

	const aHttpWww = document.createElement("a");
	aHttpWww.href = "http://www." + subdomain;
	aHttpWww.target = "_blank";
	aHttpWww.textContent = "+www";

	const aHttps = document.createElement("a");
	aHttps.href = "https://" + subdomain;
	aHttps.target = "_blank";
	aHttps.textContent = "HTTPS";

	const aHttpsWww = document.createElement("a");
	aHttpsWww.href = "https://www." + subdomain;
	aHttpsWww.target = "_blank";
	aHttpsWww.textContent = "+www";

	// Join to one row
	line.appendChild(button);
	line.appendChild(button_filter);
	line.appendChild(span);
	line.appendChild(bracketStart);
	line.appendChild(aHttp);
	line.appendChild(separator1);
	line.appendChild(aHttpWww);
	line.appendChild(separator2);
	line.appendChild(aHttps);
	line.appendChild(separator3);
	line.appendChild(aHttpsWww);
	line.appendChild(bracketEnd);

	// Break row
	line.appendChild(document.createElement("br"));

	return line;
}

function filterSender(sender) {
	filterMessages({
		author: sender,
		// subject: "Zľava",
		// flagged: true
	});
}

function filterDomain(domain) {
	filterMessages({
		fullText: "@"+domain,
	});
}

async function filterMessages(queryParams) {
	let tabs = await browser.tabs.query({ active: true, currentWindow: true });
	const tab = tabs[0];
	// console.log('tab', tab);
	if (tab.type == "mail") {
		const tab_info = await browser.mailTabs.get(tab.id);
		const folderID = tab_info.displayedFolder.id;
		queryParams.folderId = folderID;
	}
	// console.log(queryParams);
	switchForm("messagelist");
	document.getElementById("messagelist_messages").innerHTML =
		'<tr><td colspan="4">' + browser.i18n.getMessage("loading") + "</td></tr>";
	const msgs = await browser.messages.query(queryParams);
	// console.log(msgs);
	if (msgs == null) {
		document.getElementById("messagelist_messages").innerHTML =
			'<tr><td colspan="4">' +
			broswer.i18n.getMessage("search_failed") +
			"</td></tr>";
		return false;
	}
	document.getElementById("messagelist_messages").innerHTML = "";
	for (var i = 0; i < msgs.messages.length; i++) {
		var message = msgs.messages[i];
		// console.log('message', message);
		let id = message.id;
		let subject = escapeHTML(message.subject);
		let sender = escapeHTML(message.author);
		let date = formatDate(message.date);
		tableAdd("messagelist_table", [id, subject, sender, date]);
	}
	if (msgs.messages.length == 0) {
		document.getElementById("messagelist_messages").innerHTML =
			'<tr><td colspan="4">' + browser.i18n.getMessage("search_empty") + "</td></tr>";
	}
}
