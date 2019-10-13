/**
 * code to toggle between two divs
 */


function setupToggle(a1, a2, div1, div2) {
    a1.onclick = () => {
        return display(a1, a2, div1, div2)
    }
    a2.onclick = () => {
        return display(a2, a1, div2, div1)
    }
    display(a1, a2, div1, div2)
}


function display(a1, a2, div1, div2) {
    a1.removeAttribute('href')
    a2.href = '#'
   

    div1.style.display = 'block'
    div2.style.display = 'none'

    return false

}

module.exports = setupToggle