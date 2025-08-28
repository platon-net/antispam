// console.log("experiment.js bol nacitany");

/*
const { Gloda } = ChromeUtils.importESModule(
	"resource:///modules/gloda/GlodaPublic.sys.mjs"
);
const { GlodaIndexer, IndexingJob } = ChromeUtils.importESModule(
	"resource:///modules/gloda/GlodaIndexer.sys.mjs"
);
// const { GlodaAttrDef } = ChromeUtils.importESModule("resource:///modules/gloda/GlodaDataModel.sys.mjs");
const { GlodaConstants } = ChromeUtils.importESModule(
	"resource:///modules/gloda/GlodaConstants.sys.mjs"
);
*/

const { Sqlite } = ChromeUtils.importESModule(
	"resource://gre/modules/Sqlite.sys.mjs"
);
const path = PathUtils.join(PathUtils.profileDir, "global-messages-db.sqlite");

/*
var MyDomainProvider = {
	name: "antispam-domain-provider",
	providerName: "antispam-domain-provider",
	process(aGlodaMsg, aRawMsgHdr, aCallbackHandle) {
		console.log("Spracovávam správu:", aRawMsgHdr.messageId);
		try {
			let author = aRawMsgHdr.author;
			console.log("Author header:", author);
			let match = author.match(/@([^>]+)/);
			if (match) {
				let domain = match[1].toLowerCase();
				console.log("Extrahovaná doména:", domain);
				aGlodaMsg.setAttribute(senderDomainAttr, domain);
			}
		} catch (e) {
			console.error("Domain extraction failed:", e);
		}
		aCallbackHandle.done();
	},
	enable() {
		console.log("Domain provider enabled");
	},
	disable() {
		console.log("Domain provider disabled");
	},
	workers: [],
	initialSweep() {
		console.log("Domain provider initial sweep");
	},
};

var senderDomainAttr = Gloda.defineAttribute({
	provider: MyDomainProvider,
	extensionName: "antispam@platon.sk",
	attributeType: GlodaConstants.kAttrFundamental,
	attributeName: "senderDomain",
	singular: true,
	subjectNouns: GlodaConstants.NOUN_STRING,
	objectNoun: GlodaConstants.NOUN_NUMBER,
});

console.log("Domain provider registering");
GlodaIndexer.registerIndexer(MyDomainProvider);
*/

const { ExtensionCommon } = ChromeUtils.importESModule(
	"resource://gre/modules/ExtensionCommon.sys.mjs"
);

