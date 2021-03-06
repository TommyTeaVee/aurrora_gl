

Hydra.ready(function() {
    

    
    window.__window = $(window);

    
    window.__document = $(document);

    
    window.__body = $(document.getElementsByTagName('body')[0]);

    
    window.Stage = !!window.Stage && !!window.Stage.style ? $(window.Stage) : __body.create('#Stage');

    Stage.size('100%');
    Stage.__useFragment = true;
    Stage.width = document.body.clientWidth || document.documentElement.offsetWidth || window.innerWidth;
    Stage.height = document.body.clientHeight || document.documentElement.offsetHeight || window.innerHeight;
});


Class(function CSS() {
    var _this = this;
    var _obj, _style, _needsUpdate;
 
    
    Hydra.ready(function() {
        _style = '';
        _obj = document.createElement('style');
        _obj.type = 'text/css';
        document.getElementsByTagName('head')[0].appendChild(_obj);   
    });
    
    function objToCSS(key) {
        var match = key.match(/[A-Z]/);
        var camelIndex = match ? match.index : null;
        if (camelIndex) {
            var start = key.slice(0, camelIndex);
            var end = key.slice(camelIndex);
            key = start+'-'+end.toLowerCase();
        }
        return key;
    }
    
    function cssToObj(key) {
        var match = key.match(/\-/);
        var camelIndex = match ? match.index : null;
        if (camelIndex) {
            var start = key.slice(0, camelIndex);
            var end = key.slice(camelIndex).slice(1);
            var letter = end.charAt(0);
            end = end.slice(1);
            end = letter.toUpperCase() + end;
            key = start + end;
        }
        return key;
    }
    
    function setHTML() {
        _obj.innerHTML = _style;
        _needsUpdate = false;
    }

    this._read = function() {
        return _style;
    };
    
    this._write = function(css) {
        _style = css;
        if (!_needsUpdate) {
            _needsUpdate = true;
            defer(setHTML);
        }
    };

    
    this.style = function(selector, obj) {
        var s = selector + ' {';
        for (var key in obj) {
            var prop = objToCSS(key);
            var val = obj[key];
            if (typeof val !== 'string' && key != 'opacity') val += 'px';
            s += prop+':'+val+'!important;';
        }
        s += '}';
        _this._write(_style + s);
    };

    
    this.get = function(selector, prop) {
        var values = new Object();
        var string = _obj.innerHTML.split(selector+' {');
        for (var i = 0; i < string.length; i++) {
            var str = string[i];
            if (!str.length) continue;
            var split = str.split('!important;');
            for (var j in split) {
                if (split[j].includes(':')) {
                    var fsplit = split[j].split(':');
                    if (fsplit[1].slice(-2) == 'px') {
                        fsplit[1] = Number(fsplit[1].slice(0, -2));
                    }
                    values[cssToObj(fsplit[0])] = fsplit[1];
                }
            }  
        }
        
        if (!prop) return values;
        else return values[prop];
    };

    
	this.textSize = function($obj) {
	    var $clone = $obj.clone();
	    $clone.css({position: 'relative', cssFloat: 'left', styleFloat: 'left', marginTop: -99999, width: '', height: ''});
	    __body.addChild($clone);

	    var width = $clone.div.offsetWidth;
	    var height = $clone.div.offsetHeight;

	    $clone.remove();
	    return {width: width, height: height};
	};

    
	this.prefix = function(style) {
        return _this.styles.vendor == '' ? style.charAt(0).toLowerCase() + style.slice(1) : _this.styles.vendor + style;
    };

    this._toCSS = objToCSS;

}, 'Static');


Class(function HydraObject(_selector, _type, _exists, _useFragment) {

	this._children = new LinkedList();
	this.__useFragment = _useFragment;
	this._initSelector(_selector, _type, _exists);

}, () => {
	var prototype = HydraObject.prototype;

	
	prototype._initSelector = function(_selector, _type, _exists) {
		if (_selector && typeof _selector !== 'string') {
			this.div = _selector;
		} else {
			var first = _selector ? _selector.charAt(0) : null;
			var name = _selector ? _selector.slice(1) : null;

			if (first != '.' && first != '#') {
				name = _selector;
				first = '.';
			}

			if (!_exists) {
				this._type = _type || 'div';
				if (this._type == 'svg') {
					this.div = document.createElementNS('http://www.w3.org/2000/svg', this._type);
					this.div.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
				} else {
					this.div = document.createElement(this._type);
					if (first) {
						if (first == '#') this.div.id = name;
						else this.div.className = name;
					}
				}
			} else {
				if (first != '#') throw 'Hydra Selectors Require #ID';
				this.div = document.getElementById(name);
			}
		}

		this.div.hydraObject = this;
	};

	
	prototype.add = function(child) {
		var div = this.div;

        var _this = this;
		var createFrag = function() {
			if (_this.__useFragment) {
				if (!_this._fragment) {
					_this._fragment = document.createDocumentFragment();

					defer(function () {
						if (!_this._fragment || !_this.div) return _this._fragment = null;
						_this.div.appendChild(_this._fragment);
						_this._fragment = null;
					})
				}
				div = _this._fragment;
			}
		};

        if (child.element && child.element instanceof HydraObject) {
            createFrag();
            div.appendChild(child.element.div);
            this._children.push(child.element);
            child.element._parent = this;
            child.element.div.parentNode = this.div;
        } else if (child.div) {
			createFrag();
			div.appendChild(child.div);
			this._children.push(child);
			child._parent = this;
			child.div.parentNode = this.div;
		} else if (child.nodeName) {
			createFrag();
			div.appendChild(child);
			child.parentNode = this.div;
		}

		return this;
	};

    
	prototype.clone = function() {
		return $(this.div.cloneNode(true));
	};

    
	prototype.create = function(name, type) {
		var $obj = $(name, type);
		this.add($obj);
		return $obj;
	};

    
	prototype.empty = function() {
		var child = this._children.start();
		while (child) {
			if (child && child.remove) child.remove();
			child = this._children.next();
		}

		this.div.innerHTML = '';
		return this;
	};

    
	prototype.parent = function() {
		return this._parent;
	};

    
	prototype.children = function() {
		return this.div.children ? this.div.children : this.div.childNodes;
	};

    
	prototype.removeChild = function(object, keep) {
		try {object.div.parentNode.removeChild(object.div)} catch(e) {};
		if (!keep) this._children.remove(object);
	};

    
	prototype.remove = prototype.destroy = function() {
		this.removed = true;

		var parent = this._parent;
		if (!!(parent && !parent.removed && parent.removeChild)) parent.removeChild(this, true);

		var child = this._children.start();
		while (child) {
			if (child && child.remove) child.remove();
			child = this._children.next();
		}
		this._children.destroy();

		this.div.hydraObject = null;
		Utils.nullObject(this);
	};

    
	window.$ = function(selector, type, exists) {
		return new HydraObject(selector, type, exists);
	};

    
	$.fn = HydraObject.prototype;
});





