

/* ==== folder upload handler ==== */

const Folder_Form = document.getElementById('folder-submission-form');

Folder_Form.addEventListener("submit", folder_form_upload_handler);

function folder_form_upload_handler(event) {
    try{
        event.preventDefault();
        upload_folder_data_handler();
    } catch(error) {
        console.error("Upload failed:", error)
    }
}
async function upload_folder_data_handler() {
    const port = 5000;
    const url = `http://127.0.0.1:${port}/invoices/batch"`

    const response = await fetch(url);
}
    