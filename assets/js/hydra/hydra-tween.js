

Class(function TweenManager() {
    Namespace(this);
    var _this = this;
    var _tweens = [];

    this.CubicEases = [];

    
    (function() {
        Render.start(updateTweens);
    })();
    
    function updateTweens(time) {
        for (let i = _tweens.length - 1; i >= 0; i--) {
            let tween = _tweens[i];
            if (tween.update) tween.update(time);
            else _this._removeMathTween(tween);
        }
    }

    function stringToValues(str) {
        var values = str.split('(')[1].slice(0, -1).split(',');
        for (var i = 0; i < values.length; i++) values[i] = parseFloat(values[i]);
        return values;
    }

    function findEase(name) {
        var eases = _this.CubicEases;
        for (var i = eases.length-1; i > -1; i--) {
            if (eases[i].name == name) {
                return eases[i];
            }
        }
        return false;
    }

    

    
    this._addMathTween = function(tween) {
        _tweens.push(tween);
    };
    
    this._removeMathTween = function(tween) {
        _tweens.remove(tween);
    };

	this._getEase = function(name, values) {
        var ease = findEase(name);
        if (!ease) return false;

        if (values) {
            return ease.path ? ease.path.solve : ease.values;
        } else {
            return ease.curve;
        }
	};

    this._inspectEase = function(name) {
        return findEase(name);
    };

    
    this.tween = function(object, props, time, ease, delay, complete, isManual) {
        if (typeof delay !== 'number') {
            update = complete;
            complete = delay;
            delay = 0;
        }

        const tween = new MathTween(object, props, time, ease, delay, complete, isManual);

        let usePromise = null;
        if (complete && complete instanceof Promise) {
            usePromise = complete;
            complete = complete.resolve;
        }

        return usePromise || tween;
    };

    
    this.clearTween = function(object) {
        if (object._mathTween && object._mathTween.stop) object._mathTween.stop();

        if (object._mathTweens) {
            var tweens = object._mathTweens;
            for (var i = 0; i < tweens.length; i++) {
                var tw = tweens[i];
                if (tw && tw.stop) tw.stop();
            }

            object._mathTweens = null;
        }
    };

    
    this.addCustomEase = function(ease) {
        var add = true;
        if (typeof ease !== 'object' || !ease.name || !ease.curve) throw 'TweenManager :: addCustomEase requires {name, curve}';
        for (var i = _this.CubicEases.length-1; i > -1; i--) {
            if (ease.name == _this.CubicEases[i].name) {
                add = false;
            }
        }

        if (add) {
            if (ease.curve.charAt(0).toLowerCase() == 'm') {
                if (!window.EasingPath) throw 'Using custom eases requires easingpath module';
                ease.path = new EasingPath(ease.curve);
            } else {
                ease.values = stringToValues(ease.curve);
            }

            _this.CubicEases.push(ease);
        }

        return ease;
    };

    
    Math.interpolate = function(start, end, alpha, ease) {
        const fn = _this.Interpolation.convertEase(ease);
        return Math.mix(start, end, (typeof fn == 'function' ? fn(alpha) : _this.Interpolation.solve(fn, alpha)));
    };

    window.tween = this.tween;
    window.clearTween = this.clearTween;
}, 'Static');


