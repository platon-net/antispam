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

function extractIPAddresses(text)  {
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
		td.innerHTML = data[i];
		tr.appendChild(td);
	}
	tbody.appendChild(tr);
}
