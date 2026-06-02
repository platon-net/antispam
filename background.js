// Thunderbird can terminate idle backgrounds in Manifest V3.
// Any listener directly added during add-on startup will be registered as a
// persistent listener and the background will wake up (restart) each time the
// event is fired.

// browser.messageDisplay.onMessageDisplayed.addListener((tab, message) => {
// console.log(`Message displayed in tab ${tab.id}: ${message.subject}`);
// });

import * as fnc from "./functions.js";
import API from './lib/openapi-js-simple/src/API.js';

const infoMaildataLoading = new Map();

function backendType() {
	let backend_type = localStorage.getItem("backend_type");
	if (backend_type == null || backend_type.length <= 0) {
		return "webservice";
	}
	return backend_type;
}


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

function webserviceToken() {
	return localStorage.getItem("webservice_token");
}

function apiEndpoint() {
	var endpoint = localStorage.getItem("api_endpoint_url");
	if (endpoint == null || endpoint == undefined) {
		return "";
	}
	return endpoint;
}

function isSetApiEndpoint() {
	return apiEndpoint().length > 0;
}

function apiToken() {
	var token = localStorage.getItem("api_token");
	if (token == null || token == undefined) {
		return "";
	}
	return token;
}

function isReloadPopupEnabled() {
	let reload_popup = localStorage.getItem("reload_popup"); // default is enabled
	return reload_popup == null || reload_popup.length <= 0 || reload_popup == "1";
}

