document.addEventListener('DOMContentLoaded', function() {
	/* ----------------------------------------------------
	 * Initialize
	 */
	var webservice_endpoint_url = localStorage.getItem('webservice_endpoint_url');
	if (webservice_endpoint_url == null) webservice_endpoint_url = '';
	document.getElementById('webservice_endpoint_url').value = webservice_endpoint_url;

	/* ----------------------------------------------------
	 * Button Save onClick
	 */
	document.getElementById('antispam_button_save').addEventListener('click', function() {
		var webservice_endpoint_url = document.getElementById('webservice_endpoint_url').value;
		localStorage.setItem('webservice_endpoint_url', webservice_endpoint_url);
		document.getElementById('antispam_label_save').classList.remove('hide');
		setTimeout(function(){ document.getElementById('antispam_label_save').classList.add('hide'); }, 3000);
	});


});
