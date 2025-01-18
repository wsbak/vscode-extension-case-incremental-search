// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

(function () {
    const mmi = new mmi_media.MediaMmi();
    mmi.mediaInit();
}());
