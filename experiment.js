// console.log("experiment.js bol nacitany");

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

this.domainProvider = class extends ExtensionAPI {
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
			},
		};
	}
};
