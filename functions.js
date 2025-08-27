function extractEmail(email) {
	// Regular expression to find a valid email inside < > or standalone
	const match = email.match(
		/<?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>?/
	);
	return match ? match[1] : null;
}

function getDomainFromEmail(email) {
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

function extractSubdomains(hostname) {
	if (hostname == null) return [];
	const parts = hostname.split(".");
	const result = [];
	for (let i = 0; i <= parts.length - 2; i++) {
		const subdomain = parts.slice(i).join(".");
		result.push(subdomain);
	}
	return result;
}

function extractIPAddresses(text) {
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

function escapeHTML(text) {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

function tableClear(table_id) {
	const table = document.getElementById(table_id);
	const tbody = table.querySelector("tbody");
	tbody.innerHTML = "";
}

function tableAdd(table_id, data) {
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

function requestSitePermission(url, callback) {
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

function toClipboard(text, element) {
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

function formatDate(date) {
	const pad = (n) => String(n).padStart(2, "0");
	const year = date.getFullYear();
	const month = pad(date.getMonth() + 1); // months are 0-11
	const day = pad(date.getDate());
	const hours = pad(date.getHours());
	const minutes = pad(date.getMinutes());
	const seconds = pad(date.getSeconds());
	return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
