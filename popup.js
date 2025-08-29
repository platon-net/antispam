import * as fnc from "./functions.js";

/*
browser.tabs
	.query({
		active: true,
		currentWindow: true,
	})
	.then((tabs) => {
		let tabId = tabs[0].id;
*/
const url = new URL(window.location.href);
const tabId = parseInt(url.searchParams.get("tab_id"), 10);
let messageId = "";
// console.log("Tab ID:", tabId);
// console.log("Message ID:", messageId);

// console.log(messenger);
messenger.messageDisplay.getDisplayedMessages(tabId).then((message_list) => {
	var message = message_list.messages[0];
	// console.log(message);
	messageId = fnc.simpleHash(message.headerMessageId);
	let sender_email = fnc.extractEmail(message.author);
	let sender_domain = fnc.getDomainFromEmail(sender_email);
	document.title = sender_email + ": " + message.subject;
	// To Info
	if (Array.isArray(message.recipients)) {
		for (let i = 0; i < message.recipients.length; i++) {
			let recipient_email = fnc.extractEmail(message.recipients[i]);
			document
				.getElementById("info_recipients")
				.appendChild(emailLine(recipient_email));
			let recipient_domain = fnc.getDomainFromEmail(recipient_email);
			let recipient_subdomains = fnc.extractSubdomains(recipient_domain);
			for (let i = 0; i < recipient_subdomains.length; i++) {
				document
					.getElementById("info_recipients_subdomains")
					.appendChild(subdomainLine(recipient_subdomains[i]));
			}
		}
	}
	// Form Info
	let subdomains = fnc.extractSubdomains(sender_domain);
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
		if (replyto != null && Array.isArray(replyto) && replyto.length > 0) {
			// console.log("replyto", replyto);
			for (let i = 0; i < replyto.length; i++) {
				let replyto_email = fnc.extractEmail(replyto[i]);
				document
					.getElementById("info_sender_replytos")
					.appendChild(emailLine(replyto_email));
				let replyto_domain = fnc.getDomainFromEmail(replyto_email);
				let replyto_subdomains = fnc.extractSubdomains(replyto_domain);
				for (let i = 0; i < replyto_subdomains.length; i++) {
					document
						.getElementById("info_replyto_subdomains")
						.appendChild(subdomainLine(replyto_subdomains[i]));
				}
			}
		}
		document.getElementById("antispam_ipaddresses").textContent =
			fnc.extractIPAddresses(message_part.headers.received);
	});
	// check infoMaildata
	browser.runtime.sendMessage({"name":"cacheInfoMaildata", "messageId": messageId}, (response) => {
		// console.log("cacheInfoMaildata", response);
		if (response != null) {
			printInfoMaidata(response.result);
		}
	});
});
//	});

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

	/* ----------------------------------------------------
	 * Buttons Info
	 */
	document
		.getElementById("info_copy_sender")
		.addEventListener("click", function () {
			fnc.toClipboard(
				document.getElementById("info_sender").innerText,
				document.getElementById("info_copy_sender")
			);
		});

	document
		.getElementById("info_filter_sender")
		.addEventListener("click", function () {
			filterSender(document.getElementById("info_sender").innerText);
		});

	document
		.getElementById("info_create_rule_sender")
		.addEventListener("click", function () {
			antispamEmailruleQuestion(
				"sender_email",
				document.getElementById("info_sender").innerText,
				document.getElementById("info_create_rule_sender")
			);
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
			antispamAddMaildata(maildata);
		});

	/* ----------------------------------------------------
	 * Buttons Question
	 */
	document
		.getElementById("question_button_yes")
		.addEventListener("click", function (event) {
			if (question_callback_last != null) question_callback_last(true);
			question_callback_last = null;
		});
	document
		.getElementById("question_button_no")
		.addEventListener("click", function (event) {
			if (question_callback_last != null) question_callback_last(false);
			question_callback_last = null;
		});
});

browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	// console.log(request);
	if (request.message_id != messageId) return true;
	switch (request.name) {
		case "infoMaildata":
			// console.log("infoMaildata", request);
			if (request.info.success) {
				printInfoMaidata(request.info.result);
			}
			break;
	}
	return true;
});

