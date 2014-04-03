define(["avalon", "avalon.button"], function(avalon, button, spinnerHTML) {
    var initSpinnerStyle
    var widget = avalon.ui.spinner = function(element, data, vmodels) {
        var $element = avalon(element), options = data.spinnerOptions,
      



        vmodel = avalon.define(data.spinnerId, function(vm) {
            vm.min = options.min
            avalon.mix(vm, options)
            vm.$init = function() {
                var span = document.createElement("span")
                span.className = "ui-spinner ui-widget ui-widget-content ui-corner-all"
                var array = spinnerHTML.split("MS_OPTION_STYLE")
                var cssText = array[1].replace(/\<\?style\>/ig, "")
                span.innerHTML = array[0]
                $element.addClass("ui-spinner-input")
                element.autocomplete = "off"
                if (!initSpinnerStyle) {
                    var styleEl = document.getElementById("avalonStyle")
                    try {
                        styleEl.innerHTML += cssText
                    } catch (e) {
                        styleEl.styleSheet.cssText += cssText
                    }
                    initSpinnerStyle = true
                }
                element.parentNode.insertBefore(span, element.nextSibling)
                var fragment = document.createDocumentFragment()
                fragment.appendChild(element)
                var buttons = []
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
                avalon.scan(element, [vmodel].concat(vmodels))
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
        avalon.nextTick(function() {

        })
        return model
    }
    widget.defaults = {
        value: 0,
        min: 1 << 31,
        max: Infinity,
        step: 1
    }
    return avalon
})
/*
 <input ms-ui="spinner" name="value" />
 */