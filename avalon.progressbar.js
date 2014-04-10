define(["avalon"], function(avalon) {

    var widget = avalon.ui.progressbar = function(element, data, vmodels) {
        var options = data.progressbarOptions
        var vmodel = avalon.define(data.progressbarId, function(vm) {
            avalon.mix(vm, options)
            vm.$init = function() {
                avalon(element).addClass("ui-progressbar ui-widget ui-widget-content ui-corner-all")
                element.innerHTML = '<div class="ui-progressbar-value ui-widget-header ui-corner-left" ms-css-width="{{value}}%"></div>'
                avalon.scan(element, [vmodel].concat(vmodels))
            }
            vm.$remove = function() {
                element.innerHTML = ""
            }
        })
        return vmodel
    }
    widget.defaults = {
        value: 0
    }
    return avalon
})
/*
 <div ms-widget="progressbar" data-progressbar-value="37" style="width:50%"></div>
 */
