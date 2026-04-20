

/* ==== folder upload handler ==== */

const Folder_Form = document.getElementById('folder-submission-form');

Folder_Form.addEventListener("submit", folder_form_upload_handler);

function folder_form_upload_handler(event) {
    try{
        event.preventDefault();
        upload_folder_data_handler();
    } catch(error) {
        console.error("Upload failed:", error);
    }
}

async function upload_folder_data_handler() {
    try{
        const port = 8000;
        const url = `http://127.0.0.1:${port}/invoices/batch`

        if(Folder_Form) {
            // -- get the file input element from the form --
            // -- read its file collection.
            // -- early-return if no files are selected.
            
            const formData = new FormData(Folder_Form);
            
            if(!formData.get('folder')) {
                throw new Error("no file submitted");
            }

            // send the file list over to the backend server
            const requestInit = {
                method: "POST",
                body: formData
            };

            const response = await fetch(url, requestInit);
            
        } else {
            throw new Error("cannot fetch folder form");
        }
    } catch(error) {
        console.log("upload form failed: ", error);
    }

}
    