function isPopupFocusedEnabled() {
	let popup_focused = localStorage.getItem("popup_focused"); // default is enabled
	return (
		popup_focused == null ||
		popup_focused.length <= 0 ||
		popup_focused == "1"
	);
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

function localError(message_name) {
	return {
		success: false,
		message: browser.i18n.getMessage(message_name),
		cacheable: false,
	};
}

async function isRemoteRequestAllowed(backend_type, callback) {
	let error = await remoteRequestError(backend_type);
	if (error != null) {
		if (callback != null) {
			callback(error);
		}
		return false;
	}
	return true;
}

async function remoteRequestError(backend_type) {
	let consent_granted = await fnc.isRemoteDataConsentGranted();
	if (!consent_granted) {
		return localError("remoteDataConsentRequired");
	}
	if (backend_type == "api" && !isSetApiEndpoint()) {
		return localError("apiURLnotSet");
	}
	if (backend_type == "webservice" && !isSetWebserviceEndpoint()) {
		return localError("webservceURLnotSet");
	}
	return null;
}

async function webservice(service, params, callback) {
	// console.log("webservice", service, params);
	let error = await remoteRequestError("webservice");
	if (error != null) {
		if (callback != null) {
			callback(error);
		}
		return false;
	}
	var webservice_endpoint_url = webserviceEndpoint() + "?ws=" + service;
	// console.log("webservice_endpoint_url", webservice_endpoint_url);
	var form_data = new FormData();
	// Object.keys(params).forEach(key => {
	// 	form_data.append(key, params[key]);
	// });
	appendFormData(form_data, params);
	form_data.append("token", webserviceToken());
	fetch(webservice_endpoint_url, {
		method: "POST",
		body: form_data,
	})
		.then((response) => {
			response
				.clone()
				.json()
				.then((json) => {
					if (callback != null) callback(json);
				})
				.catch((error) => {
					console.error("Error parsing JSON:", error);
					response
						.clone()
						.text()
						.then((text) => {
							const match = text.match(/Fatal error[\s\S]*/i);
							if (match) {
								const fatalErrorText = match[0]
									.replace(/<[^>]+>/g, "") // odstráni HTML tagy
									.trim();
								console.error(fatalErrorText);
							}
						});
				});
		})
		.catch((error) => {
			console.error("Error sending request:", error);
		});
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

function apiClient() {
	if (!isSetApiEndpoint()) {
		return false;
	}
	let apiClient = new API(apiEndpoint());
	if (apiToken().length > 0) {
		apiClient.setBearerToken(apiToken());
	}
	return apiClient;
}

function apiResponseProcess(response) {
	var result = {};
	if (response.status == "OK") {
		result = { success: true, result: response.data };
	} else {
		console.error(response.msg);
		result = { success: false, message: response.msg };
	}
	return result;
}

async function antispamAddMaildata(maildata, callback) {
	let backend_type = backendType();
	if (!await isRemoteRequestAllowed(backend_type, callback)) {
		return false;
	}
	if (backend_type == "api") {
		let api = apiClient();
		if (api == false) {
			if (callback != null) callback(localError("apiURLnotSet"));
			return false;
		}
		api
			.post("/antispam/maildata", { maildata: maildata })
			.then((response) => {
				let result = apiResponseProcess(response);
				if (callback != null) callback(result);
			})
			.catch((error) => {
				console.error(error);
				if (callback != null) callback({success : false, message: error });
			});
	}
	if (backend_type == "webservice") {
		webservice(
			"antispam",
			{ action: "addMaildata", maildata: maildata },
			function (response) {
				var result = webserviceResponseProcess(response);
				if (callback != null) callback(result);
			}
		);
	}
}

async function antispamCheckMaildata(maildata, callback) {
	let backend_type = backendType();
	if (!await isRemoteRequestAllowed(backend_type, callback)) {
		return false;
	}
	if (backend_type == "api") {
		let api = apiClient();
		if (api == false) {
			if (callback != null) callback(localError("apiURLnotSet"));
			return false;
		}
		api
			.post("/antispam/maildata/check", { maildata: maildata })
			.then((response) => {
				let result = apiResponseProcess(response);
				if (callback != null) callback(result);
			})
			.catch((error) => {
				console.error(error);
				if (callback != null) callback({success : false, message: error });
			});
	}
	if (backend_type == "webservice") {
		webservice(
			"antispam",
			{ action: "checkMaildata", maildata: maildata },
			function (response) {
				var result = webserviceResponseProcess(response);
				if (callback != null) callback(result);
			}
		);
	}
}

async function antispamEmailrule(type, pattern, callback) {
	let backend_type = backendType();
	if (!await isRemoteRequestAllowed(backend_type, callback)) {
		return false;
	}
	if (backend_type == "api") {
		let api = apiClient();
		if (api == false) {
			if (callback != null) callback(localError("apiURLnotSet"));
			return false;
		}
		api
			.post("/antispam/rules", { type: type, pattern: pattern })
			.then((response) => {
				let result = apiResponseProcess(response);
				if (callback != null) callback(result);
			})
			.catch((error) => {
				console.error(error);
				if (callback != null) callback({success : false, message: error });
			});
	}
	if (backend_type == "webservice") {
		webservice(
			"antispam",
			{ action: "emailrule", type: type, pattern: pattern },
			function (response) {
				var result = webserviceResponseProcess(response);
				if (callback != null) callback(result);
			}
		);
	}
}

function antispamCheckMaildataAsync(maildata) {
	return new Promise((resolve) => {
		antispamCheckMaildata(maildata, function (response) {
			resolve(response);
		});
	});
}

async function renderInfoMaildataHeader(response) {
	if (typeof browser === "undefined" ||
		browser.domainProvider === undefined)
	{
		return;
	}
	if (response.success == true) {
		await browser.domainProvider.headerRowClear();
		let ok_path = browser.runtime.getURL("images/ok.svg");
		let ok_blue_path = browser.runtime.getURL("images/ok-blue.svg");
		let exclamation_path = browser.runtime.getURL("images/exclamation.svg");
		await browser.domainProvider.headerAddIcon(
			(response.result.count_enabled > 0) ? exclamation_path : ok_path,
			response.result.msg,
			true, false
		);
		// let items = [];
		for (let i = 0; i < response.result.count; i++) {
			let rule = response.result.rules[i];
			let msg = "#" + rule.rule_id + ": " + rule.pattern;
			// items.push("#" + rule.rule_id + ": " + rule.pattern);
			await browser.domainProvider.headerAddIcon(
				(rule.enabled == "1") ? exclamation_path : ok_blue_path,
				msg,
				true, (rule.enabled == "0")
			);
		}
		// await browser.domainProvider.headerAddList(items);
	} else {
		await browser.domainProvider.headerRowClear();
		let error_path = browser.runtime.getURL("images/error.svg");
		await browser.domainProvider.headerAddIcon(
			error_path,
			response.message,
			true, false
		);
	}
}

async function loadInfoMaildata(message, notify_popup, render_header) {
	let message_id = fnc.simpleHash(message.headerMessageId);
	let response = await remoteRequestError(backendType());
	if (response == null) {
		response = await fnc.sessionGet("infoMaildata_" + message_id);
		if (response == null) {
			let loading = infoMaildataLoading.get(message_id);
			if (loading == null) {
				loading = (async () => {
					let maildata = await fnc.extractMessageInfo(message);
					// console.log("maildata", maildata);
					let info = await antispamCheckMaildataAsync(maildata);
					if (info != null && info.cacheable !== false) {
						await fnc.sessionSet("infoMaildata_" + message_id, info);
					}
					return info;
				})();
				infoMaildataLoading.set(message_id, loading);
			}
			try {
				response = await loading;
			} finally {
				infoMaildataLoading.delete(message_id);
			}
		}
	}
	if (notify_popup) {
		browser.runtime.sendMessage({
			name: "infoMaildata",
			message_id: message_id,
			info: response,
		});
	}
	if (render_header) {
		await renderInfoMaildataHeader(response);
	}
	return response;
}

async function getDisplayedMessageByRequest(request) {
	if (request.tabId == null) {
		return null;
	}
	let displayedMessages = await browser.messageDisplay.getDisplayedMessages(
		request.tabId
	);
	if (displayedMessages == null ||
		displayedMessages.messages == null ||
		displayedMessages.messages.length <= 0)
	{
		return null;
	}
	for (let i = 0; i < displayedMessages.messages.length; i++) {
		let message = displayedMessages.messages[i];
		if (fnc.simpleHash(message.headerMessageId) == request.messageId) {
			return message;
		}
	}
	return null;
}

async function cacheInfoMaildata(request) {
	let error = await remoteRequestError(backendType());
	if (error != null) {
		return error;
	}
	let info = await fnc.sessionGet("infoMaildata_" + request.messageId);
	if (info != null) {
		return info;
	}
	let message = await getDisplayedMessageByRequest(request);
	if (message == null) {
		return null;
	}
	return loadInfoMaildata(message, false, false);
}

async function folderAnalyze(params, callback) {
	// console.log("folderAnalyze");
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
	// console.log("messages", messages);
	result.unread = messages.messages;
	for (var i = 0; i < result.unread.length; i++) {
		let message_full = await browser.messages.getFull(result.unread[i].id);
		result.unread[i].full = message_full;
	}
	if (callback != null) callback(result);
}

browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	// console.log(request);
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
		case "openURL":
			browser.windows.openDefaultBrowser(request.url);
			break;
		case "cacheInfoMaildata":
			cacheInfoMaildata(request).then((info) => {
				sendResponse(info);
			}).catch((error) => {
				console.error(error);
				sendResponse(null);
			});
			break;
		default:
			sendResponse({ msg: "Unknown request" });
			break;
	}
	return true;
});