function switchForm(form_id) {
	document.querySelectorAll(".form").forEach((element) => {
		element.classList.add("hide");
	});
	document.getElementById(form_id).classList.remove("hide");
}

function webserviceResponseHandler(response, output_object) {
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
	if (output_object == null) {
		document.getElementById("webservice").innerHTML = result_html;
	} else {
		output_object.innerHTML = result_html;
	}
}

function antispamAddMaildata(maildata) {
	switchForm("webservice");
	document.getElementById("webservice").innerText =
		browser.i18n.getMessage("loading");
	browser.runtime.sendMessage(
		{ name: "antispamAddMaildata", maildata: maildata },
		webserviceResponseHandler
	);
}

function antispamEmailrule(type, pattern, output_object) {
	if (output_object == null) {
		switchForm("webservice");
		document.getElementById("webservice").innerText =
			browser.i18n.getMessage("loading");
	} else {
		output_object.innerText = browser.i18n.getMessage("loading");
	}
	browser.runtime.sendMessage(
		{ name: "antispamEmailrule", type: type, pattern: pattern },
		function (response) {
			webserviceResponseHandler(response, output_object);
		}
	);
}

function antispamEmailruleQuestion(type, pattern, button_obj) {
	if (button_obj == null) {
		question(browser.i18n.getMessage("create_rule") + "?", function (result) {
			if (result) {
				antispamEmailrule(type, pattern);
			} else {
				switchForm("form_info");
			}
		});
		return;
	}
	const inline = document.createElement("div");

	const question = document.createElement("span");
	question.innerText = browser.i18n.getMessage("create_rule") + "?";

	const button_yes = document.createElement("button");
	button_yes.innerText = browser.i18n.getMessage("yes");

	const button_no = document.createElement("button");
	button_no.innerText = browser.i18n.getMessage("no");

	button_yes.addEventListener("click", function (event) {
		antispamEmailrule(type, pattern, inline);
	});

	button_no.addEventListener("click", function (event) {
		inline.parentNode.removeChild(inline);
	});

	inline.appendChild(question);
	inline.appendChild(document.createTextNode(" "));
	inline.appendChild(button_yes);
	inline.appendChild(document.createTextNode(" "));
	inline.appendChild(button_no);
	button_obj.parentNode.appendChild(inline);
}

