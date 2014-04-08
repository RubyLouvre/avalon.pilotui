define(["avalon", "text!avalon.select.html"], function(avalon, menuHTML) {

    //判定是否触摸界面
    var ttt = menuHTML.split("MS_OPTION_STYLE")
    var cssText = ttt[1].replace(/<\/?style>/g, "")
    var styleEl = document.getElementById("avalonStyle")
    var xxx = ttt[0].split("MS_OPTION_BUTTON")
    var buttonHTML = xxx[1]
    menuHTML = xxx[0]
    try {
        styleEl.innerHTML += cssText
    } catch (e) {
        styleEl.styleSheet.cssText += cssText
    }

    var widget = avalon.ui["select"] = function(element, data, vmodels) {
        var options = data.selectOptions
        var list = [], index = 0, els = [], menu, button
        function getOptions(i, el) {
            if (el.tagName === "OPTION") {
                list.push({
                    isOption: true,
                    text: el.text,
                    index: index++,
                    selected: !el.disabled && el.selected,
                    disabled: el.disabled
                })
                els.push(el)
            } else if (el.tagName === "OPTGROUP") {
                list.push({
                    isOption: false,
                    text: el.label,
                    index: 0,
                    selected: false,
                    disabled: true
                })
                els.push(el)
                avalon.each(el.childNodes, getOptions)
            }
        }

        avalon.each(element.childNodes, getOptions)

        menuHTML = menuHTML.replace("MS_OPTION_CAPTION", options.caption)

        function getCaption() {
            if (vmodel.multiple) {
                var l = vmodel.list.filter(function(el) {
                    return el.isOption && el.selected && !el.disabled
                }).length
                return l ? l + " selected" : options.caption
            } else {
                return  element[element.selectedIndex].text
            }
        }
        var vmodel = avalon.define(data.selectId, function(vm) {
            avalon.mix(vm, options)
            vm.list = list
            vm.multiple = element.multiple
            vm.$init = function() {
                menu = avalon.parseHTML(menuHTML).firstChild
                button = avalon.parseHTML(buttonHTML).firstChild

                button.style.minWidth = options.minWidth + "px"
                button.style.width = Math.max(options.minWidth, element.offsetWidth) + "px"
                button.title = element.title

                menu.style.width = button.style.width
                avalon(element).addClass("ui-helper-hidden-accessible")
                
                var canClose = false
                avalon.bind(menu, "mouseleave", function(e) {
                    canClose = true
                })
                avalon.bind(document, "click", function(e) {
                    if (canClose) {
                        vmodel.toggle = false
                    }
                })
                avalon.bind(button, "mouseenter", function(e) {
                    canClose = false
                })
                
                avalon.ready(function() {
                    element.parentNode.insertBefore(button, element.nextSibling)
                    var vmodes = [vmodel].concat(vmodels)
                    avalon.scan(button, vmodes)
                    document.body.appendChild(menu)
                    avalon.scan(menu, vmodes)
                })
            }
            vm.$remove = function() {
                button.innerHTML = menu.innerHTML = ""
                button.parentNode.removeChild(button)
                menu.parentNode.removeChild(menu)
            }

            vm.resetOptions = function() {
                list = [], els = [], index = 0
                avalon.each(element.childNodes, getOptions)
                vmodel.list = list
            }

            vm.toggleMenu = function() {
                vm.toggle = !vm.toggle
            }
            vm.$watch("toggle", function(v) {
                if (v) {
                    var offset = avalon(button).offset()
                    menu.style.top = offset.top + button.offsetHeight + "px"
                    menu.style.left = offset.left + "px"
                    options.onOpen.call(element)
                } else {
                    options.onClose.call(element)
                }
            })
            vm.closeMenu = function(e) {
                e.preventDefault()
                vm.toggle = false
            }
            vm.checkAll = function(e, val) {
                e.preventDefault()
                val = !val
                vm.list.forEach(function(el) {
                    if (el.isOption && !el.disabled) {
                        el.selected = val
                    }
                })
                vm.caption = getCaption()
            }
            vm.unCheckAll = function(e) {
                vm.checkAll(e, true)
            }
            vm.select = function(index) {
                var obj = vm.list[index]
                if (obj) {
                    obj.selected = false
                    vm.changeState(null, obj)
                }
            }
            vm.unselect = function(index) {
                var obj = vm.list[index]
                if (obj) {
                    obj.selected = true
                    vm.changeState(null, obj)
                }
            }
            vm.changeState = function(e, obj) {
                if (!obj.disabled) {//重要技巧,通过e.target == this排除冒泡上来的事件
                    var index = obj.index
                    var option = els[index]
                    if (vm.multiple) {
                        var a = obj.selected
                        option.selected = obj.selected = !a
                    } else {
                        element.selectedIndex = vm.selectedIndex = index
                        option.selected = true
                        setTimeout(function() {
                            vm.toggle = false
                        }, 250)
                    }
                    options.onChange.call(element)
                    vm.caption = getCaption()
                }
            }
        })
        vmodel.caption = getCaption()

        return vmodel
    }
    widget.defaults = {
        minWidth: 225,
        height: 175,
        toggle: false,
        caption: "请选择",
        selectedIndex: 0,
        checkAllText: "全选",
        unCheckAllText: "全不选",
        onChange: avalon.noop, //当它的选项发生改变时的回调
        onOpen: avalon.noop, //下拉框的所有菜单项都显示出来时的回调（点击它）
        onClose: avalon.noop//下拉框的所有菜单项都隐藏出来时的回调（点击它的X按钮）
    }
    return avalon
})
//比较重要的配置项 onOpen, onClose, onChange, list, multiple
//http://www.erichynds.com/examples/jquery-ui-multiselect-widget/demos/#single
