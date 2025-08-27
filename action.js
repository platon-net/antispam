// console.log("Hello from analyze.js");

document.addEventListener("DOMContentLoaded", function () {
	/* ----------------------------------------------------
	 * Initialize
	 */

	/* ----------------------------------------------------
	 * Button Run Analyze onClick
	 */
	document
		.getElementById("antispam_button_run_analyze")
		.addEventListener("click", async function () {
			let tabs = await browser.tabs.query({ active: true, currentWindow: true });
			const tab = tabs[0];
			// console.log('tab', tab);
			if (tab.type != 'mail') {
				alert('Active TAB is not mailbox.');
				return false;
			}
			const tab_info = await browser.mailTabs.get(tab.id);
			// console.log('tab_info', tab_info);
			const folderID = tab_info.displayedFolder.id;
			const url = new URL(browser.runtime.getURL("tabAnalyze.html"));
			url.searchParams.set("folder_id", folderID);
			await messenger.tabs.create({
				url: url.href,
			});
		});

	/* ----------------------------------------------------
	 * Button Search Domain onClick
	 */
	document
		.getElementById("antispam_button_search_domain")
		.addEventListener("click", async function () {
			let count = await browser.domainProvider.searchDomain("exitapi.com");
			console.log(count);
		});
});