this.domainProvider = class extends ExtensionCommon.ExtensionAPI {
	getAPI(context) {
		// console.log("Domain provider getAPI");
		return {
			domainProvider: {
				async register() {
					// console.log("Domain provider registered");
				},
				async searchDomain(domain) {
					let db = await Sqlite.openConnection({ path });

					// console.log("Search domain:", domain);
					let rows = await db.execute(
						"SELECT * FROM messagesText_content AS content" +
							" LEFT JOIN messages AS msgs ON msgs.id = content.docid" +
							" WHERE content.c3author LIKE :domain" +
							" OR content.c4recipients LIKE :domain",
						{ domain: `%@${domain}%` }
					);
					// console.log("vysledok:", rows);
					let ret = [];
					for (let row of rows) {
						ret.push({
							docid: row.getResultByName("docid"), //docid,
							body: row.getResultByName("c0body"), //c0body,
							subject: row.getResultByName("c1subject"), //c1subject,
							sender: row.getResultByName("c3author"), //c3author,
							recipients: row.getResultByName("c4recipients"), //c4recipients,
							date: row.getResultByName("date"),
						});
					}

					await db.close();
					return ret;
				},
				async messageBrowserAddCSS(css_filepath) {
					console.log("messageBrowserAddCSS", css_filepath);
					let css_filepath_id =
						"messageBrowserAddCSS-" + simpleHash(css_filepath);
					let message_browser = getMessageBrowser();
					if (message_browser == null) {
						console.warn("Message Browser sa nenašlo.");
						return null;
					}
					let css_element =
						message_browser.contentDocument.getElementById(css_filepath_id);
					if (css_element) {
						css_element.setAttribute("href", css_filepath + "?v=" + Date.now());
					} else {
						let css = message_browser.contentDocument.createElement("link");
						css.setAttribute("id", css_filepath_id);
						css.setAttribute("rel", "stylesheet");
						css.setAttribute("type", "text/css");
						css.setAttribute("href", css_filepath + "?v=" + Date.now());
						message_browser.contentDocument.head.appendChild(css);
					}
				},
				async headerRowClear() {
					let header_row = getHeaderRow();
					header_row.innerHTML = "";
				},
				async headerAddIcon(icon, label, elementID) {
					console.log("headerAddIcon", icon, label);
					let header_row = getHeaderRow();
					let element_icon = header_row.ownerDocument.createElement("span");
					element_icon.setAttribute("class", "headertools-icon");
					if (icon) {
						let element_image = header_row.ownerDocument.createElement("img");
						element_image.setAttribute("class", "headertools-image");
						element_image.setAttribute("src", icon);
						element_image.style.width = "16px";
						element_image.style.height = "16px";
						element_icon.appendChild(element_image);
					}
					if (label) {
						let element_label = header_row.ownerDocument.createElement("span");
						element_label.setAttribute("class", "headertools-label");
						element_label.textContent = label;
						element_icon.appendChild(element_label);
					}
					// element_icon.addEventListener("click", () => {
					// 	console.log("Klik na moju ikonku v hlavičke!");
					// });
					header_row.appendChild(element_icon);
				},
				async headerAddButton(label, icon, elementID) {
					console.log("headerAddButton", label, icon);
					let header_row = getHeaderRow();
					let btn = header_row.ownerDocument.createElement("button");
					btn.setAttribute("class", "headertools-button");
					if (icon) {
						let element_image = header_row.ownerDocument.createElement("img");
						element_image.setAttribute("class", "headertools-image");
						element_image.setAttribute("src", icon);
						element_image.style.width = "16px";
						element_image.style.height = "16px";
						btn.appendChild(element_image);
					}
					if (label) {
						let element_label = header_row.ownerDocument.createElement("span");
						element_label.setAttribute("class", "headertools-label");
						element_label.textContent = label;
						btn.appendChild(element_label);
					}
					// btn.addEventListener("click", () => {
					// 	console.log("Klik na moje tlačidlo v hlavičke!");
					// });
					header_row.appendChild(btn);
				}
			},
		};
	}
};

function simpleHash(str) {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		let chr = str.charCodeAt(i);
		hash = (hash << 5) - hash + chr;
		hash |= 0; // Prevod na 32-bit integer
	}
	return hash;
}

function getMessageBrowser() {
	let win = Services.wm.getMostRecentWindow("mail:3pane");
	// console.log("win", win);
	if (!win) {
		console.warn("Hlavné okno sa nenašlo.");
		return null;
	}
	let mail_panel = win.document.getElementById("mail3PaneTabBrowser1");
	if (!mail_panel) {
		console.warn("Mail Panel sa nenašlo.");
		return null;
	}
	let message_browser =
		mail_panel.contentDocument.getElementById("messageBrowser");
	if (!message_browser) {
		console.warn("Message Browser sa nenašlo.");
		return null;
	}
	return message_browser;
}

function getMessageHeader() {
	let message_browser = getMessageBrowser();
	if (message_browser == null) {
		console.warn("Message Browser sa nenašlo.");
		return null;
	}
	let message_header =
		message_browser.contentDocument.getElementById("messageHeader");
	if (!message_header) {
		console.warn("Message Header sa nenašlo.");
		return null;
	}
	// console.log("message_header", message_header);
	return message_header;
}

function getHeaderRow() {
	let message_header = getMessageHeader();
	if (message_header == null) {
		console.warn("Message Header sa nenašlo.");
		return null;
	}
	let header_row = message_header.querySelector("#antispam-header-row");
	if (!header_row) {
		header_row = message_header.ownerDocument.createElement("div");
		header_row.setAttribute("id", "antispam-header-row");
		message_header.appendChild(header_row);
	}
	return header_row;
}
