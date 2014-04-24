define(["avalon", "text!avalon.autocomplete.html"], function(avalon, popupHTML) {

    var widget = avalon.ui.autocomplete = function(element, data, vmodels) {
        //处理配置
        var options = data.autocompleteOptions
        if (!options.popupHTML) {
            options.popupHTML = popupHTML
        }
        var popup, keyupCallback, blurCallback
        var lastModified = new Date - 0//上次更新时间
        var vmodel = avalon.define(data.autocompleteId, function(vm) {
            avalon.mix(vm, options)
            vm.$skipArray = ["at", "widgetElement", "datalist", "popupHTML"]
            vm.widgetElement = element

            vm.$init = function() {
                var _vmodels = [vmodel].concat(vmodels)
                blurCallback = avalon(element).bind("blur", function(e) {
                    if (!vmodel.$model.__mouseenter__ && vmodel.toggle) {
                        vmodel.toggle = false
                    }
                })
                keyupCallback = avalon(element).bind("keyup", function(e) {
                    var str = this.value.replace(/\s+$/g, "")
                    if (str && str.charAt(0) !== " ") {
                        var query = vmodel.query = str
                        if (!vmodel.toggle) {
                            if (query !== this.value) {
                                element.value = query//让光标定位在文字的最后
                                element.focus()
                                if (element.createTextRange) {
                                    var range = element.createTextRange(); //建立文本选区   
                                    range.moveStart('character', query.length);
                                    range.collapse(true);
                                    range.select()
                                }
                            }
                            //创建弹出层
                            popup = vmodel.$popup()

                            vmodel.activeIndex = 0 //重置高亮行
                            avalon.scan(popup, _vmodels)

                            avalon(popup).bind("mouseleave", function() {
                                vmodel.$model.__mouseenter__ = false
                            })
                        }

                        function callback() {
                            //对请求回来的数据进笨过滤排序
                            var datalist = vmodel.$filter(vmodel)
                            var toString = datalist.join(",")
                            //只有发生改动才同步视图
                            if (vmodel.$model.__toString__ !== toString) {
                                //添加高亮
                                datalist = datalist.map(function(el) {
                                    return vmodel.$highlight(el, query)
                                })
                                vmodel._datalist = datalist
                                vmodel.$model.__toString__ = toString
                            }
                            vmodel.toggle = !!datalist.length
                            if (!vmodel.toggle) {
                                popup.parentNode.removeChild(popup)
                            }
                        }

                        var now = new Date//时间闸
                        if (lastModified - now > vmodel.delay && typeof vmodel.$update === "function") {
                            //远程请求数据，自己实现remoteFetch方法，主要是改变datalist数组，然后在调用callback
                            vmodel.$update(callback)
                            lastModified = now
                        }
                        callback()
                        //用户在用键盘移动时，mouseenter将失效
                        vmodel.$model.__keyup__ = true
                        moveIndex(e, vmodel)
                        setTimeout(function() {
                            vmodel.$model.__keyup__ = false
                        }, 150)
                    }

                })
                avalon.scan(element, _vmodels)
            }
            vm.$popup = function() {
                var menu = avalon.parseHTML(options.popupHTML).firstChild
                document.body.appendChild(menu)

                var offset = avalon(element).offset()
                menu.style.width = element.clientWidth + "px"
                menu.style.left = offset.left + "px"
                menu.style.top = offset.top + element.offsetHeight + "px"
                menu.style.zIndex = 9999
                if (avalon(document).height() - 200 > offset.top) {
                    var pageY = menu.offsetHeight + parseFloat(menu.style.top)
                    window.scrollTo(pageY + 50, 0)
                }
                return menu
            }
            vm.$hover = function(e, index) {
                e.preventDefault()
                var model = vmodel.$model
                model.__mouseenter__ = true
                if (!model.__keyup__) {
                    vm.activeIndex = index
                }
            }
            vm.$watch("toggle", function(v) {
                if (v === false && popup && popup.parentNode) {
                    popup.parentNode.removeChild(popup)
                    popup = null
                }
            })
            vm.$select = function(e) {
                e.stopPropagation()
                e.preventDefault()
                var query = vmodel._datalist[ vmodel.activeIndex ]
                var span = document.createElement("span")
                span.innerHTML = query
                query = span.textContent || span.innerText//去掉高亮标签
                var value = element.value
                var index = value.lastIndexOf(vmodel.query)
                //添加一个特殊的空格,让aaa不再触发 <ZWNJ>，零宽不连字空格
                element.value = value.slice(0, index) + query
                element.focus()//聚集到最后
                //销毁菜单
                vmodel.toggle = false

            }


            vm.$remove = function() {
                avalon(element).unbind("keyup", keyupCallback).unbind("blur", blurCallback)
                vm.toggle = false
            }
        })

        return vmodel
    }
    widget.defaults = {
        datalist: [], //字符串数组，不可监控，(名字取自HTML的datalist同名元素)
        _datalist: [], //实际是应用于模板上的字符串数组，它里面的字符可能做了高亮处理
        popupHTML: "", //弹出层的模板，如果为空，使用默认模板，注意要在上面添加点击或hover处理
        toggle: false, //用于控制弹出层的显示隐藏
        activeIndex: 0, //弹出层里面要高亮的列表项的索引值
        query: "", //@后的查询字符串
        limit: 5, //弹出层里面总共有多少个列表项
        delay: 500, //我们是通过$update方法与后台进行AJAX连接，为了防止输入过快导致频繁，需要指定延时毫秒数
        //远程更新函数,与后台进行AJAX连接，更新datalist，此方法有一个回调函数，里面将执行$filter、$highlight操作
        $update: avalon.noop,
        //用于对datalist进行过滤排序，将得到的新数组赋给_datalist，实现弹出层的更新
        $filter: function(opts) {
            //opts实质上就是vmodel，但由于在IE6-8下，this不指向调用者，因此需要手动传vmodel
            var unique = {}, query = opts.query, lowquery = query.toLowerCase()
            //精确匹配的项放在前面
            var datalist = opts.datalist.filter(function(el) {
                if (el.indexOf(query) === 0) {
                    unique[el] = 1
                    return true
                }
            })
            //模糊匹配的项放在后面
            opts.datalist.forEach(function(el) {
                var str = el.toLowerCase()
                if (!unique[el]) {
                    if (str.indexOf(lowquery) > -1) {
                        unique[el] = 1
                        datalist.push(el)
                    }
                }
            })
            return datalist.slice(0, opts.limit) //对显示个数进行限制
        },
        //用于对_datalist中的字符串进行高亮处理，item为_datalist中的每一项，str为查询字符串
        $highlight: function(item, str) {
            var query = escapeRegExp(str)
            return item.replace(new RegExp('(' + query + ')', 'ig'), function($1, match) {
                return '<strong style="color:#FF6600;">' + match + '</strong>'
            })
        }
    }

    function escapeRegExp(str) {
        return str.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&')
    }
    //通过监听textarea,input的keyup进行，移动列表项的高亮位置
    function moveIndex(e, vmodel) {
        switch (e.keyCode) {
            case 13:
                // enter
                vmodel.$select(e)
                break;
            case 9:
                // tab
            case 27:
                // escape
                e.preventDefault();
                break;
            case 38:
                // up arrow
                e.preventDefault();
                var index = vmodel.activeIndex - 1
                if (index < 0) {
                    index = vmodel.limit - 1
                }
                vmodel.activeIndex = index
                break;
            case 40:
                // down arrow
                e.preventDefault();
                var index = vmodel.activeIndex + 1
                if (index === vmodel.limit) {
                    index = 0
                }
                vmodel.activeIndex = index
                break;
        }
    }
    return avalon
})