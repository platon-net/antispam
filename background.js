// Thunderbird can terminate idle backgrounds in Manifest V3.
// Any listener directly added during add-on startup will be registered as a
// persistent listener and the background will wake up (restart) each time the
// event is fired.

// browser.messageDisplay.onMessageDisplayed.addListener((tab, message) => {
// console.log(`Message displayed in tab ${tab.id}: ${message.subject}`);
// });

function webserviceEndpoint() {
	var endpoint = localStorage.getItem("webservice_endpoint_url");
	if (endpoint == null || endpoint == undefined) {
		return "";
	}
	return endpoint;
}

function isSetWebserviceEndpoint() {
	return webserviceEndpoint().length > 0;
}

function appendFormData(formData, data, parentKey = "") {
	if (
		data &&
		typeof data === "object" &&
		!(data instanceof Date) &&
		!(data instanceof File)
	) {
		Object.keys(data).forEach((key) => {
			appendFormData(
				formData,
				data[key],
				parentKey ? `${parentKey}[${key}]` : key
			);
		});
	} else {
		formData.append(parentKey, data);
	}
}

function webservice(service, params, callback) {
	if (!isSetWebserviceEndpoint()) {
		if (callback != null) {
			callback({
				success: false,
				message: browser.i18n.getMessage("webservceURLnotSet"),
			});
		}
		return false;
	}
	var webservice_endpoint_url = webserviceEndpoint() + "?ws=" + service;
	var form_data = new FormData();
	// Object.keys(params).forEach(key => {
	// 	form_data.append(key, params[key]);
	// });
	appendFormData(form_data, params);
	fetch(webservice_endpoint_url, {
		method: "POST",
		body: form_data,
	})
		.then((response) => response.json())
		.then((json) => {
			if (callback != null) callback(json);
		})
		.catch((error) => console.error("Error loading MMDB:", error));
}

function webserviceResponseProcess(response) {
	var result = {};
	if (response.status == "OK") {
		result = { success: true, result: response.data };
	} else {
		console.error(response.msg);
		result = { success: false, message: response.msg };
	}
	return result;
}

function antispamAddMaildata(maildata, callback) {
	webservice(
		"antispam",
		{ action: "addMaildata", maildata: maildata },
		function (response) {
			var result = webserviceResponseProcess(response);
			if (callback != null) callback(result);
		}
	);
}

function antispamEmailrule(type, pattern, callback) {
	webservice(
		"antispam",
		{ action: "emailrule", type: type, pattern: pattern },
		function (response) {
			var result = webserviceResponseProcess(response);
			if (callback != null) callback(result);
		}
	);
}

async function folderAnalyze(params, callback) {
	console.log("folderAnalyze");
	let result = { status: "OK" };
	let folder = await browser.folders.get(params.folderID);
	if (folder == null) {
		result.status = "ERROR";
		result.msg = "Folder not exists";
		if (callback != null) callback(result);
		return false;
	}
	result.folder = folder;
	let messages = await browser.messages.query({
		folderId: params.folderID,
		read: false,
	});
	if (messages == null) {
		result.status = "ERROR";
		result.msg = "Message query failed";
		if (callback != null) callback(result);
		return false;
	}
	console.log("messages", messages);
	result.unread = messages.messages;
	for (var i = 0; i < result.unread.length; i++) {
		let message_full = await browser.messages.getFull(result.unread[i].id);
		result.unread[i].full = message_full;
	}
	if (callback != null) callback(result);
}

browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	//console.log(request);
	switch (request.name) {
		case "antispamAddMaildata":
			antispamAddMaildata(request.maildata, function (result) {
				sendResponse(result);
			});
			break;
		case "antispamEmailrule":
			antispamEmailrule(request.type, request.pattern, function (result) {
				sendResponse(result);
			});
			break;
		case "analyzeRun":
			folderAnalyze(request.params, function (result) {
				sendResponse(result);
			});
			break;
		default:
			sendResponse({ msg: "Unknown request" });
			break;
	}
	return true;
});

browser.messageDisplayAction.onClicked.addListener(async (tab) => {
	let new_url = "popup.html?tab_id=" + tab.id;
	let storage_popup_window = await browser.storage.local.get("popup_window_id");
	if (storage_popup_window.popup_window_id != null) {
		try {
			const win = await browser.windows.get(
				storage_popup_window.popup_window_id,
				{
					populate: true,
				}
			);
			if (win && win.tabs.length > 0) {
				await browser.tabs.update(win.tabs[0].id, { url: new_url });
				await browser.windows.update(win.id, { focused: true });
				return;
			}
		} catch (err) {
			// console.log("err", err);
		}
	}
	let popup_window = await browser.windows.create({
		url: new_url,
		type: "popup",
		width: 800,
		height: 600,
	});
	await browser.storage.local.set({ popup_window_id: popup_window.id });
});

browser.messageDisplay.onMessagesDisplayed.addListener(
	async (tab, displayedMessages) => {
		console.log("tab", tab);
		console.log("displayedMessages", displayedMessages);
		let css_filepath = browser.runtime.getURL("css/experiment.css");
		await browser.domainProvider.messageBrowserAddCSS(css_filepath);
		await browser.domainProvider.headerRowClear();
		let icon_path = browser.runtime.getURL("images/icon.svg");
		let icon = await browser.domainProvider.headerAddIcon(
			icon_path,
			"Moja ikonka"
		);
		icon.addEventListener("click", () => {
			console.log("Klik na moju ikonku v hlavičke!");
		});
		let btn = await browser.domainProvider.headerAddButton(
			"Tlacitko",
			icon_path
		);
		btn.addEventListener("click", () => {
			console.log("Klik na moje tlačidlo v hlavičke!");
		});
	}
);

// browser.headerTools.addIcon("images/icon.svg", "Moja ikonka");
