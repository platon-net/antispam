import  * as fnc from "./functions.js";

document.addEventListener('DOMContentLoaded', async function() {
	/* ----------------------------------------------------
	 * Initialize
	 */
	var api_endpoint_url = localStorage.getItem('api_endpoint_url');
	if (api_endpoint_url == null) api_endpoint_url = '';
	document.getElementById('api_endpoint_url').value = api_endpoint_url;

	var api_token = localStorage.getItem('api_token');
	if (api_token == null) api_token = '';
	document.getElementById('api_token').value = api_token;

	var webservice_endpoint_url = localStorage.getItem('webservice_endpoint_url');
	if (webservice_endpoint_url == null) webservice_endpoint_url = '';
	document.getElementById('webservice_endpoint_url').value = webservice_endpoint_url;

	var webservice_token = localStorage.getItem('webservice_token');
	if (webservice_token == null) webservice_token = '';
	document.getElementById('webservice_token').value = webservice_token;

	var backend_type = localStorage.getItem('backend_type');
	if (backend_type == null) backend_type = 'webservice';
	document.getElementById('backend_type').value = backend_type;

	var reload_popup = localStorage.getItem('reload_popup');
	if (reload_popup == null) reload_popup = '1';
	document.getElementById('reload_popup').value = reload_popup;

	var auto_email_info_loading = fnc.autoEmailInfoLoading();
	document.getElementById('auto_email_info_loading').value = auto_email_info_loading;

	var popup_focused = localStorage.getItem('popup_focused');
	if (popup_focused == null) popup_focused = '1';
	document.getElementById('popup_focused').value = popup_focused;

	var remote_data_consent = await fnc.isRemoteDataConsentGranted();
	document.getElementById('remote_data_consent').checked = remote_data_consent;
	updatePrivacyCurrentApiUrl();

	document.getElementById('backend_type').addEventListener('change', updatePrivacyCurrentApiUrl);
	document.getElementById('api_endpoint_url').addEventListener('input', updatePrivacyCurrentApiUrl);
	document.getElementById('webservice_endpoint_url').addEventListener('input', updatePrivacyCurrentApiUrl);

	/* ----------------------------------------------------
	 * Button Save onClick
	 */
	document.getElementById('antispam_button_save').addEventListener('click', async function() {
		var api_endpoint_url = document.getElementById('api_endpoint_url').value;
		fnc.requestSitePermission(api_endpoint_url, graned => {
			if (graned) {
				apiEndpointSave(api_endpoint_url);
			}
		});
		var api_token = document.getElementById('api_token').value;
		localStorage.setItem('api_token', api_token);

		var webservice_endpoint_url = document.getElementById('webservice_endpoint_url').value;
		fnc.requestSitePermission(webservice_endpoint_url, graned => {
			if (graned) {
				webserviceEndpointSave(webservice_endpoint_url);
			}
		});
		var webservice_token = document.getElementById('webservice_token').value;
		localStorage.setItem('webservice_token', webservice_token);

		var backend_type = document.getElementById('backend_type').value;
		localStorage.setItem('backend_type', backend_type);

		var reload_popup = document.getElementById('reload_popup').value;
		localStorage.setItem('reload_popup', reload_popup);

		var auto_email_info_loading = document.getElementById('auto_email_info_loading').value;
		localStorage.setItem('auto_email_info_loading', auto_email_info_loading);

		var popup_focused = document.getElementById('popup_focused').value;
		localStorage.setItem('popup_focused', popup_focused);

		var remote_data_consent = document.getElementById('remote_data_consent').checked;
		await fnc.setRemoteDataConsentGranted(remote_data_consent);
		updatePrivacyCurrentApiUrl();
		showSaveLabel();
	});


});

function apiEndpointSave(api_endpoint_url) {
	localStorage.setItem('api_endpoint_url', api_endpoint_url);
	updatePrivacyCurrentApiUrl();
	showSaveLabel();
}

function webserviceEndpointSave(webservice_endpoint_url) {
	localStorage.setItem('webservice_endpoint_url', webservice_endpoint_url);
	updatePrivacyCurrentApiUrl();
	showSaveLabel();
}

function updatePrivacyCurrentApiUrl() {
	let backend_type = document.getElementById('backend_type').value;
	let endpoint = '';
	if (backend_type == 'api') {
		endpoint = document.getElementById('api_endpoint_url').value.trim();
	} else {
		endpoint = document.getElementById('webservice_endpoint_url').value.trim();
	}
	if (endpoint.length <= 0) {
		endpoint = browser.i18n.getMessage('privacyCurrentApiUrlEmpty');
	}
	document.getElementById('privacy_current_api_url').textContent = endpoint;
}

function showSaveLabel() {
	document.getElementById('antispam_label_save').classList.remove('hide');
	setTimeout(function(){ document.getElementById('antispam_label_save').classList.add('hide'); }, 3000);
}