(function() {

    
    $.fn.text = function(text) {
        if (typeof text !== 'undefined') {
        	if (this.__cacheText != text) this.div.textContent = text;
			this.__cacheText = text;
            return this;
        } else {
            return this.div.textContent;
        }
    };

    
    $.fn.html = function(text, force) {
		if (text && !text.includes('<') && !force) return this.text(text);

        if (typeof text !== 'undefined') {
            this.div.innerHTML = text;
            return this;
        } else {
            return this.div.innerHTML;
        }
    };

    
    $.fn.hide = function() {
        this.div.style.display = 'none';
        return this;
    };

    
    $.fn.show = function() {
        this.div.style.display = '';
        return this;
    };

    
	$.fn.visible = function() {
		this.div.style.visibility = 'visible';
		return this;
	};

    
	$.fn.invisible = function() {
		this.div.style.visibility = 'hidden';
		return this;
	};

    
	$.fn.setZ = function(z) {
		this.div.style.zIndex = z;
		return this;
	};

    
	$.fn.clearAlpha = function() {
        this.div.style.opacity = '';
		return this;
	};

    
	$.fn.size = function(w, h, noScale) {
		if (typeof w === 'string') {
		    if (typeof h === 'undefined') h = '100%';
		    else if (typeof h !== 'string') h = h+'px';
		    this.div.style.width = w;
		    this.div.style.height = h;
	    } else {
	    	this.div.style.width = w+'px';
	    	this.div.style.height = h+'px';
	    	if (!noScale) this.div.style.backgroundSize = w+'px '+h+'px';
		}
		
		this.width = w;
		this.height = h;
		
		return this;
	};

    
	$.fn.mouseEnabled = function(bool) {
		this.div.style.pointerEvents = bool ? 'auto' : 'none';
		return this;
	};

    
	$.fn.fontStyle = function(family, size, color, style) {
		var font = {};
		if (family) font.fontFamily = family;
		if (size) font.fontSize = size;
		if (color) font.color = color;
		if (style) font.fontStyle = style;
		this.css(font);
		return this;
	};

    
	$.fn.bg = function(src, x, y, repeat) {
        if (!src) return this;

		if (src.includes('.')) src = Assets.getPath(src);

        if (!src.includes('.')) this.div.style.backgroundColor = src;
        else this.div.style.backgroundImage = 'url('+src+')';
        
        if (typeof x !== 'undefined') {
            x = typeof x == 'number' ? x+'px' : x;
            y = typeof y == 'number' ? y+'px' : y;
            this.div.style.backgroundPosition = x+' '+y;
        }
        
        if (repeat) {
            this.div.style.backgroundSize = '';
            this.div.style.backgroundRepeat = repeat;
        }

        if (x == 'cover' || x == 'contain') {
            this.div.style.backgroundSize = x;
            this.div.style.backgroundPosition = typeof y != 'undefined' ? y +' ' +repeat : 'center';
        }

        return this;
    };

    
	$.fn.center = function(x, y, noPos) {
	    var css = {};
	    if (typeof x === 'undefined') {
	        css.left = '50%';
	        css.top = '50%';
	        css.marginLeft = -this.width/2;
	        css.marginTop = -this.height/2;
	    } else {
	        if (x) {
	            css.left = '50%';
	            css.marginLeft = -this.width/2;
	        }
	        if (y) {
	            css.top = '50%';
	            css.marginTop = -this.height/2;
	        }
	    }

		if (noPos) {
			delete css.left;
			delete css.top;
		}

	    this.css(css);
	    return this;
	};

    
	$.fn.mask = function(arg) {
	    this.div.style[CSS.prefix('Mask')] = (arg.includes('.') ? 'url('+arg+')' :  arg) + ' no-repeat';
		this.div.style[CSS.prefix('MaskSize')] = 'contain';
	    return this;
	};

    
	$.fn.blendMode = function(mode, bg) {
	    if (bg) {
	        this.div.style['background-blend-mode'] = mode;
	    } else {
	        this.div.style['mix-blend-mode'] = mode;
	    }
	    
	    return this;
	};

    
    $.fn.css = function(obj, value) {
        if (typeof value == 'boolean') {
            value = null;
        }
        
    	if (typeof obj !== 'object') {
    		if (!value) {
				var style = this.div.style[obj];
				if (typeof style !== 'number') {
					if (!style) return false;
				    if (style.includes('px')) style = Number(style.slice(0, -2));
				    if (obj == 'opacity') style = !isNaN(Number(this.div.style.opacity)) ? Number(this.div.style.opacity) : 1;
				}
				if (!style) style = 0;
				return style;
			} else {
				this.div.style[obj] = value;
				return this;
			}
		}
		
		TweenManager._clearCSSTween(this);

		for (var type in obj) {
			var val = obj[type];
			if (!(typeof val === 'string' || typeof val === 'number')) continue;
			if (typeof val !== 'string' && type != 'opacity' && type != 'zIndex') val += 'px';
            this.div.style[type] = val;
		}
		
		return this;
    };

    
	$.fn.transform = function(props) {
		if (this.multiTween && this.cssTweens && this._cssTweens.length > 1 && this.__transformTime && Render.TIME - this.__transformTime < 15) return;
		this.__transformTime = Render.TIME;
		TweenManager._clearCSSTween(this);

		if (Device.tween.css2d) {
			if (!props) {
				props = this;
			} else {
				for (var key in props) {
					if (typeof props[key] === 'number') this[key] = props[key];
				}
			}

			var transformString =TweenManager._parseTransform(props);

			if (this.__transformCache != transformString) {
				this.div.style[CSS.styles.vendorTransform] = transformString;
				this.__transformCache = transformString;
			}
		}

		return this;
	};

    
	$.fn.willChange = function(props) {
		if (typeof props === 'boolean') {
			if (props === true) this._willChangeLock = true;
			else this._willChangeLock = false;
		} else {
			if (this._willChangeLock) return;
		}

		var string = typeof props === 'string';
		if ((!this._willChange || string) && typeof props !== 'null') {
			this._willChange = true;
			this.div.style['will-change'] = string ? props : CSS.transformProperty+', opacity';
		} else {
			this._willChange = false;
			this.div.style['will-change'] = '';
		}
	};

    
	$.fn.backfaceVisibility = function(visible) {
		if (visible) this.div.style[CSS.prefix('BackfaceVisibility')] = 'visible';
		else this.div.style[CSS.prefix('BackfaceVisibility')] = 'hidden';
	};

    
	$.fn.enable3D = function(perspective, x, y) {
		if (!Device.tween.css3d) return this;
		this.div.style[CSS.prefix('TransformStyle')] = 'preserve-3d';
		if (perspective) this.div.style[CSS.prefix('Perspective')] = perspective + 'px';
		if (typeof x !== 'undefined') {
			x = typeof x === 'number' ? x + 'px' : x;
			y = typeof y === 'number' ? y + 'px' : y;
			this.div.style[CSS.prefix('PerspectiveOrigin')] = x+' '+y;
		}
		return this;
	};

    
	$.fn.disable3D = function() {
		this.div.style[CSS.prefix('TransformStyle')] = '';
		this.div.style[CSS.prefix('Perspective')] = '';
		return this;
	};

    
	$.fn.transformPoint = function(x, y, z) {
		var origin = '';
		if (typeof x !== 'undefined') origin += (typeof x === 'number' ? x+'px ' : x+' ');
		if (typeof y !== 'undefined') origin += (typeof y === 'number' ? y+'px ' : y+' ');
		if (typeof z !== 'undefined') origin += (typeof z === 'number' ? z+'px' : z);
		this.div.style[CSS.prefix('TransformOrigin')] = origin;
		return this;
	};

    
	$.fn.tween = function(props, time, ease, delay, callback, manual) {
		if (typeof delay === 'boolean') {
			manual = delay;
			delay = 0;
			callback = null;
		} else if (typeof delay === 'function') {
			callback = delay;
			delay = 0;
		}
		if (typeof callback === 'boolean') {
			manual = callback;
			callback = null;
		}
		if (!delay) delay = 0;

		var usePromise = null;
		if (callback && callback instanceof Promise) {
			usePromise = callback;
			callback = callback.resolve;
		}

		var tween = TweenManager._detectTween(this, props, time, ease, delay, callback, manual);
		return usePromise || tween;
	};

    
	$.fn.clearTransform = function() {
		if (typeof this.x === 'number') this.x = 0;
		if (typeof this.y === 'number') this.y = 0;
		if (typeof this.z === 'number') this.z = 0;
		if (typeof this.scale === 'number') this.scale = 1;
		if (typeof this.scaleX === 'number')this.scaleX = 1;
		if (typeof this.scaleY === 'number') this.scaleY = 1;
		if (typeof this.rotation === 'number') this.rotation = 0;
		if (typeof this.rotationX === 'number') this.rotationX = 0;
		if (typeof this.rotationY === 'number') this.rotationY = 0;
		if (typeof this.rotationZ === 'number') this.rotationZ = 0;
		if (typeof this.skewX === 'number') this.skewX = 0;
		if (typeof this.skewY === 'number') this.skewY = 0;
		this.div.style[CSS.styles.vendorTransform] = '';
		return this;
	};

    
	$.fn.clearTween = function() {
		if (this._cssTween) this._cssTween.stop();
		if (this._mathTween) this._mathTween.stop();
		return this;
	};

	$.fn.stopTween = function() {
		console.warn('.stopTween deprecated. use .clearTween instead');
		return this.clearTween();
	};

    
	$.fn.keypress = function(callback) {
		this.div.onkeypress = function(e) {
			e = e || window.event;
			e.code = e.keyCode ? e.keyCode : e.charCode;
			if (callback) callback(e);
		};
	};

    
	$.fn.keydown = function(callback) {
		this.div.onkeydown = function(e) {
			e = e || window.event;
			e.code = e.keyCode;
			if (callback) callback(e);
		};
	};

    
	$.fn.keyup = function(callback) {
		this.div.onkeyup = function(e) {
			e = e || window.event;
			e.code = e.keyCode;
			if (callback) callback(e);
		}
	};

    
	$.fn.attr = function(attr, value) {
		if (attr && value) {
			if (value == '') this.div.removeAttribute(attr);
			else this.div.setAttribute(attr, value);
		} else if (attr) {
			return this.div.getAttribute(attr);
		}
		return this;
	};

    
	$.fn.val = function(value) {
		if (typeof value === 'undefined') {
			return this.div.value;
		} else {
			this.div.value = value;
		}

		return this;
	};

    
	$.fn.change = function(callback) {
		var _this = this;
		if (this._type == 'select') {
			this.div.onchange = function() {
				callback({object: _this, value: _this.div.value || ''});
			};
		}
	};

    
	$.fn.svgSymbol = function(id, width, height) {
		var config = SVG.getSymbolConfig(id);
		var svgHTML = '<svg viewBox="0 0 '+config.width+' '+config.height+'" width="'+width+'" height="'+height+'">'+
			'<use xlink:href="#'+config.id+'" x="0" y="0" />'+
			'</svg>';
		this.html(svgHTML, true);
	};

    
	$.fn.overflowScroll = function(dir) {
		if (!Device.mobile) return;
		var x = !!dir.x;
		var y = !!dir.y;

		var overflow = {'-webkit-overflow-scrolling': 'touch'};
		if ((!x && !y) || (x && y)) overflow.overflow = 'scroll';
		if (!x && y) {
		    overflow.overflowY = 'scroll';
		    overflow.overflowX = 'hidden';
		}
		if (x && !y) {
		    overflow.overflowX = 'scroll';
		    overflow.overflowY = 'hidden';
		}
		this.css(overflow);

		Mobile._addOverflowScroll(this);
	};

    
	$.fn.removeOverflowScroll = function() {
		if (!Device.mobile) return;
		this.css({overflow: 'hidden', overflowX: '', overflowY: '', '-webkit-overflow-scrolling': ''});
		Mobile._removeOverflowScroll(this);
	};


})();




