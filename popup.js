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
var messageId = "";
var message = {};
// console.log("Tab ID:", tabId);
// console.log("Message ID:", messageId);

// console.log(messenger);
messenger.messageDisplay.getDisplayedMessages(tabId).then((message_list) => {
	message = message_list.messages[0];
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
	document.getElementById("info_sender_froms").innerText = "";
	document
		.getElementById("info_sender_froms")
		.appendChild(emailLine(sender_email));
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
	// Move to folder
	messenger.accounts.list(true).then(async (accounts) => {
		// console.log(accounts);
		let form_move_folders = document.getElementById("form_move_folders");
		for (let i = 0; i < accounts.length; i++) {
			let optgroup = document.createElement("optgroup");
			optgroup.label = accounts[i].name;
			printSubfolders(
				optgroup,
				accounts[i].rootFolder.subFolders,
				accounts[i].name
			);
			form_move_folders.appendChild(optgroup);
		}
		let move_folder_id = await fnc.localGet("move_folder_id");
		if (move_folder_id != null) {
			form_move_folders.value = move_folder_id;
		}
	});
	// check infoMaildata
	browser.runtime.sendMessage(
		{ name: "cacheInfoMaildata", messageId: messageId },
		(response) => {
			// console.log("cacheInfoMaildata", response);
			if (response != null) {
				printInfoMaidata(response.result);
			}
		}
	);
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

	document
		.getElementById("button_form_move_show")
		.addEventListener("click", function () {
			switchForm("form_move");
		});

	/* ----------------------------------------------------
	 * Buttons Info
	 */


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
	 * Buttons Move
	 */
	document
		.getElementById("antispam_button_move")
		.addEventListener("click", function () {
			if (message == null || message.id == null) {
				alert(browser.i18n.getMessage("message_not_found"));
				return;
			}
			let folder_id = document.getElementById("form_move_folders").value;
			if (folder_id == null || folder_id == "") {
				alert(browser.i18n.getMessage("folder_not_selected"));
				return;
			}
			fnc.localSet("move_folder_id", folder_id);
			browser.messages.move([message.id], folder_id).then(() => {
				switchForm("form_info");
			});
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
	line.setAttribute("data-subdomain", subdomain);

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
	img_rule.classList.add("icon-add-rule");
	img_rule.src = "images/icon-add-rule.svg";
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
	line.setAttribute("data-email", email);

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
	img_rule.classList.add("icon-add-rule");
	img_rule.src = "images/icon-add-rule.svg";
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

function folderLine(folder, prefix) {
	let option = document.createElement("option");
	option.value = folder.id;
	option.textContent = prefix + " 🠢 " + folder.name;
	return option;
}

function printSubfolders(parent_element, subFolders, parent_name) {
	for (let j = 0; j < subFolders.length; j++) {
		parent_element.appendChild(folderLine(subFolders[j], parent_name));
		printSubfolders(
			parent_element,
			subFolders[j].subFolders,
			parent_name + " 🠢 " + subFolders[j].name
		);
	}
}

function filterSender(sender) {
	filterMessages({
		author: sender,
		// subject: "Zľava",
		// flagged: true
	});
}

function filterDomain(domain) {
	if (typeof browser !== "undefined" &&
		browser.domainProvider !== undefined)
	{
		domainProviderSearchDomain2(domain);
	} else {
		filterFulltext("@" + domain);
	}
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
		let subject = fnc.escapeHTML(message.subject);
		let sender = fnc.escapeHTML(message.author);
		let date = fnc.formatDate(message.date);
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
		let subject = fnc.escapeHTML(message.subject);
		let sender = fnc.escapeHTML(message.sender);
		let date = fnc.formatDate(new Date(message.date / 1000));
		fnc.tableAdd("messagelist_table", [id, subject, sender, date]);
	}
	if (rows.length == 0) {
		document.getElementById("messagelist_messages").innerHTML =
			'<tr><td colspan="4">' +
			browser.i18n.getMessage("search_empty") +
			"</td></tr>";
	}
}

async function domainProviderSearchDomain2(domain) {
	if (typeof browser == "undefined" &&
		browser.domainProvider == undefined)
	{
		return false;
	}
	switchForm("messagelist");
	let progress = document.getElementById("messagelist_progress");
	let progress_percent = document.getElementById(
		"messagelist_progress_percent"
	);
	progress.value = 0;
	progress_percent.innerText = "0%";

	document.getElementById("messagelist_messages").innerHTML = "";
	// console.log("domainProviderSearchDomain2", domain);
	let search_info = await browser.domainProvider.searchDomainInfo();
	// console.log("search_info", search_info);
	let min = search_info.min;
	let max = search_info.max;
	let diff = max - min;
	let step = Math.max(Math.round(diff / 100), 10000); // minimal step is 10.000
	let checked = 0;
	// console.log("min", min, "max", max, "step", step);
	let count = 0;
	for (let i = min - 1; i < max; i += step) {
		let rows = await browser.domainProvider.searchDomain2(
			domain,
			i + 1,
			i + step
		);
		for (let j = 0; j < rows.length; j++) {
			let message = rows[j];
			// console.log('message', message);
			let id = message.docid;
			let subject = fnc.escapeHTML(message.subject);
			let sender = fnc.escapeHTML(message.sender);
			let date = fnc.formatDate(new Date(message.date / 1000));
			fnc.tableAdd("messagelist_table", [id, subject, sender, date]);
		}
		count += rows.length;
		checked += step;
		progress.value = (checked / diff) * 100;
		progress_percent.innerText =
			Math.round(progress.value) +
			"% 🠢 " +
			count +
			" " +
			browser.i18n.getMessage("messages_found");
	}
	progress.value = 100;
	progress_percent.innerText =
		count + " " + browser.i18n.getMessage("messages_found");
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
		selectInfoValues(rule.values);
	}
}

function selectInfoValues(values) {
	for (let i = 0; i < values.length; i++) {
		let value = values[i];
		document.querySelectorAll('[data-email="'+value+'"]').forEach((element) => {
			element.querySelector('.icon-add-rule').src = "images/icon-add-rule1.svg";
		});
		document.querySelectorAll('[data-subdomain="'+value+'"]').forEach((element) => {
			element.querySelector('.icon-add-rule').src = "images/icon-add-rule1.svg";
		});
	}
}