TweenManager.Class(function Interpolation() {
    
    function calculateBezier(aT, aA1, aA2) {
        return ((A(aA1, aA2)*aT + B(aA1, aA2))*aT + C(aA1))*aT;
    }
    
    function getTForX(aX, mX1, mX2) {
        var aGuessT = aX;
        for (var i = 0; i < 4; i++) {
            var currentSlope = getSlope(aGuessT, mX1, mX2);
            if (currentSlope == 0.0) return aGuessT;
            var currentX = calculateBezier(aGuessT, mX1, mX2) - aX;
            aGuessT -= currentX / currentSlope;
        }
        return aGuessT;
    }
    
    function getSlope(aT, aA1, aA2) {
        return 3.0 * A(aA1, aA2)*aT*aT + 2.0 * B(aA1, aA2) * aT + C(aA1);
    }
    
    function A(aA1, aA2) { 
        return 1.0 - 3.0 * aA2 + 3.0 * aA1; 
    }
    
    function B(aA1, aA2) { 
        return 3.0 * aA2 - 6.0 * aA1; 
    }
    
    function C(aA1) { 
        return 3.0 * aA1; 
    }

    
    this.convertEase = function(ease) {
        var fn = (function() {
            switch (ease) {
                case 'easeInQuad': return TweenManager.Interpolation.Quad.In; break;
                case 'easeInCubic': return TweenManager.Interpolation.Cubic.In; break;
                case 'easeInQuart': return TweenManager.Interpolation.Quart.In; break;
                case 'easeInQuint': return TweenManager.Interpolation.Quint.In; break;
                case 'easeInSine': return TweenManager.Interpolation.Sine.In; break;
                case 'easeInExpo': return TweenManager.Interpolation.Expo.In; break;
                case 'easeInCirc': return TweenManager.Interpolation.Circ.In; break;
                case 'easeInElastic': return TweenManager.Interpolation.Elastic.In; break;
                case 'easeInBack': return TweenManager.Interpolation.Back.In; break;
                case 'easeInBounce': return TweenManager.Interpolation.Bounce.In; break;
                
                case 'easeOutQuad': return TweenManager.Interpolation.Quad.Out; break;
                case 'easeOutCubic': return TweenManager.Interpolation.Cubic.Out; break;
                case 'easeOutQuart': return TweenManager.Interpolation.Quart.Out; break;
                case 'easeOutQuint': return TweenManager.Interpolation.Quint.Out; break;
                case 'easeOutSine': return TweenManager.Interpolation.Sine.Out; break;
                case 'easeOutExpo': return TweenManager.Interpolation.Expo.Out; break;
                case 'easeOutCirc': return TweenManager.Interpolation.Circ.Out; break;
                case 'easeOutElastic': return TweenManager.Interpolation.Elastic.Out; break;
                case 'easeOutBack': return TweenManager.Interpolation.Back.Out; break;
                case 'easeOutBounce': return TweenManager.Interpolation.Bounce.Out; break;
                
                case 'easeInOutQuad': return TweenManager.Interpolation.Quad.InOut; break;
                case 'easeInOutCubic': return TweenManager.Interpolation.Cubic.InOut; break;
                case 'easeInOutQuart': return TweenManager.Interpolation.Quart.InOut; break;
                case 'easeInOutQuint': return TweenManager.Interpolation.Quint.InOut; break;
                case 'easeInOutSine': return TweenManager.Interpolation.Sine.InOut; break;
                case 'easeInOutExpo': return TweenManager.Interpolation.Expo.InOut; break;
                case 'easeInOutCirc': return TweenManager.Interpolation.Circ.InOut; break;
                case 'easeInOutElastic': return TweenManager.Interpolation.Elastic.InOut; break;
                case 'easeInOutBack': return TweenManager.Interpolation.Back.InOut; break;
                case 'easeInOutBounce': return TweenManager.Interpolation.Bounce.InOut; break;
                            
                case 'linear': return TweenManager.Interpolation.Linear.None; break;
            }
        })();
        
        if (!fn) {
            var curve = TweenManager._getEase(ease, true);
            if (curve) fn = curve;
            else fn = TweenManager.Interpolation.Cubic.Out;
        }
        
        return fn;
    };

    
    this.solve = function(values, elapsed) {
        if (values[0] == values[1] && values[2] == values[3]) return elapsed;
        return calculateBezier(getTForX(elapsed, values[0], values[2]), values[1], values[3]);
    };

    this.Linear = {
        None: function(k) {
            return k;
        }
    };
    this.Quad = {
        In: function(k) {
            return k*k;
        },
        Out: function(k) {
            return k * (2 - k);
        },
        InOut: function(k) {
            if ((k *= 2) < 1) return 0.5 * k * k;
            return - 0.5 * (--k * (k - 2) - 1);
        }
    };
    this.Cubic = {
        In: function(k) {
            return k * k * k;
        },
        Out: function(k) {
            return --k * k * k + 1;
        },
        InOut: function(k) {
            if ((k *= 2) < 1) return 0.5 * k * k * k;
            return 0.5 * ((k -= 2) * k * k + 2 );
        }
    };
    this.Quart = {
        In: function(k) {
            return k * k * k * k;
        },
        Out: function(k) {
            return 1 - --k * k * k * k;
        },
        InOut: function(k) {
            if ((k *= 2) < 1) return 0.5 * k * k * k * k;
            return - 0.5 * ((k -= 2) * k * k * k - 2);
        }
    };
    this.Quint = {
        In: function(k) {
            return k * k * k * k * k;
        },
        Out: function(k) {
            return --k * k * k * k * k + 1;
        },
        InOut: function(k) {
            if ((k *= 2) < 1) return 0.5 * k * k * k * k * k;
            return 0.5 * ((k -= 2) * k * k * k * k + 2);
        }
    };
    this.Sine = {
        In: function(k) {
            return 1 - Math.cos(k * Math.PI / 2);
        },
        Out: function(k) {
            return Math.sin(k * Math.PI / 2);
        },
        InOut: function(k) {
            return 0.5 * (1 - Math.cos(Math.PI * k));
        }
    };
    this.Expo = {
        In: function(k) {
            return k === 0 ? 0 : Math.pow(1024, k - 1);
        },
        Out: function(k) {
            return k === 1 ? 1 : 1 - Math.pow(2, -10 * k);
        },
        InOut: function(k) {
            if (k === 0) return 0;
            if (k === 1) return 1;
            if ((k *= 2) < 1) return 0.5 * Math.pow(1024, k - 1);
            return 0.5 * (-Math.pow(2, - 10 * (k - 1)) + 2);
        }
    };
    this.Circ = {
        In: function(k) {
            return 1 - Math.sqrt(1 - k * k);
        },
        Out: function(k) {
            return Math.sqrt(1 - --k * k);
        },
        InOut: function(k) {
            if ( ( k *= 2 ) < 1) return - 0.5 * ( Math.sqrt( 1 - k * k) - 1);
            return 0.5 * ( Math.sqrt( 1 - ( k -= 2) * k) + 1);
        }
    };
    this.Elastic = {
        In: function(k, a = 1, p = 0.4) {
            var s;
            if ( k === 0 ) return 0;
            if ( k === 1 ) return 1;
            if ( !a || a < 1 ) { a = 1; s = p / 4; }
            else s = p * Math.asin( 1 / a ) / ( 2 * Math.PI );
            return - ( a * Math.pow( 2, 10 * ( k -= 1 ) ) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) );
        },
        Out: function(k, a = 1, p = 0.4) {
            var s;
            if ( k === 0 ) return 0;
            if ( k === 1 ) return 1;
            if ( !a || a < 1 ) { a = 1; s = p / 4; }
            else s = p * Math.asin( 1 / a ) / ( 2 * Math.PI );
            return ( a * Math.pow( 2, - 10 * k) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) + 1 );
        },
        InOut: function(k, a = 1, p = 0.4) {
            var s;
            if ( k === 0 ) return 0;
            if ( k === 1 ) return 1;
            if ( !a || a < 1 ) { a = 1; s = p / 4; }
            else s = p * Math.asin( 1 / a ) / ( 2 * Math.PI );
            if ( ( k *= 2 ) < 1 ) return - 0.5 * ( a * Math.pow( 2, 10 * ( k -= 1 ) ) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) );
            return a * Math.pow( 2, -10 * ( k -= 1 ) ) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) * 0.5 + 1;
        }
    };
    this.Back = {
        In: function(k) {
            var s = 1.70158;
            return k * k * ( ( s + 1 ) * k - s );
        },
        Out: function(k) {
            var s = 1.70158;
            return --k * k * ( ( s + 1 ) * k + s ) + 1;
        },
        InOut: function(k) {
            var s = 1.70158 * 1.525;
            if ( ( k *= 2 ) < 1 ) return 0.5 * ( k * k * ( ( s + 1 ) * k - s ) );
            return 0.5 * ( ( k -= 2 ) * k * ( ( s + 1 ) * k + s ) + 2 );
        }
    };
    this.Bounce = {
        In: function(k) {
            return 1 - this.Bounce.Out( 1 - k );
        },
        Out: function(k) {
            if ( k < ( 1 / 2.75 ) ) {
                return 7.5625 * k * k;
            } else if ( k < ( 2 / 2.75 ) ) {
                return 7.5625 * ( k -= ( 1.5 / 2.75 ) ) * k + 0.75;
            } else if ( k < ( 2.5 / 2.75 ) ) {
                return 7.5625 * ( k -= ( 2.25 / 2.75 ) ) * k + 0.9375;
            } else {
                return 7.5625 * ( k -= ( 2.625 / 2.75 ) ) * k + 0.984375;
            }
        },
        InOut: function(k) {
            if ( k < 0.5 ) return this.Bounce.In( k * 2 ) * 0.5;
            return this.Bounce.Out( k * 2 - 1 ) * 0.5 + 0.5;
        }
    };
}, 'Static');