(function() {
    var windowsPointer = !!window.MSGesture;

    var translateEvent = function(evt) {
        if (windowsPointer) {
            switch (evt) {
                case 'touchstart': return 'pointerdown'; break;
                case 'touchmove': return 'MSGestureChange'; break;
                case 'touchend': return 'pointerup'; break;
            }
        }
        return evt;
    };

    var convertTouchEvent = function(e) {
        var touchEvent = {};
        touchEvent.x = 0;
        touchEvent.y = 0;

        if (e.windowsPointer) return e;

        if (!e) return touchEvent;
        if (e.touches || e.changedTouches) {
            if (e.touches.length) {
                touchEvent.x = e.touches[0].pageX;
                touchEvent.y = e.touches[0].pageY;
            } else {
                touchEvent.x = e.changedTouches[0].pageX;
                touchEvent.y = e.changedTouches[0].pageY;
            }
        } else {
            touchEvent.x = e.pageX;
            touchEvent.y = e.pageY;
        }

        
        if (Mobile.ScreenLock && Mobile.ScreenLock.isActive && Mobile.orientationSet && Mobile.orientation !== Mobile.orientationSet) {
            if (window.orientation == 90 || window.orientation === 0) {
                var x = touchEvent.y;
                touchEvent.y = touchEvent.x;
                touchEvent.x = Stage.width - x;
            }

            if (window.orientation == -90 || window.orientation === 180) {
                var y = touchEvent.x;
                touchEvent.x = touchEvent.y;
                touchEvent.y = Stage.height - y;
            }
        }

        return touchEvent;
    };

    
    $.fn.click = function(callback) {
        var _this = this;
        function click(e) {
            if (!_this.div) return false;
            if (Mouse._preventClicks) return false;
            e.object = _this.div.className == 'hit' ? _this.parent() : _this;
            e.action = 'click';

            if (!e.pageX) {
                e.pageX = e.clientX;
                e.pageY = e.clientY;
            }

            if (callback) callback(e);

            if (Mouse.autoPreventClicks) Mouse.preventClicks();
        }

        this.div.addEventListener(translateEvent('click'), click, true);
        this.div.style.cursor = 'pointer';

        return this;
    };

    
    $.fn.hover = function(callback) {
        var _this = this;
        var _over = false;
        var _time;

        function hover(e) {
            if (!_this.div) return false;
            var time = performance.now();
            var original = e.toElement || e.relatedTarget;

            if (_time && (time - _time) < 5) {
                _time = time;
                return false;
            }

            _time = time;

            e.object = _this.div.className == 'hit' ? _this.parent() : _this;

            switch (e.type) {
                case 'mouseout': e.action = 'out'; break;
                case 'mouseleave': e.action = 'out'; break;
                default: e.action = 'over'; break;
            }

            if (_over) {
                if (Mouse._preventClicks) return false;
                if (e.action == 'over') return false;
                if (e.action == 'out') {
                    if (isAChild(_this.div, original)) return false;
                }
                _over = false;
            } else {
                if (e.action == 'out') return false;
                _over = true;
            }

            if (!e.pageX) {
                e.pageX = e.clientX;
                e.pageY = e.clientY;
            }

            if (callback) callback(e);
        }

        function isAChild(div, object) {
            var len = div.children.length-1;
            for (var i = len; i > -1; i--) {
                if (object == div.children[i]) return true;
            }

            for (i = len; i > -1; i--) {
                if (isAChild(div.children[i], object)) return true;
            }
        }

        this.div.addEventListener(translateEvent('mouseover'), hover, true);
        this.div.addEventListener(translateEvent('mouseout'), hover, true);

        return this;
    };

    
    $.fn.press = function(callback) {
        var _this = this;

        function press(e) {
            if (!_this.div) return false;
            e.object = _this.div.className == 'hit' ? _this.parent() : _this;

            switch (e.type) {
                case 'mousedown': e.action = 'down'; break;
                default: e.action = 'up'; break;
            }
            if (!e.pageX) {
                e.pageX = e.clientX;
                e.pageY = e.clientY;
            }
            if (callback) callback(e);
        }

        this.div.addEventListener(translateEvent('mousedown'), press, true);
        this.div.addEventListener(translateEvent('mouseup'), press, true);

        return this;
    };

    
    $.fn.bind = function(evt, callback) {
        this._events = this._events || {};

        if (windowsPointer && this == __window) {
            return Stage.bind(evt, callback);
        }

        if (evt == 'touchstart') {
            if (!Device.mobile) {
                if (Device.touchCapable) this.bind('mousedown', callback);
                else evt = 'mousedown';
            }
        } else if (evt == 'touchmove') {
            if (!Device.mobile) {
                if (Device.touchCapable) this.bind('mousemove', callback);
                else evt = 'mousemove';
            }

            if (windowsPointer && !this.div.msGesture) {
                this.div.msGesture = new MSGesture();
                this.div.msGesture.target = this.div;
            }
        } else if (evt == 'touchend') {
            if (!Device.mobile) {
                if (Device.touchCapable) this.bind('mouseup', callback);
                else evt = 'mouseup';
            }
        }

        this._events['bind_'+evt] = this._events['bind_'+evt] || [];
        var _events = this._events['bind_'+evt];
        var e = {};
        var target = this.div;
        e.callback = callback;
        e.target = this.div;
        _events.push(e);

        function touchEvent(e) {
            if (windowsPointer && target.msGesture && evt == 'touchstart') {
                target.msGesture.addPointer(e.pointerId);
            }

            var touch = convertTouchEvent(e);
            if (windowsPointer) {
                var windowsEvt = e;
                e = {};
                e.x = Number(windowsEvt.pageX || windowsEvt.clientX);
                e.y = Number(windowsEvt.pageY || windowsEvt.clientY);
                e.target = windowsEvt.target;
                e.currentTarget = windowsEvt.currentTarget;
                e.path = [];
                var node = e.target;
                while (node) {
                    e.path.push(node);
                    node = node.parentElement || null;
                }
                e.windowsPointer = true;
            } else {
                e.x = touch.x;
                e.y = touch.y;
            }

            for (var i = 0; i < _events.length; i++) {
                var ev = _events[i];
                if (ev.target == e.currentTarget) {
                    ev.callback(e);
                }
            }
        }

        if (!this._events['fn_'+evt]) {
            this._events['fn_'+evt] = touchEvent;
            this.div.addEventListener(translateEvent(evt), touchEvent, true);
        }
        return this;
    };

    
    $.fn.unbind = function(evt, callback) {
        this._events = this._events || {};

        if (windowsPointer && this == __window) {
            return Stage.unbind(evt, callback);
        }

        if (evt == 'touchstart') {
            if (!Device.mobile) {
                if (Device.touchCapable) this.unbind('mousedown', callback);
                else evt = 'mousedown';
            }
        } else if (evt == 'touchmove') {
            if (!Device.mobile) {
                if (Device.touchCapable) this.unbind('mousemove', callback);
                else evt = 'mousemove';
            }
        } else if (evt == 'touchend') {
            if (!Device.mobile) {
                if (Device.touchCapable) this.unbind('mouseup', callback);
                else evt = 'mouseup';
            }
        }

        var _events = this._events['bind_'+evt];
        if (!_events) return this;

        for (var i = 0; i < _events.length; i++) {
            var ev = _events[i];
            if (ev.callback == callback) _events.splice(i, 1);
        }

        if (this._events['fn_'+evt] && !_events.length) {
            this.div.removeEventListener(translateEvent(evt), this._events['fn_'+evt], Device.mobile ? {passive: true} : true);
            this._events['fn_'+evt] = null;
        }

        return this;
    };

    
    $.fn.interact = function(overCallback, clickCallback) {
        if (!this.hit) {
            this.hit = $('.hit');
            this.hit.css({width: '100%', height: '100%', zIndex: 99999, top: 0, left: 0, position: 'absolute'});
            this.add(this.hit);
        }

        if (!Device.mobile) this.hit.hover(overCallback).click(clickCallback);
        else this.hit.touchClick(overCallback, clickCallback);
    };

    
    $.fn.touchSwipe = function(callback, distance) {
        if (!window.addEventListener) return this;

        var _this = this;
        var _distance = distance || 75;
        var _startX, _startY;
        var _moving = false;
        var _move = {};

        if (Device.mobile) {
            this.div.addEventListener(translateEvent('touchstart'), touchStart, {passive: true});
            this.div.addEventListener(translateEvent('touchend'), touchEnd, {passive: true});
            this.div.addEventListener(translateEvent('touchcancel'), touchEnd, {passive: true});
        }

        function touchStart(e) {
            var touch = convertTouchEvent(e);
            if (!_this.div) return false;
            if (e.touches.length == 1) {
                _startX = touch.x;
                _startY = touch.y;
                _moving = true;
                _this.div.addEventListener(translateEvent('touchmove'), touchMove, {passive: true});
            }
        }

        function touchMove(e) {
            if (!_this.div) return false;
            if (_moving) {
                var touch = convertTouchEvent(e);
                var dx = _startX - touch.x;
                var dy = _startY - touch.y;

                _move.direction = null;
                _move.moving = null;
                _move.x = null;
                _move.y = null;
                _move.evt = e;

                if (Math.abs(dx) >= _distance) {
                    touchEnd();
                    if (dx > 0) {
                        _move.direction = 'left';
                    } else {
                        _move.direction = 'right';
                    }
                } else if (Math.abs(dy) >= _distance) {
                    touchEnd();
                    if (dy > 0) {
                        _move.direction = 'up';
                    } else {
                        _move.direction = 'down';
                    }
                } else {
                    _move.moving = true;
                    _move.x = dx;
                    _move.y = dy;
                }

                if (callback) callback(_move, e);
            }
        }

        function touchEnd(e) {
            if (!_this.div) return false;
            _startX = _startY = _moving = false;
            _this.div.removeEventListener(translateEvent('touchmove'), touchMove);
        }

        return this;
    };

    
    $.fn.touchClick = function(hover, click) {
        if (!window.addEventListener) return this;
        var _this = this;
        var _time, _move;
        var _start = {};
        var _touch = {};

        if (Device.mobile) {
            this.div.addEventListener(translateEvent('touchmove'), touchMove, {passive: true});
            this.div.addEventListener(translateEvent('touchstart'), touchStart, {passive: true});
            this.div.addEventListener(translateEvent('touchend'), touchEnd, {passive: true});
        }

        function findDistance(p1, p2) {
            var dx = p2.x - p1.x;
            var dy = p2.y - p1.y;
            return Math.sqrt(dx * dx + dy * dy);
        }

        function touchMove(e) {
            if (!_this.div) return false;
            _touch = convertTouchEvent(e);
            if (findDistance(_start, _touch) > 5) {
                _move = true;
            } else {
                _move = false;
            }
        }

        function setTouch(e) {
            var touch = convertTouchEvent(e);
            e.touchX = touch.x;
            e.touchY = touch.y;

            _start.x = e.touchX;
            _start.y = e.touchY;
        }

        function touchStart(e) {
            if (!_this.div) return false;
            _time = performance.now();
            e.action = 'over';
            e.object = _this.div.className == 'hit' ? _this.parent() : _this;
            setTouch(e);
            if (hover && !_move) hover(e);
        }

        function touchEnd(e) {
            if (!_this.div) return false;
            var time = performance.now();
            var clicked = false;

            e.object = _this.div.className == 'hit' ? _this.parent() : _this;
            setTouch(e);

            if (_time && time - _time < 750) {
                if (Mouse._preventClicks) return false;
                if (click && !_move) {
                    clicked = true;
                    e.action = 'click';
                    if (click && !_move) click(e);

                    if (Mouse.autoPreventClicks) Mouse.preventClicks();
                }
            }

            if (hover) {
                e.action = 'out';
                if (!Mouse._preventFire) hover(e);
            }

            _move = false;
        }

        return this;
    };
})();


