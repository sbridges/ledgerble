/**
 * options settings
 */


const settings = require("settings-store")


class Setting {
    constructor(propName, def, help, displayName, type) {
        this.propName = propName;
        this.def = def;
        this.help = help;
        this.displayName = displayName;
        this.type = type;
        this.domId = propName.replace(/\./g, '_');
    }

}

const FILE = 'file'
const STRING = 'string'
const BOOL = 'bool'

const allSettings = [
    new Setting("options.ledger.command", "ledger", "The command to use to parse your journal files<br>This must be an absolute path, or on the PATH", "Ledger command", FILE),
    new Setting("options.hledger", false, "HLedger or ledger", "Ledger command is HLedger", BOOL)

]

function initSettings() {

    let htmlSettings = [];
    htmlSettings.push(`
        <style>
        #settings-table table {
            border-collapse: collapse;
          }
          
          #settings-table table, th, td {
            border: 1px solid #d4d4d4;
          }

          #settings-table th, td {
            padding: 3px;
          }

          #settings-table tr {
            text-align:center
          }

          #settings-table td {
            text-align:left
          }

          
          
          
        </style>
    `)
    htmlSettings.push("<table id='settings-table'><th>Setting</th><th >Value</th><th >Description</th><th></th></tr>");

    for (s of allSettings) {
        htmlSettings.push("<tr>")
        htmlSettings.push(`<td>${s.displayName}</td>`)
        if (s.type === FILE) {
            htmlSettings.push(`<td>
            <input type="text" id="${s.domId}" size="25">
            <input type="file" id="${s.domId}_file" style="display: none;" />
            <input type="button" id="${s.domId}_browse" value="Browse..." />
            </td>`  )
        } else if (s.type == BOOL) {
            htmlSettings.push(`
            <td><input type="checkbox" id="${s.domId}"></input></td>`)
        } else {
            throw 'fail'
        }
        htmlSettings.push(`<td>${s.help}</td>`);
        htmlSettings.push(`<td><input type="button" id="${s.domId}_reset" value="Use Default" /></td>`)
        htmlSettings.push("</tr>")
    }


    htmlSettings.push("</table>")
    $('#settingsDiv').html(htmlSettings.join('\n'))

    for (const s of allSettings) {
        let save = null;
        let val = getSetting(s.propName)
        if (s.type === FILE) {
                $(`#${s.domId}`).val(val)
                save = () => {
                    settings.setValue(s.propName, $(`#${s.domId}`).val())
                }
                 $(`#${s.domId}_browse`).click(() => {
                    document.getElementById(`${s.domId}_file`).click();
                })
                $(`#${s.domId}_file`).change(() => {
                    $(`#${s.domId}`).val(document.getElementById(`${s.domId}_file`).files[0].path)
                    save()
                })
                $(`#${s.domId}`).change(() => {
                    save()
                })

        } else if(s.type == BOOL) {
            save = () => {
                settings.setValue(s.propName, $(`#${s.domId}`).is(":checked"))
            }
            $(`#${s.domId}`).prop('checked', val)
            $(`#${s.domId}`).change(() => {
                 save()
            })
        } else {
            throw 'fail'
        }


        $(`#${s.domId}_reset`).click(() => {
            if (s.type === FILE) {
                $(`#${s.domId}`).val(s.def)
            } else if(s.type == BOOL) {
                $(`#${s.domId}`).prop('checked', s.def)
            } else {
                throw 'fail'
            }
            save()

        })
    }


}


function getSetting(setting) {
    for (s of allSettings) {
        if (setting === s.propName) {
            return settings.value(setting, s.default)
        }
    }
    throw "no setting:" + setting
}

module.exports = { initSettings, getSetting }