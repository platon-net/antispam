export function extractEmail(email) {
	// Regular expression to find a valid email inside < > or standalone
	const match = email.match(
		/<?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>?/
	);
	return match ? match[1] : null;
}

export function getDomainFromEmail(email) {
	if (Array.isArray(email)) {
		let domains = [];
		for (let i = 0; i < email.length; i++) {
			domains.push(getDomainFromEmail(email[i]));
		}
		return domains.join(", ");
	}
	if (email == null) return null;
	const domain = email.split("@")[1].replace(/[<>]/g, "");
	return domain;
}

export function extractSubdomains(hostname) {
	if (hostname == null) return [];
	const parts = hostname.split(".");
	const result = [];
	for (let i = 0; i <= parts.length - 2; i++) {
		const subdomain = parts.slice(i).join(".");
		result.push(subdomain);
	}
	return result;
}

export function extractIPAddresses(text) {
	let ignored_ip = ["127.0.0.1", "192.168."];
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
		return ips.join(", ");
	}
	if (text == null) return [];
	const ipPattern = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
	const matches = text.match(ipPattern);
	return matches || [];
}

export function escapeHTML(text) {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

export function tableClear(table_id) {
	const table = document.getElementById(table_id);
	const tbody = table.querySelector("tbody");
	tbody.innerHTML = "";
}

export function tableAdd(table_id, data) {
	const table = document.getElementById(table_id);
	const tbody = table.querySelector("tbody");
	const tr = document.createElement("tr");
	for (let i = 0; i < data.length; i++) {
		const td = document.createElement("td");
		if (typeof data[i] == "array") {
			td.innerHTML = data[i].join(", ");
		} else {
			td.innerHTML = data[i];
		}
		tr.appendChild(td);
	}
	tbody.appendChild(tr);
}

export function requestSitePermission(url, callback) {
	const origin = url.replace(/\/?\*?$/, "/*");
	browser.permissions
		.request({
			origins: [origin],
		})
		.then((granted) => {
			if (callback != null) {
				callback(granted);
			}
		});
}

export function toClipboard(text, element) {
	navigator.clipboard
		.writeText(text)
		.then(() => {
			if (element != null) {
				element.classList.add("copied");
				setTimeout(() => {
					element.classList.remove("copied");
				}, 1000);
			}
		})
		.catch((err) => console.error("Chyba pri kopírovaní:", err));
}

export function formatDate(date) {
	const pad = (n) => String(n).padStart(2, "0");
	const year = date.getFullYear();
	const month = pad(date.getMonth() + 1); // months are 0-11
	const day = pad(date.getDate());
	const hours = pad(date.getHours());
	const minutes = pad(date.getMinutes());
	const seconds = pad(date.getSeconds());
	return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export async function extractMessageInfo(message) {
	let ret = {
		sender_subdomains: [],
		recipients_emails: [],
		recipients_subdomains: [],
		replyto_emails: [],
		replyto_subdomains: [],
	};
	let sender_email = extractEmail(message.author);
	ret["sender_email"] = sender_email;
	let sender_domain = getDomainFromEmail(sender_email);
	ret["sender_domain"] = sender_domain;
	// To Info
	if (Array.isArray(message.recipients)) {
		for (let i = 0; i < message.recipients.length; i++) {
			let recipient_email = extractEmail(message.recipients[i]);
			ret["recipients_emails"].push(recipient_email);
			let recipient_domain = getDomainFromEmail(recipient_email);
			let recipient_subdomains = extractSubdomains(recipient_domain);
			for (let i = 0; i < recipient_subdomains.length; i++) {
				ret["recipients_subdomains"].push(recipient_subdomains[i]);
			}
		}
	}
	// Form Info
	let subdomains = extractSubdomains(sender_domain);
	for (let i = 0; i < subdomains.length; i++) {
		ret["sender_subdomains"].push(subdomains[i]);
	}
	let message_part = await messenger.messages.getFull(message.id);
	// console.log(message_part);
	let replyto = message_part.headers["reply-to"];
	if (replyto != null && Array.isArray(replyto) && replyto.length > 0) {
		// console.log("replyto", replyto);
		for (let i = 0; i < replyto.length; i++) {
			let replyto_email = extractEmail(replyto[i]);
			ret["replyto_emails"].push(replyto_email);
			let replyto_domain = getDomainFromEmail(replyto_email);
			let replyto_subdomains = extractSubdomains(replyto_domain);
			for (let i = 0; i < replyto_subdomains.length; i++) {
				ret["replyto_subdomains"].push(replyto_subdomains[i]);
			}
		}
	}
	ret["ipaddresses"] = extractIPAddresses(message_part.headers.received);
	return ret;
}

export function simpleHash(str) {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		let chr = str.charCodeAt(i);
		hash = (hash << 5) - hash + chr;
		hash |= 0; // Prevod na 32-bit integer
	}
	return hash;
}

// Uloží hodnotu pod zložený kľúč
export async function sessionSet(key, value) {
	let storageKey = `antispam_${key}`;
	await browser.storage.session.set({ [storageKey]: value });
}

// Načíta hodnotu podľa zloženého kľúča
export async function sessionGet(key) {
	let storageKey = `antispam_${key}`;
	let result = await browser.storage.session.get(storageKey);
	return result[storageKey] ?? null;
}