Class(function Element() {
	Inherit(this, Component);
	var name = Utils.getConstructorName(this);

    
	this.element = $('.'+name);
	this.element.__useFragment = true;

    this.destroy = function() {
        if (this.element && this.element.remove) this.element = this.element.remove();
        this._destroy && this._destroy();
    };

});


(function() {
	Hydra.ready(() => {
		TweenManager.Transforms = [
			'scale',
			'scaleX',
			'scaleY',
			'x',
			'y',
			'z',
			'rotation',
			'rotationX',
			'rotationY',
			'rotationZ',
			'skewX',
			'skewY',
			'perspective',
		];

		TweenManager.CubicEases = [
			{name: 'easeOutCubic', curve: 'cubic-bezier(0.215, 0.610, 0.355, 1.000)'},
			{name: 'easeOutQuad', curve: 'cubic-bezier(0.250, 0.460, 0.450, 0.940)'},
			{name: 'easeOutQuart', curve: 'cubic-bezier(0.165, 0.840, 0.440, 1.000)'},
			{name: 'easeOutQuint', curve: 'cubic-bezier(0.230, 1.000, 0.320, 1.000)'},
			{name: 'easeOutSine', curve: 'cubic-bezier(0.390, 0.575, 0.565, 1.000)'},
			{name: 'easeOutExpo', curve: 'cubic-bezier(0.190, 1.000, 0.220, 1.000)'},
			{name: 'easeOutCirc', curve: 'cubic-bezier(0.075, 0.820, 0.165, 1.000)'},
			{name: 'easeOutBack', curve: 'cubic-bezier(0.175, 0.885, 0.320, 1.275)'},

			{name: 'easeInCubic', curve: 'cubic-bezier(0.550, 0.055, 0.675, 0.190)'},
			{name: 'easeInQuad', curve: 'cubic-bezier(0.550, 0.085, 0.680, 0.530)'},
			{name: 'easeInQuart', curve: 'cubic-bezier(0.895, 0.030, 0.685, 0.220)'},
			{name: 'easeInQuint', curve: 'cubic-bezier(0.755, 0.050, 0.855, 0.060)'},
			{name: 'easeInSine', curve: 'cubic-bezier(0.470, 0.000, 0.745, 0.715)'},
			{name: 'easeInCirc', curve: 'cubic-bezier(0.600, 0.040, 0.980, 0.335)'},
			{name: 'easeInBack', curve: 'cubic-bezier(0.600, -0.280, 0.735, 0.045)'},

			{name: 'easeInOutCubic', curve: 'cubic-bezier(0.645, 0.045, 0.355, 1.000)'},
			{name: 'easeInOutQuad', curve: 'cubic-bezier(0.455, 0.030, 0.515, 0.955)'},
			{name: 'easeInOutQuart', curve: 'cubic-bezier(0.770, 0.000, 0.175, 1.000)'},
			{name: 'easeInOutQuint', curve: 'cubic-bezier(0.860, 0.000, 0.070, 1.000)'},
			{name: 'easeInOutSine', curve: 'cubic-bezier(0.445, 0.050, 0.550, 0.950)'},
			{name: 'easeInOutExpo', curve: 'cubic-bezier(1.000, 0.000, 0.000, 1.000)'},
			{name: 'easeInOutCirc', curve: 'cubic-bezier(0.785, 0.135, 0.150, 0.860)'},
			{name: 'easeInOutBack', curve: 'cubic-bezier(0.680, -0.550, 0.265, 1.550)'},

			{name: 'easeInOut', curve: 'cubic-bezier(.42,0,.58,1)'},
			{name: 'linear', curve: 'linear'}
		];

		TweenManager.useCSSTrans = function (props, ease, object) {
			if (props.math) return false;
			if (typeof ease === 'string' && (ease.includes(['Elastic', 'Bounce']))) return false;
			if (object.multiTween || TweenManager._inspectEase(ease).path) return false;
			if (!Device.tween.transition) return false;
			return true;
		}

		TweenManager._detectTween = function(object, props, time, ease, delay, callback) {
			if (!TweenManager.useCSSTrans(props, ease, object)) {
				return new FrameTween(object, props, time, ease, delay, callback);
			} else {
				return new CSSTransition(object, props, time, ease, delay, callback);
			}
		}

		TweenManager._parseTransform = function(props) {
			var transforms = '';
			var translate = '';

			if (props.perspective > 0) transforms += 'perspective('+props.perspective+'px)';

			if (typeof props.x !== 'undefined' || typeof props.y !== 'undefined' || typeof props.z !== 'undefined') {
				var x = (props.x || 0);
				var y = (props.y || 0);
				var z = (props.z || 0);
				translate += x + 'px, ';
				translate += y + 'px';
				if (Device.tween.css3d) {
					translate += ', ' + z + 'px';
					transforms += 'translate3d('+translate+')';
				} else {
					transforms += 'translate('+translate+')';
				}
			}

			if (typeof props.scale !== 'undefined') {
				transforms += 'scale('+props.scale+')';
			} else {
				if (typeof props.scaleX !== 'undefined') transforms += 'scaleX('+props.scaleX+')';
				if (typeof props.scaleY !== 'undefined') transforms += 'scaleY('+props.scaleY+')';
			}

			if (typeof props.rotation !== 'undefined') transforms += 'rotate('+props.rotation+'deg)';
			if (typeof props.rotationX !== 'undefined') transforms += 'rotateX('+props.rotationX+'deg)';
			if (typeof props.rotationY !== 'undefined') transforms += 'rotateY('+props.rotationY+'deg)';
			if (typeof props.rotationZ !== 'undefined') transforms += 'rotateZ('+props.rotationZ+'deg)';
			if (typeof props.skewX !== 'undefined') transforms += 'skewX('+props.skewX+'deg)';
			if (typeof props.skewY !== 'undefined') transforms += 'skewY('+props.skewY+'deg)';

			return transforms;
		}

		TweenManager._clearCSSTween = function(obj) {
			if (obj && !obj._cssTween && obj.div._transition && !obj.persistTween) {
				obj.div.style[CSS.styles.vendorTransition] = '';
				obj.div._transition = false;
				obj._cssTween = null;
			}
		}

		TweenManager._isTransform = function(key) {
			var index = TweenManager.Transforms.indexOf(key);
			return index > -1;
		}

		TweenManager._getAllTransforms = function(object) {
			var obj = {};
			for (var i = TweenManager.Transforms.length-1; i > -1; i--) {
				var tf = TweenManager.Transforms[i];
				var val = object[tf];
				if (val !== 0 && typeof val === 'number') {
					obj[tf] = val;
				}
			}
			return obj;
		}

        const prefix = (function() {
            let pre = '';
            let dom = '';

            if (window._NODE_ || window._GLES_) {
                pre = 'webkit';
                dom = 'WebKit';
            } else {
                var styles = window.getComputedStyle(document.documentElement, '');
                pre = (Array.prototype.slice
                        .call(styles)
                        .join('')
                        .match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o'])
                )[1];
                dom = ('WebKit|Moz|MS|O').match(new RegExp('(' + pre + ')', 'i'))[1];
            }

            return {
                unprefixed: Device.system.browser == 'ie' && !Device.detect('msie 9'),
                dom: dom,
                lowercase: pre,
                css: '-' + pre + '-',
                js: (Device.system.browser == 'ie' ? pre[0] : pre[0].toUpperCase()) + pre.substr(1)
            };
        })();

		CSS.styles = {};

		
		CSS.styles.vendor = prefix.unprefixed ? '' : prefix.js;

		
		CSS.styles.vendorTransition = CSS.styles.vendor.length ? CSS.styles.vendor + 'Transition' : 'transition';

		
		CSS.styles.vendorTransform = CSS.styles.vendor.length ? CSS.styles.vendor + 'Transform' : 'transform';

		
		
		CSS.vendor = prefix.css;

		
		CSS.transformProperty = (function() {
		    switch (prefix.lowercase) {
		        case 'moz': return '-moz-transform'; break;
		        case 'webkit': return '-webkit-transform'; break;
		        case 'o': return '-o-transform'; break;
		        case 'ms': return '-ms-transform'; break;
		        default: return 'transform'; break;
		    }
		})();

		CSS.tween = {};

		
		CSS.tween.complete = (function() {
		    if (prefix.unprefixed) return 'transitionend';
		    return prefix.lowercase + 'TransitionEnd';
		})();

	});
})();


