define(["avalon", "avalon.button", "text!avalon.spinner.html"], function(avalon, button, spinnerHTML) {

    var widget = avalon.ui.spinner = function(element, data, vmodels) {
        var options = data.spinnerOptions

        var vmodel = avalon.define(data.spinnerId, function(vm) {

            avalon.mix(vm, options)
            vm.$skipArray = ["widgetElement"]
            vm.$init = function() {
                var span = document.createElement("span")
                span.className = "ui-spinner ui-widget ui-widget-content ui-corner-all"
                var array = spinnerHTML.split("MS_OPTION_STYLE")

                span.innerHTML = array[0]
                element.autocomplete = "off"
                avalon(element).addClass("ui-spinner-input")

                element.parentNode.insertBefore(span, element.nextSibling)
                var fragment = document.createDocumentFragment()
                fragment.appendChild(element)
                var buttons = [], el
                while (el = span.firstChild) {
                    if (el.tagName === "A") {
                        buttons.push(el)
                    }
                    fragment.appendChild(el)
                }
                element.setAttribute("ms-attr-value", "value")
                element = span//偷天换日

                buttons[0].setAttribute("ms-click", "addNumber")
                buttons[1].setAttribute("ms-click", "reduceNumber")
                element.appendChild(fragment)
                vm.widgetElement = element
                avalon.scan(element, [vmodel].concat(vmodels))
            }
            vm.$remove = function() {
                var elem = vm.widgetElement
                elem.innerHTML = elem.textContent = ""
            }
            vm.addNumber = function(e) {
                e.preventDefault()
                vm.value += vm.step
                if (vm.value > vm.max) {
                    vm.value = vm.max
                }
            }
            vm.reduceNumber = function(e) {
                e.preventDefault()
                vm.value -= vm.step
                if (vm.value < vm.min) {
                    vm.value = vm.min
                }
            }
        })

        return vmodel
    }
    widget.defaults = {
        value: 0,
        min: 1 << 31,
        max: Infinity,
        step: 1,
        widgetElement: {}
    }
    return avalon
})
/*
 <input ms-ui="spinner" name="value" />
 */