<img src="images/icon2.svg" width="32" height="32" alt="Logo"> Antispam
========

Send e-mail metadata from Thunderbird to an Antispam backend.

Installation from Mozilla Addons
================================

Go to [https://addons.thunderbird.net/sk/thunderbird/addon/antispam/](https://addons.thunderbird.net/sk/thunderbird/addon/antispam/) or search "Platon Antispam".

Installation from file
======================

* In Thunderbird, open a new tab with `about:config`, search for `xpinstall.signatures.required`, and set it to `false`.
* Download `build/thunderbird/Antispam.latest_version.zip`.
* In Thunderbird, open add-ons and install the downloaded ZIP file.

Features
========

The extension can inspect sender, recipient, reply-to, subject, and received IP metadata for displayed messages, send selected metadata to the Antispam backend, create backend rules, and move messages to configured folders.

Configuration
=============

Open the extension options page to configure backend connectivity and general behavior.

API settings
------------

| Setting | Storage key | Values | Description |
| --- | --- | --- | --- |
| API URL | `api_endpoint_url` | URL | Base URL of the modern API backend. Example: `https://antispam.example.com/api` |
| API Token | `api_token` | string | Authentication token used for API access. When set, requests send it as `Authorization: Bearer <token>`. |

New integrations should use API mode.

Webservice settings (legacy, deprecated)
----------------------------------------

Legacy webservice support is deprecated and will be removed in a future version. It exists only for backward compatibility with older deployments. New integrations should use the API backend.

| Setting | Storage key | Values | Description |
| --- | --- | --- | --- |
| Webservice URL | `webservice_endpoint_url` | URL | Legacy webservice endpoint URL. Requests are sent to this URL with `?ws=antispam`. |
| Webservice Token | `webservice_token` | string | Legacy token sent as a form field named `token`. |

General settings
----------------

| Setting | Storage key | Values | Default | Description |
| --- | --- | --- | --- | --- |
| Backend Type | `backend_type` | `api`, `webservice` | `webservice` | Selects whether backend calls use the modern API or deprecated legacy webservice compatibility mode. Prefer `api`. |
| Refresh popup window when changing the displayed email | `reload_popup` | `1` = yes, `0` = no | `1` | When enabled, an already opened popup is refreshed for the newly displayed message. |
| Automatic email info loading | `auto_email_info_loading` | `1` = yes, `0` = no | `1` | When enabled, email info is automatically preloaded when messages are displayed. When disabled, no background preload runs; info is loaded only when explicitly requested, for example when opening the popup. |
| Focus popup window when refreshing it | `popup_focused` | `1` = yes, `0` = no | `1` | When enabled, the refreshed popup window is focused. |

Privacy and data processing
---------------------------

The add-on requires an explicit opt-in before it sends email data to a remote backend.

| Setting | Storage key | Values | Default | Description |
| --- | --- | --- | --- | --- |
| Remote data processing consent | `antispam_remote_data_consent` | `1` = consent granted, `0` = consent not granted | `0` | When disabled, the add-on shows a local error and does not call the remote API or legacy webservice. |

The options page includes a "Privacy & Data Processing" section with the consent checkbox, the current configured backend URL, a list of data that may be sent, and add-on-specific Privacy Policy text.

Popup preferences
-----------------

The popup also stores user convenience choices:

| Preference | Storage key | Description |
| --- | --- | --- |
| Quick move folders | `quick_move_folders` | List of folder IDs shown as quick move choices in the popup. |
| Last selected move folder | `antispam_move_folder_id` | Last selected move target, stored via `browser.storage.local`. |

API endpoints
=============

The extension currently uses only JSON `POST` requests for backend API integration. No backend `GET` endpoints are used by the current implementation.

All API requests use the configured API URL as the base URL. If `api_token` is configured, the request includes:

```http
Authorization: Bearer <api_token>
Accept: application/json
Content-Type: application/json
```

Responses are expected to be JSON. The extension treats a response with `status: "OK"` as successful and reads the payload from `data`. Error responses are expected to provide `msg`.

### POST /antispam/maildata

Purpose: Store email metadata in the Antispam backend.

Used for: The popup action that sends the currently displayed message metadata to the backend.

Request body:

```json
{
	"maildata": {
		"...": "extracted message metadata"
	}
}
```

Expected response shape:

```json
{
	"status": "OK",
	"data": {}
}
```

On failure:

```json
{
	"status": "ERROR",
	"msg": "Error message"
}
```

### POST /antispam/maildata/check

Purpose: Check extracted email metadata against Antispam rules.

Used for: Automatic message-display preload and popup-triggered on-demand loading of email info.

Request body:

```json
{
	"maildata": {
		"...": "extracted message metadata"
	}
}
```

Expected response shape:

```json
{
	"status": "OK",
	"data": {
		"msg": "Result message",
		"count": 0,
		"count_enabled": 0,
		"rules": []
	}
}
```

Rule objects in `data.rules` are expected to include at least `rule_id`, `pattern`, and `enabled`.

### POST /antispam/rules

Purpose: Create or update an Antispam rule.

Used for: Popup rule actions for sender email, sender domain, reply-to, recipient, and related extracted values.

Request body:

```json
{
	"type": "sender_domain",
	"pattern": "example.com"
}
```

Expected response shape:

```json
{
	"status": "OK",
	"data": {}
}
```

Legacy webservice compatibility
===============================

Legacy webservice integration is deprecated and will be removed in a future version. It remains available only for existing deployments that have not migrated yet.

When `backend_type` is set to `webservice`, the extension sends `POST` form-data requests to:

```text
<webservice_endpoint_url>?ws=antispam
```

The request includes the configured `webservice_token` as the `token` form field and one of these `action` values:

| Action | Purpose |
| --- | --- |
| `addMaildata` | Store email metadata. |
| `checkMaildata` | Check email metadata against rules. |
| `emailrule` | Create or update an Antispam rule. |

Legacy webservice responses are expected to follow the same high-level structure as API responses: `status: "OK"` with `data`, or an error status with `msg`.

Migration direction
===================

Use API mode for all new deployments. Existing webservice integrations should migrate to the API endpoints listed above and switch `backend_type` to `api` after the API URL and token are configured.

Privacy
=======

The extension processes message metadata such as sender, recipients, reply-to values, received IP addresses, and related domains. The current backend requests do not send the message subject, message body, selected body text, attachments, or full message headers.

Email metadata is sent to the configured Antispam backend only after the user enables the opt-in consent checkbox in the options page. With consent disabled, remote spam analysis and rule API calls are blocked locally before `fetch` is reached.

The add-on-specific Privacy Policy is available in `privacy-policy.txt` and is also summarized directly in the options page.