// ak sa klikne na tlacitko Antispam v zobrzeni emailu
browser.messageDisplayAction.onClicked.addListener(async (tab) => {
	// console.log("tab", tab, JSON.stringify(tab));
	let reloaded = await popupReloadBYTabID(tab.id);
	// console.log("reloaded", reloaded);
	if (reloaded) return;
	let new_url = "popup.html?tab_id=" + tab.id;
	let popup_window = await browser.windows.create({
		url: new_url,
		type: "popup",
		width: 800,
		height: 600,
	});
	await browser.storage.local.set({ popup_window_id: popup_window.id });
});

async function popupReloadBYTabID(tab_id) {
	// console.log("popupReloadBYTabID", tab_id);
	let new_url = "popup.html?tab_id=" + tab_id;
	let storage_popup_window = await browser.storage.local.get("popup_window_id");
	if (storage_popup_window.popup_window_id == null) return false;
	try {
		const win = await browser.windows.get(
			storage_popup_window.popup_window_id,
			{
				populate: true,
			}
		);
		if (win && win.tabs.length > 0) {
			await browser.tabs.update(win.tabs[0].id, { url: new_url });
			await browser.windows.update(win.id, {
				focused: isPopupFocusedEnabled(),
			});
			return true;
		}
	} catch (err) {
		// console.log("err", err);
	}
	return false;
}

// ak sa otvori tab s emailom
browser.messageDisplay.onMessagesDisplayed.addListener(
	async (tab, displayedMessages) => {
		let is_auto_email_info_loading_enabled = fnc.isAutoEmailInfoLoadingEnabled();

		// console.log('otvoril sa tab s emailom');
		// console.log("tab", tab, JSON.stringify(tab));
		// console.log("displayedMessages", JSON.stringify(displayedMessages));
		let css_filepath = browser.runtime.getURL("css/experiment.css");
		if (typeof browser !== "undefined" &&
			browser.domainProvider !== undefined)
		{
			await browser.domainProvider.messageBrowserAddCSS(css_filepath);
			await browser.domainProvider.headerRowClear();
			if (is_auto_email_info_loading_enabled) {
				// let icon_path = browser.runtime.getURL("images/icon.svg");
				// await browser.domainProvider.headerAddIcon(icon_path, "Moja ikonka", "moja_ikonka");
				// await browser.domainProvider.headerAddButton("Tlacitko", icon_path, "moje_tlacitko");
				let loader_path = browser.runtime.getURL("images/loading.svg");
				await browser.domainProvider.headerAddIcon(
					loader_path,
					browser.i18n.getMessage("loading")
				);
			}
		}
		if (!is_auto_email_info_loading_enabled) {
			return;
		}

		var message = displayedMessages.messages[0];
		// console.log(message);
		loadInfoMaildata(message, true, true).catch((error) => {
			console.error(error);
		});

		if (isReloadPopupEnabled()) {
			popupReloadBYTabID(tab.id);
		}
	}
);