Class(function CSSTransition(_object, _props, _time, _ease, _delay, _callback) {
    const _this = this;
    let _transformProps, _transitionProps;

    this.playing = true;

    
    (function () {
        if (typeof _time !== 'number') throw 'CSSTween Requires object, props, time, ease';
        initProperties();
        initCSSTween();
    })();

    function killed() {
        return !_this || _this.kill || !_object || !_object.div;
    }

    function initProperties() {
        var transform = TweenManager._getAllTransforms(_object);
        var properties = [];

        for (var key in _props) {
            if (TweenManager._isTransform(key)) {
                transform.use = true;
                transform[key] = _props[key];
                delete _props[key];
            } else {
                if (typeof _props[key] === 'number' || key.includes('-')) properties.push(key);
            }
        }

        if (transform.use) {
            properties.push(CSS.transformProperty);
            delete transform.use;
        }
        
        _transformProps = transform;
        _transitionProps = properties;
    }

    function initCSSTween(values) {
        if (killed()) return;
        if (_object._cssTween) _object._cssTween.kill = true;
        _object._cssTween = _this;
        _object.div._transition = true;

        var strings = buildStrings(_time, _ease, _delay);

        _object.willChange(strings.props);

        var time = values ? values.time : _time;
        var delay = values ? values.delay : _delay;
        var props = values ? values.props : _props;
        var transformProps = values ? values.transform : _transformProps;

        Timer.create(function() {
            if (killed()) return;
            _object.div.style[CSS.styles.vendorTransition] = strings.transition;
            _this.playing = true;

            if (Device.system.browser == 'safari') {
                Timer.create(function() {
                    if (killed()) return;
                    _object.css(props);
                    _object.transform(transformProps);
                }, 16);
            } else {
                _object.css(props);
                _object.transform(transformProps);
            }

            Timer.create(function() {
                if (killed()) return;
                clearCSSTween();
                if (_callback) _callback();
                if (_this.completePromise) _this.completePromise.resolve();
            }, time + delay);
        }, 50);
    }

    function buildStrings(time, ease, delay) {
        var props = '';
        var str = '';
        var len = _transitionProps.length;
        for (var i = 0; i < len; i++) {
            var transitionProp = _transitionProps[i];
            props += (props.length ? ', ' : '') + transitionProp;
            str += (str.length ? ', ' : '') + transitionProp + ' ' + time+'ms ' + TweenManager._getEase(ease) + ' ' + delay+'ms';
        }

        return {props: props, transition: str};
    }

    function clearCSSTween() {
        if (killed()) return;
        _this.playing = false;
        _object._cssTween = null;
        _object.willChange(null);
        _object = _props = null;
        Utils.nullObject(this);
    }

    
    function tweenComplete() {
        if (!_callback && _this.playing) clearCSSTween();
    }

    
    
    this.stop = function() {
        if (!this.playing) return;
        this.kill = true;
        this.playing = false;
        _object.div.style[CSS.styles.vendorTransition] = '';
        _object.div._transition = false;
        _object.willChange(null);
        _object._cssTween = null;
        Utils.nullObject(this);
    };


    
    this.onComplete = function(callback) {
        _callback = callback;
        return this;
    };

    
    this.promise = function() {
        _this.completePromise = Promise.create();
        return _this.completePromise;
    };
});