function subdomainLine(subdomain) {
	const line = document.createElement("div");

	// Create a button for copying to clipboard
	const button = document.createElement("button");
	button.id = "info_copy_subdomain";
	button.title = browser.i18n.getMessage("copy_to_clipboard");
	button.addEventListener("click", function (event) {
		fnc.toClipboard(subdomain, button);
	});

	const img = document.createElement("img");
	img.src = "images/copy.svg";
	img.alt = browser.i18n.getMessage("copy_to_clipboard");
	img.width = 20;
	img.height = 20;

	button.appendChild(img);

	// Create a button for filter
	const button_filter = document.createElement("button");
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

	// Create a button for create rule
	const button_rule = document.createElement("button");
	button_rule.title = browser.i18n.getMessage("create_rule");
	button_rule.addEventListener("click", function (event) {
		antispamEmailruleQuestion("sender_domain", subdomain, button_rule);
	});

	const img_rule = document.createElement("img");
	img_rule.src = "images/stop-urgent2.svg";
	img_rule.alt = browser.i18n.getMessage("create_rule");
	img_rule.width = 20;
	img_rule.height = 20;

	button_rule.appendChild(img_rule);

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
	line.appendChild(document.createTextNode(" "));
	line.appendChild(button_filter);
	line.appendChild(document.createTextNode(" "));
	line.appendChild(button_rule);
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

function emailLine(email) {
	const line = document.createElement("div");

	// Create a button for copying to clipboard
	const button = document.createElement("button");
	button.id = "info_copy_email";
	button.title = browser.i18n.getMessage("copy_to_clipboard");
	button.addEventListener("click", function (event) {
		fnc.toClipboard(email, button);
	});

	const img = document.createElement("img");
	img.src = "images/copy.svg";
	img.alt = browser.i18n.getMessage("copy_to_clipboard");
	img.width = 20;
	img.height = 20;

	button.appendChild(img);

	// Create a button for filter
	const button_filter = document.createElement("button");
	button_filter.title = browser.i18n.getMessage("filter");
	button_filter.addEventListener("click", function (event) {
		filterFulltext(email);
	});

	const img_filter = document.createElement("img");
	img_filter.src = "images/filter.svg";
	img_filter.alt = browser.i18n.getMessage("filter");
	img_filter.width = 20;
	img_filter.height = 20;

	button_filter.appendChild(img_filter);

	// Create a button for create rule
	const button_rule = document.createElement("button");
	button_rule.title = browser.i18n.getMessage("create_rule");
	button_rule.addEventListener("click", function (event) {
		antispamEmailruleQuestion("sender_email", email, button_rule);
	});

	const img_rule = document.createElement("img");
	img_rule.src = "images/stop-urgent2.svg";
	img_rule.alt = browser.i18n.getMessage("create_rule");
	img_rule.width = 20;
	img_rule.height = 20;

	button_rule.appendChild(img_rule);

	// Create text email
	const span = document.createElement("span");
	span.textContent = " " + email + " ";

	// Join to one row
	line.appendChild(button);
	line.appendChild(document.createTextNode(" "));
	line.appendChild(button_filter);
	line.appendChild(document.createTextNode(" "));
	line.appendChild(button_rule);
	line.appendChild(span);

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
	//filterFulltext("@" + domain);
	domainProviderSearchDomain(domain);
}

function filterFulltext(text) {
	filterMessages({
		fullText: text,
	});
}

async function filterMessages(queryParams) {
	let tabs = await browser.tabs.query({ active: true, currentWindow: false });
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
		fnc.tableAdd("messagelist_table", [id, subject, sender, date]);
	}
	if (msgs.messages.length == 0) {
		document.getElementById("messagelist_messages").innerHTML =
			'<tr><td colspan="4">' +
			browser.i18n.getMessage("search_empty") +
			"</td></tr>";
	}
}

async function domainProviderSearchDomain(domain) {
	switchForm("messagelist");
	document.getElementById("messagelist_messages").innerHTML =
		'<tr><td colspan="4">' + browser.i18n.getMessage("loading") + "</td></tr>";
	let rows = await browser.domainProvider.searchDomain(domain);
	// console.log(rows);
	if (rows == null) {
		document.getElementById("messagelist_messages").innerHTML =
			'<tr><td colspan="4">' +
			broswer.i18n.getMessage("search_failed") +
			"</td></tr>";
		return false;
	}
	document.getElementById("messagelist_messages").innerHTML = "";
	for (var i = 0; i < rows.length; i++) {
		var message = rows[i];
		// console.log('message', message);
		let id = message.docid;
		let subject = escapeHTML(message.subject);
		let sender = escapeHTML(message.sender);
		let date = formatDate(new Date(message.date / 1000));
		fnc.tableAdd("messagelist_table", [id, subject, sender, date]);
	}
	if (rows.length == 0) {
		document.getElementById("messagelist_messages").innerHTML =
			'<tr><td colspan="4">' +
			browser.i18n.getMessage("search_empty") +
			"</td></tr>";
	}
}

var question_callback_last = null;
function question(text, callback) {
	question_callback_last = callback;
	switchForm("question");
	document.getElementById("question_text").textContent = text;
}

function printInfoMaidata(info) {
	let div_rules = document.getElementById("rules");
	div_rules.innerHTML = "";
	let header = document.createElement("div");
	header.textContent = "✅ " + info.msg;
	div_rules.appendChild(header);
	for (let i = 0; i < info.count; i++) {
		let rule = info.rules[i];
		let item = document.createElement("div");
		item.style.paddingLeft = "5px";
		let link = document.createElement("a");
		link.href = rule.url;
		link.target = "_blank";
		link.textContent = "#" + rule.rule_id;
		let desc = document.createElement("span");
		desc.textContent = rule.pattern;
		desc.style.paddingLeft = "10px";
		item.appendChild(link);
		item.appendChild(desc);
		div_rules.appendChild(item);
	}

}
