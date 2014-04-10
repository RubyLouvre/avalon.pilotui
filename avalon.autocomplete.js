define(["avalon", "text!avalon.autocomplete.html"], function(avalon, sourceHTML) {

    var widget = avalon.ui.autocomplete = function(element, data, vmodels) {

        var $element = avalon(element),
                refreshList,
                tempValue = ""
        //处理配置
        var options = data.autocompleteOptions
        var source = options.source || []

        var vmodel = avalon.define(data.autocompleteId, function(vm) {
            avalon.mix(vm, options)
            vm.show = false
            vm.selectedIndex = -1
            vm.value = element.value
            vm.matcher = []
            vm.source = source
            vm.skipArray = ["source"]
            vm.overvalue = ""
            vm.get = function(value) {
                vm.overvalue = value
            }
            vm.$watch("value", function(value) {
                if (refreshList !== false) { //flagKeyup是控制datalist的刷新
                    vmodel.show = true
                    tempValue = value
                    var lower = []
                    var matcher = vm.source.filter(function(el) {
                        if (el.indexOf(value) === 0) {
                            return el //最精确
                        }
                        if (el.toLowerCase().indexOf(value.toLowerCase()) === 0) {
                            lower.push(el) //不区分大小写
                        }
                    })
                    lower = matcher.concat(lower)
                    var query = value.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&')
                    var strongRegExp = new RegExp('(' + query + ')', 'ig')
                    if (lower.length) {
                        vm.matcher = lower.slice(0, options.items)
                    } else { //模糊匹配,只要它中间有这些字母就行
                        vm.matcher = source.filter(function(el) {
                            return strongRegExp.test(el)
                        })
                    }
                }
            })
            vm.$init = function() {
                var sourceList = avalon.parseHTML(sourceHTML).firstChild
                avalon.bind(sourceList, "click", function() {
                    vmodel.value = vmodel.overvalue
                })
                function adjustPosition() {
                    var offset = $element.offset()
                    sourceList.style.width = element.clientWidth + "px"
                    sourceList.style.left = offset.left + "px"
                    sourceList.style.top = offset.top + element.offsetHeight + "px"
                    sourceList.style.zIndex = 9999
                    if (avalon(document).height() - 200 > offset.top) {
                        var pageY = sourceList.offsetHeight + parseFloat(sourceList.style.top)
                        window.scrollTo(pageY + 50, 0)
                    }
                }
                $element.bind("focus", adjustPosition)
                $element.bind("blur", function() {
                    setTimeout(function() {
                        refreshList = vmodel.show = false //隐藏datalist
                    }, 250)
                })
                $element.bind("keyup", function(e) {
                    if (/\w/.test(String.fromCharCode(e.which))) { //如果是字母数字键
                        refreshList = true //这是方便在datalist显示时,动态刷新datalist
                        vmodel.value = element.value //触发$watch value回调
                    } else {
                        refreshList = false
                        switch (e.which) {
                            case 8:
                                refreshList = true//回退键可以引发列表刷新
                                break
                            case 13:
                                tempValue = vmodel.value
                                refreshList = vmodel.show = false
                                break
                            case 38:
                                // up arrow
                                --vmodel.selectedIndex
                                if (vmodel.selectedIndex === -2) {
                                    vmodel.selectedIndex = vmodel.matcher.length - 1
                                }
                                var value = vmodel.matcher[vmodel.selectedIndex]
                                vmodel.value = value === void 0 ? tempValue : value
                                break

                            case 40:
                                // down arrow
                                ++vmodel.selectedIndex
                                if (vmodel.selectedIndex === vmodel.matcher.length) {
                                    vmodel.selectedIndex = -1
                                }
                                var value = vmodel.matcher[vmodel.selectedIndex]
                                vmodel.value = value === void 0 ? tempValue : value
                                break
                        }
                    }
                })


                avalon.ready(function() {
                    element.setAttribute("ms-duplex", "value")
                    document.body.appendChild(sourceList)
                    adjustPosition()
                    var models = [vmodel].concat(vmodels)
                    avalon.scan(element, models)
                    avalon.scan(sourceList, models)
                })
            }
        })

        return vmodel
    }
    widget.defaults = {
        items: 8
    }
    return avalon
})