Class(function MathTween(_object, _props, _time, _ease, _delay, _callback, _manual) {
    var _this = this;

    var _startTime, _startValues, _endValues;
    var _easeFunction, _paused, _newEase;
    var _spring, _damping, _update;

    var _elapsed = 0;

    
    (function() {
        if (_object && _props) {
            if (typeof _time !== 'number') throw 'MathTween Requires object, props, time, ease';
            start();
        }
    })();
    
    function start() {
        if (!_object.multiTween && _object._mathTween && !_manual) TweenManager.clearTween(_object);
        if (!_manual) TweenManager._addMathTween(_this);

        let propString = getPropString();

            _object._mathTween = _this;
        if (_object.multiTween) {
            if (!_object._mathTweens) _object._mathTweens = [];
            _object._mathTweens.forEach(t => {
                if (t.props == propString) t.tween.stop();
            });
            _this._tweenWrapper = {props: propString, tween: _this};
            _object._mathTweens.push(_this._tweenWrapper);
        }

        if (typeof _ease == 'string') {
            _ease = TweenManager.Interpolation.convertEase(_ease);
            _easeFunction = typeof _ease === 'function';
        }

        _startTime = performance.now();
        _startTime += _delay;
        _endValues = _props;
        _startValues = {};

        if (_props.spring) _spring = _props.spring;
        if (_props.damping) _damping = _props.damping;

        _this.startValues = _startValues;

        for (var prop in _endValues) {
            if (typeof _object[prop] === 'number') _startValues[prop] = _object[prop];
        }
    }

    function getPropString() {
        let string = '';
        for (let key in _props) {
            if (typeof _props[key] === 'number') string += key+' ';
        }
        return string;
    }
    
    function clear() {
        if (!_object && !_props) return false;
        _object._mathTween = null;
        TweenManager._removeMathTween(_this);
        Utils.nullObject(_this);

        if (_object._mathTweens) {
            _object._mathTweens.remove(_this._tweenWrapper);
        }
    }

    

    
    
    this.update = function(time) {
        if (_paused || time < _startTime) return;

        _elapsed = (time - _startTime) / _time;
        _elapsed = _elapsed > 1 ? 1 : _elapsed;

        let delta = this.interpolate(_elapsed);

        if (_update) _update(delta);
        if (_elapsed == 1) {
            if (_callback) _callback();
            if (_this.completePromise) _this.completePromise.resolve();
            clear();
        }
    };

    
    this.pause = function() {
        _paused = true;
    };

    
    this.resume = function() {
        _paused = false;
        _startTime = performance.now() - (_elapsed * _time);
    };

    
    this.stop = function() {
        _this.stopped = true;
        clear();
        return null;
    };

    
    this.setEase = function(ease) {
        if (_newEase != ease) {
            _newEase = ease;
            _ease = TweenManager.Interpolation.convertEase(ease);
            _easeFunction = typeof _ease === 'function';
        }
    };

    
    this.getValues = function() {
        return {
            start: _startValues,
            end: _endValues,
        }
    };

    
    this.interpolate = function(elapsed) {
        var delta = _easeFunction ? _ease(elapsed, _spring, _damping) : TweenManager.Interpolation.solve(_ease, elapsed);

        for (var prop in _startValues) {
            if (typeof _startValues[prop] === 'number' && typeof _endValues[prop] === 'number') {
                var start = _startValues[prop];
                var end = _endValues[prop];
                _object[prop] = start + (end - start) * delta;
            }
        }

        return delta;
    };

    
    this.onUpdate = function(callback) {
        _update = callback;
        return this;
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


Class(function TweenTimeline() {
    Inherit(this, Component);
    const _this = this;
    let _tween;

    let _total = 0;
    const _tweens = [];

    
    this.elapsed = 0;

    function calculate() {
        _tweens.sort(function(a, b) {
            const ta = a.time + a.delay;
            const tb = b.time + b.delay;
            return tb - ta;
        });

        const first = _tweens[0];
        _total = first.time + first.delay;
    }

    function loop() {
        let time = _this.elapsed * _total;
        for (let i = _tweens.length - 1; i > -1; i--) {
            let t = _tweens[i];
            let relativeTime = time - t.delay;
            let elapsed = Math.clamp(relativeTime / t.time, 0, 1);

            t.interpolate(elapsed);
        }

        _this.events.fire(TweenTimeline.UPDATE, _this, true);
    }

    

    
    this.get('timeRemaining', () => {
        return _total - (_this.elapsed * _total)
    });

    
    this.add = function(object, props, time, ease, delay) {
        let tween;
        if (object instanceof HydraObject) tween = new FrameTween(object, props, time, ease, delay, null, true);
        else tween = new MathTween(object, props, time, ease, delay, null, true);
        _tweens.push(tween);

        tween.time = time;
        tween.delay = delay || 0;

        calculate();

        return tween;
    };

    
    this.tween = function(to, time, ease, delay, callback) {
        _this.clearTween();
        _tween = tween(_this, {elapsed: to}, time, ease, delay).onUpdate(loop).onComplete(callback);
    };

    
    this.clearTween = function() {
        if (_tween && _tween.stop) _tween.stop();
    };

    
    this.startRender = function() {
        Render.start(loop);
    };

    
    this.stopRender = function() {
        Render.stop(loop);
    };

    
    this.update = function() {
        loop();
    };

    
    this.destroy = function() {
        _this.clearTween();
        Render.stop(loop);
        for (var i = 0; i < _tweens.length; i++) _tweens[i].stop();
    };

}, () => {

    
    TweenTimeline.UPDATE = 'tweentimeline_update';
});
