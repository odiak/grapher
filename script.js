(function ($) {
    $(function () {
        var canvas = $('canvas');
        var h = 500;
        var w = 500;
        var ctx = canvas[0].getContext('2d');
        var ls;
        
        var DEFAULT_EQUATION = '';
        var DEFAULT_OFFSET_X = 0;
        var DEFAULT_OFFSET_Y = 0;
        var DEFAULT_OFFSET = {x: DEFAULT_OFFSET_X, y: DEFAULT_OFFSET_Y};
        var DEFAULT_SCALE = 150;
        var INC_SCALE = 10;
        var SCALE_BASE = 1.02;
        var ENTER_KEY = 13;
        
        if (typeof localStorage != 'undefined') {
            ls = localStorage;
        } else {
            ls = {};
        }
        
        canvas.attr({
            height: h,
            width: w
        });
        
        var floor = function (n) {
            return ~~n;
        };
        
        var clearCanvas = function () {
            ctx.clearRect(0, 0, w, h);
        };
        
        var drawAxis = function (offset) {
            var offset = offset || {x: 0, y: 0};
            var x = floor(w / 2) - 0.5 + offset.x;
            var y = floor(h / 2) - 0.5 + offset.y;
            clearCanvas();
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        };
        
        var validNum = function (n) {
            return !isNaN(n) && isFinite(n);
        };
        
        var vars = (function () {
            var vars = '';
            var p = 'exp,SQRT2,abs,sqrt,ceil,log,pow,sin,LOG10E,atan2,round,E,LN2,min,floor,asin,random,LN10,PI,LOG2E,tan,cos,atan,max,acos,SQRT1_2';
            var i, len, k;
            p = p.split(',');
            for (i = 0, len = p.length; i < len; i++) {
                if (vars) {
                    vars += ',';
                }
                k = p[i];
                vars += k + '=' + 'Math.' + k;
            }
            vars = 'var ' + vars + ';';
            return vars;
        })();
        
        var makeFunction = function (equation) {
            if (!equation) {
                equation = 'void(0)';
            }
            return new Function('x', vars + 'return (' + equation + ');');
        };
        
        var draw = function (equation, offset, scale) {
            var func;
            var X, Y;
            var x, y;
            var w2 = w / 2;
            var h2 = h / 2;
            var dX = w2 + offset.x;
            var dY = h2 + offset.y;
            var t;
            var dt = 0.1;
            var begined;
            var lineWidth;
            var zero;
            
            scale = Math.pow(SCALE_BASE, scale);
            
            func = makeFunction(equation);
            
            clearCanvas();
            drawAxis(offset);
            
            if (!func) {
                return;
            }
            
            lineWidth = ctx.lineWidth;
            ctx.lineWidth = 2;
            
            begined = false;
            for (t = 0; t <= w; t += dt) {
                X = t;
                x = (X - dX) / scale;
                try {
                    y = func(x);
                } catch (e) {
                    alert('error');
                    break;
                }
                Y = - y * scale + dY;
                
                if (isFinite(Y)) {
                    if (begined) {
                        ctx.lineTo(X, Y);
                        ctx.stroke();
                    } else {
                        begined = true;
                    }
                    ctx.beginPath();
                    ctx.moveTo(X, Y);
                } else if (!isNaN(Y)) {
                    if (begined) {
                        ctx.stroke();
                        begined = false;
                    }
                }
            }
            
            if (begined) {
                ctx.stroke();
            }
            
            ctx.lineWidth = lineWidth;
        };
        
        var equation = DEFAULT_EQUATION;
        var offset = DEFAULT_OFFSET;
        var scale = DEFAULT_SCALE;
        var input = $('#equation');
        input.on('keypress', function (event) {
            var _eq;
            if (event.keyCode == ENTER_KEY) {
                _eq = input.val();
                if (_eq == equation || !_eq) {
                    return;
                }
                equation = _eq;
                memorizeEquation();
                draw(equation, offset, scale);
            }
        });
        
        input.focus();
        draw(equation, offset, scale);
        
        var px, py;
        var mouseFlag = false;
        canvas.on('mousedown', function (event) {
            px = event.pageX;
            py = event.pageY;
            mouseFlag = true;
            return false;
        });
        
        $(document.body).on('mousemove', function (event) {
            var dx, dy;
            if (!mouseFlag) {
                return;
            }
            dx = event.pageX - px;
            dy = event.pageY - py;
            offset.x += dx;
            offset.y += dy;
            px = event.pageX;
            py = event.pageY;
            draw(equation, offset, scale);
            return false;
        });
        
        $(document.body).on('mouseup', function (event) {
            if (mouseFlag) {
                mouseFlag = false;
                memorizeOffset();
            }
        });
        
        var onmousewheel = function (event) {
            var oe = event.originalEvent;
            var deltaY = oe.wheelDeltaY || 0;
            if (oe.detail && oe.axis == oe.VERTICAL_AXIS) {
                deltaY = -oe.detail;
            }
            scale += deltaY;
            draw(equation, offset, scale);
            memorizeScale();
            
            event.preventDefault();
            return false;
        };
        
        canvas.on('mousewheel', onmousewheel);
        canvas.on('DOMMouseScroll', onmousewheel);
        
        var memorizeEquation = function () {
            ls.__equation = equation;
        };
        
        var memorizeOffset = function () {
            ls.__offset = [offset.x, offset.y].join(',');
        };
        
        var memorizeScale = function () {
            ls.__scale = scale + '';
        };
        
        var _tmp;
        if (typeof localStorage != 'undefined') {
            equation = ls.__equation || DEFAULT_EQUATION;
            _tmp = (ls.__offset || (DEFAULT_OFFSET_X + ',' + DEFAULT_OFFSET_Y)).split(',');
            offset = {x: _tmp[0] - 0, y: _tmp[1] - 0};
            scale = (ls.__scale || DEFAULT_SCALE) - 0;
            
            input.val(equation);
            draw(equation, offset, scale);
        }
        
        var resetScaleAndOffset = function () {
            offset.x = DEFAULT_OFFSET_X;
            offset.y = DEFAULT_OFFSET_Y;
            scale = DEFAULT_SCALE;
            draw(equation, offset, scale);
            memorizeScale();
            memorizeOffset();
        };
        
        var zoomUp = function () {
            scale += INC_SCALE;
            draw(equation, offset, scale);
            memorizeScale();
        };
        
        var zoomOut = function () {
            scale -= INC_SCALE;
            draw(equation, offset, scale);
            memorizeScale();
        };
        
        var clearAll = function () {
            equation = DEFAULT_EQUATION;
            resetScaleAndOffset();
            input.val(equation).focus();
            memorizeEquation();
        };
        
        $('#reset').on('click', resetScaleAndOffset);
        $('#zoom_up').on('click', zoomUp);
        $('#zoom_out').on('click', zoomOut);
        $('#clear_all').on('click', clearAll);
    });
})(jQuery);
