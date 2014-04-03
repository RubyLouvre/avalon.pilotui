/* 
 avalon 1.2.5 2014.4.2
 Bootstrap创始人Mark Otto发布了Bootstrap编码规范 http://codeguide.bootcss.com/
 */
define(["avalon.button", "text!avalon.dialog.html"], function(avalon, dialogHTML) {

    //判定是否支持css position fixed
    var supportFixed = true, initDialogStyle
    new function() {
        var test = document.createElement('div'),
                control = test.cloneNode(false),
                fake = false,
                root = document.body || (function() {
                    fake = true
                    return document.documentElement.appendChild(document.createElement('body'))
                }())
        var oldCssText = root.style.cssText
        root.style.cssText = 'padding:0;margin:0'
        test.style.cssText = 'position:fixed;top:42px'
        root.appendChild(test)
        root.appendChild(control)
        supportFixed = test.offsetTop !== control.offsetTop
        root.removeChild(test)
        root.removeChild(control)
        root.style.cssText = oldCssText
        if (fake) {
            document.documentElement.removeChild(root)
        }
    }
    //遮罩层(全部dialog共用)
    var overlay = avalon.parseHTML('<div class="ui-widget-overlay ui-front">&nbsp;</div>').firstChild
//判定是否支持css3 transform
    var transforms = {//IE9+ firefox3.5+ chrome4+ safari3.1+ opera10.5+
        "transform": "transform",
        "-moz-transform": "mozTransform",
        "-webkit-transform": "webkitTransform",
        "-ms-transform": "msTransform"
    }
    var cssText = " top:50%!important;left:50%!important;", supportTransform = false
    for (var i in transforms) {
        if (transforms[i] in overlay.style) {
            supportTransform = true
            cssText += i + ":translate(-50%, -50%)"
            break
        }
    }
    cssText = "\n.ui-dialog-vertical-center{" + cssText + "}\n.ui-dialog-titlebar {cursor:move;}"

    var widget = avalon.ui.dialog = function(element, data, vmodels) {
        var $element = avalon(element), options = data.dialogOptions

        var dialog = avalon.parseHTML(dialogHTML).firstChild, parentNode

        if (!options.title) {
            options.title = element.title || "&nbsp;"
        }
        options.middle = !!options.middle


        var vmodel = avalon.define(data.dialogId, function(vm) {
            avalon.mix(vm, options)

            vm.$skipArray = ["parent", "modal", "fullScreen"]

            vm.$init = function() {
                //通过CSS3 transform垂直居中
                if (!initDialogStyle) {
                    if (supportTransform) {
                        var styleEl = document.getElementById("avalonStyle")
                        try {
                            styleEl.innerHTML += cssText
                        } catch (e) {
                            styleEl.styleSheet.cssText += cssText
                        }
                    }
                    initDialogStyle = true
                }
                //CSS自适应容器的大小
                if (options.height === "auto") {
                    var style = element.style
                    style.width = style.height = "auto"
                    style.minHeight = element.clientHeight + "px"
                }
                element.msRetain = true //防止被offtree
                vmodel.parent = vmodel.parent === "parent" ? element.parentNode : document.body
                element.parentNode.removeChild(element)

                avalon.ready(function() {
                    $element.addClass("ui-dialog-content ui-widget-content")

                    vmodel.parent.appendChild(dialog)

                    element.removeAttribute("title")

                    dialog.appendChild(element)
                    element.msRetain = false

                    vmodel.fullScreen = /body|html/i.test(dialog.offsetParent.tagName)
                    if (vmodel.fullScreen) {
                   
                        dialog.setAttribute("data-drag-containment", "window")//这是给ms-draggable组件用的
                    }
                    avalon.scan(dialog, [vmodel].concat(vmodels))

                    avalon.nextTick(function() {
                        resetCenter(vmodel, dialog)
                    })
                    //如果支持使用transform实现全屏居中，那么就不需要绑定事件了
                    if (vmodel.fullScreen && supportTransform) {
                        return
                    }
                    avalon(document.body).bind("scroll", function() {
                        resetCenter(vmodel, dialog)
                    })
                    avalon(window).bind("resize", function() {
                        resetCenter(vmodel, dialog)
                    })
                })
            }
            vm.$remove = function() {
                avalon.parent.removeChild(dialog)
                dialog.innerHTML = dialog.textContent = ""
                avalon.Array.remove(overlayInstances, vmodel)
            }

            vm.$close = function() {
                vmodel.toggle = false
            }

            vm.dragHandle = function(e) {
                var el = e.target
                while (el.nodeName != "BODY") {
                    if (/ui-dialog-titlebar/.test(el.className)) {
                        return el
                    } else {
                        el = el.parentNode
                    }
                }
            }
            vm.beforeStart = function(e, data) {
                vm.middle = false
                if (supportTransform) {
                    dialog.style.position = "absolute"
                    var target = avalon(dialog)
                    var startOffset = target.offset()
                    dialog.style.top = startOffset.top - data.marginTop + "px"
                    dialog.style.left = startOffset.left - data.marginLeft + "px"

                    avalon(dialog).removeClass("ui-dialog-vertical-center")

                }
            }
            vm.$watch("toggle", function(v) {
                if (v === false) {
                    avalon.Array.remove(overlayInstances, vmodel)
                    if (!overlayInstances.length) {
                        if (overlay.parentNode) {
                            overlay.parentNode.removeChild(overlay)
                        }
                    }
                } else {
                    resetCenter(vmodel, dialog)
                }
            })
        })

        return vmodel
    }

    widget.defaults = {
        toggle: false, //显示或隐藏弹出层
        fullScreen: false, //全屏显示
        middle: true, //垂直居中
        width: 300,
        height: "auto",
        minHeight: 150,
        minWidth: 150,
        close: avalon.noop,
        parent: "body",
        modal: false
    }
    var overlayInstances = widget.overlayInstances = []
    //============================================

    function keepFocus(target) {
        function checkFocus() {
            var activeElement = document.activeElement
            var isActive = target === activeElement || target.contains(activeElement)
            if (!isActive) {
                if (target.querySelectorAll) {
                    var hasFocus = target.querySelectorAll("[autofocus]")
                    if (!hasFocus.length) {
                        hasFocus = target.querySelectorAll("[tabindex]")
                    }
                    if (!hasFocus.length) {
                        hasFocus = [target]
                    }
                    hasFocus[0].focus()
                }
            }
        }
        checkFocus()
        avalon.nextTick(checkFocus)
    }


    function resetCenter(vmodel, target) {
        if (vmodel.toggle) {
            var parentNode = vmodel.parent
            if (vmodel.middle) {
                if (vmodel.fullScreen) {//如果是基于窗口垂直居中
                    if (supportTransform) {
                        avalon(target).addClass("ui-target-vertical-center")
                    } else if (supportFixed) {
                        target.style.position = "fixed"
                        var l = (avalon(window).width() - target.offsetWidth) / 2
                        var t = (avalon(window).height() - target.offsetHeight) / 2
                        target.style.left = l + "px"
                        target.style.top = t + "px"
                    } else {//  如果是IE6，不支持fiexed，使用CSS表达式
                        target.style.setExpression('top', '( document.body.clientHeight - this.offsetHeight) / 2) + Math.max(document.documentElement.scrollTop,document.body.scrollTop) + "px"')
                        target.style.setExpression('left', '( document.body.clientWidth - this.offsetWidth / 2) +  Math.max(document.documentElement.scrollLeft,document.body.scrollLeft) + "px"')
                    }
                } else {//基于父节点的垂直居中
                    l = (avalon(parentNode).width() - target.offsetWidth) / 2
                    t = (avalon(parentNode).height() - target.offsetHeight) / 2
                    target.style.left = l + "px"
                    target.style.top = t + "px"
                }
            }
            keepFocus(target)
            if (vmodel.modal) {
                parentNode.insertBefore(overlay, target)
                overlay.style.display = "block"
                avalon.Array.ensure(overlayInstances, vmodel)
            }
        }
    }
    return avalon
})

//http://www.slipjs.com/jz.html

/**
 弹出层包含标题栏与内容区两部分，它能被移除，改变大小与通过点击右上角的X按钮进行关闭
 
 如果内容的高度超出内容区的高，那么会自动出现滚动条
 
 我们也可以为它添加按钮栏与遮罩层
 */