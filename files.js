/**
 * Maintains the file selection
 */

const input = document.getElementById("fileSelector")
const settings = require("settings-store")
const { basename } = require('path')
const { initSettings, getLedgerCommand } = require('./options')

let fileNumber = 1;

function filesInit() {
    input.addEventListener('change', () => {
        addFile(input.files[0].path)
        saveFilesList()
    });

    //https://stackoverflow.com/questions/1163667/how-to-rename-html-browse-button-of-an-input-type-file
    $('#addFileButton').click(function (e) {
        e.preventDefault(); // prevents submitting
        $('#fileSelector').trigger('click');
    });

    $('#reloadFileButton').click(function (e) {
        reloadFiles();
    });

    for (f of settings.value("files.list", [])) {
        addFile(f)
    }
    
    if(getCurrentPaths().length == 0) {
        $(`<div class="alert  alert-dismissible fade show alert-warning" role="alert">
        Use the Files menu to select one or more journal files.
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>`).prependTo('body')
    }
}

function reloadFiles() {
    for (path of getCurrentPaths()) {
        ipc.send("parse", getLedgerCommand(), path)
    }
}



function saveFilesList() {
    settings.setValue("files.list", getCurrentPaths())
}

function getCurrentPaths() {
    paths = [];
    for (d of document.querySelectorAll('[id^="fileRow"]')) {
        paths.push(d.path);
    }
    return paths
}


function alertCantparse(file, error) {
    for (d of document.querySelectorAll('[id^="fileRow"]')) {

        if (d.path === file) {
            document.getElementById('enable' + d.id).checked = false
        }
    }
    $(`<div class="alert  alert-dismissible fade show alert-danger" role="alert">
    can't parse ${escapeHtml(file)} <br>${escapeHtml(error)}
    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
      <span aria-hidden="true">&times;</span>
    </button>
  </div>`).prependTo('body')

}

function addFile(path) {
    if (getCurrentPaths().indexOf(path) !== -1) {
        return;
    }
    const id = `fileRow${fileNumber++}`
    const newItem = document.createElement('a')
    newItem.innerHTML =
        `<div style='display:flex;  justify-content:space-between; align-items:center; '>
        <label><input id='enable${id}' type="checkbox" value="" checked )>
        ${escapeHtml(basename(path))}&nbsp;&nbsp;&nbsp;&nbsp; </label>
        <button class="btn btn-warning" id="remove${id}">Close</button> 
        </div>`
    newItem.classList.add('dropdown-item');
    newItem.href = '#'
    newItem.id = id
    newItem.path = path

    document.getElementById('filesListDropDown').insertBefore(
        newItem,
        document.getElementById('filesDropDownDivider'))

    document.getElementById('enable' + id).addEventListener("click", function () {
        enableFileById(id)
    });
    document.getElementById('remove' + id).addEventListener("click", function () {
        removeFileById(id)
    });

    ipc.send("parse", getLedgerCommand(), path)


}

function removeFileById(id) {
    const element = document.getElementById(id)
    const path = element.path
    element.remove();
    saveFilesList()
    state.files.delete(path)
    update()

}

function enableFileById(id) {
    const element = document.getElementById(id)
    const path = element.path
    enabled = document.getElementById('enable' + id).checked
    if (enabled) {
        ipc.send("parse", getLedgerCommand(), path)
    } else {
        state.files.delete(path)
        update()
    }

}



module.exports = { filesInit, alertCantparse }