Class(function FrameTween(_object, _props, _time, _ease, _delay, _callback, _manual) {
    var _this = this;
    var _endValues, _transformEnd, _transformStart, _startValues;
    var _isTransform, _isCSS, _transformProps;
    var _cssTween, _transformTween, _update;

    this.playing = true;

    
    (function () {
        if (typeof _ease === 'object') _ease = 'easeOutCubic';
        if (_object && _props) {
            if (typeof _time !== 'number') throw 'FrameTween Requires object, props, time, ease';
            initValues();
            startTween();
        }
    })();

    function killed() {
        return _this.kill || !_object || !_object.div;
    }

    function initValues() {
        if (_props.math) delete _props.math;
        if (Device.tween.transition && _object.div._transition) {
            _object.div.style[CSS.styles.vendorTransition] = '';
            _object.div._transition = false;
        }

        _endValues = {};
        _transformEnd = {};
        _transformStart = {};
        _startValues = {};

        if (!_object.multiTween) {
            if (typeof _props.x === 'undefined') _props.x = _object.x;
            if (typeof _props.y === 'undefined') _props.y = _object.y;
            if (typeof _props.z === 'undefined') _props.z = _object.z;
        }

        for (var key in _props) {
            if (key.includes(['damping', 'spring'])) {
                _endValues[key] = _props[key];
                _transformEnd[key] = _props[key];
                continue;
            }
            if (TweenManager._isTransform(key)) {
                _isTransform = true;
                _transformStart[key] = _object[key] || (key == 'scale' ? 1 : 0);
                _transformEnd[key] = _props[key];
            } else {
                _isCSS = true;
                var v = _props[key];
                if (typeof v === 'string') {
                    _object.div.style[key] = v;
                } else if (typeof v === 'number') {
                    _startValues[key] = Number(_object.css(key));
                    _endValues[key] = v;
                }
            }
        }
    }

    function startTween() {
        if (_object._cssTween && !_manual && !_object.multiTween) _object._cssTween.kill = true;

        if (_object.multiTween) {
            if (!_object._cssTweens) _object._cssTweens = [];
            _object._cssTweens.push(_this);
        }

        _object._cssTween = _this;
        _this.playing = true;
        _props = copy(_startValues);
        _transformProps = copy(_transformStart);

        if (_isCSS) _cssTween = tween(_props, _endValues, _time, _ease, _delay, _manual).onUpdate(update).onComplete(tweenComplete);
        if (_isTransform) _transformTween = tween(_transformProps, _transformEnd, _time, _ease, _delay, _manual).onComplete(!_isCSS ? tweenComplete : null).onUpdate(!_isCSS ? update : null);
    }

    function copy(obj) {
        let newObj = {};
        for (let key in obj) {
            if (typeof obj[key] === 'number') newObj[key] = obj[key];
        }
        return newObj;
    }

    function clear() {
        if (_object._cssTweens) {
            _object._cssTweens.remove(_this);
        }

        _this.playing = false;
        _object._cssTween = null;
        _object = _props = null;
    }

    
    function update() {
        if (killed()) return;
        if (_isCSS) _object.css(_props);
        if (_isTransform) {
            if (_object.multiTween) {
                for (var key in _transformProps) {
                    if (typeof _transformProps[key] === 'number') _object[key] = _transformProps[key];
                }
                _object.transform();
            } else {
                _object.transform(_transformProps);
            }
        }

        if (_update) _update();
    }

    function tweenComplete() {
        if (_this.playing) {
            clear();
            if (_callback) _callback();
        }
    }

    

    
    this.stop = function() {
        if (!this.playing) return;
        if (_cssTween && _cssTween.stop) _cssTween.stop();
        if (_transformTween && _transformTween.stop) _transformTween.stop();
        clear();
    };

    
    this.interpolate = function(elapsed) {
        if (_cssTween) _cssTween.interpolate(elapsed);
        if (_transformTween) _transformTween.interpolate(elapsed);
        update();
    };

    
    this.getValues = function() {
        return {
            start: _startValues,
            transformStart: _transformStart,
            end: _endValues,
            transformEnd: _transformEnd,
        };
    };

    
    this.setEase = function(ease) {
        if (_cssTween) _cssTween.setEase(ease);
        if (_transformTween) _transformTween.setEase(ease);
    };

    
    this.onUpdate = function() {
        return this;
    };

    
    this.onComplete = function(callback) {
        _callback = callback;
        return this;
    };
});
