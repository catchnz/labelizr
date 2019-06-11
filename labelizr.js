;(function (root, factory) {

   // AMD. Register as an anonymous module depending on jQuery.
   if (typeof define === 'function' && define.amd) define(['jquery'], factory);

   // Node, CommonJS-like
   else if (typeof exports === 'object') module.exports = factory(require('jquery'));

   // Browser globals (root is window)
   else {
       factory(root.jQuery);
   }

}(this, function ($, undefined) {

   "use strict"

   $(function() {

        var pluginName = "labelizr",
            pluginVersion = "0.2.3",
            resizeTimeoutHandles = {},
            cssCache = {},
            styleAttrCache = {},
            defaults = {
                transitionDuration: 0.1,
                transitionEasing: 'ease-in-out',
                labelClass: '',
                classSwitchOnly: false,
                alwaysDisplay: [], // select, textarea, input
                typeMatches: /text|password|email|number|search|url|tel/,
                css: {
                    'field': {},
                    'field-active': {},
                    'field-focus': {},
                    'label': {
                        'position': 'absolute',
                        'color': '#838780',
                        'background-color': 'transparent',
                        '-moz-opacity': '0',
                        '-khtml-opacity': '0',
                        '-webkit-opacity': '0',
                        'opacity': '0'
                    },
                    'label-active': {
                        'color': '#838780',
                        '-moz-opacity': '1',
                        '-khtml-opacity': '1',
                        '-webkit-opacity': '1',
                        'opacity': '1'
                    },
                    'label-focus': {
                        'color': '#2996cc'
                    }
                }
            };

        function Plugin(element, options) {
            this.$element = $(element);
            this.settings = $.extend(true, {}, defaults, options);
            this.init();
        }

        Plugin.prototype = {

            init: function() {

                // Set Vars
                var $label,
                    self = this,
                    settings = this.settings,
                    transDuration = settings.transitionDuration,
                    transEasing = settings.transitionEasing,
                    $elem = this.$element,
                    elementID = $elem.attr('id'),
                    placeholderText = $elem.attr('placeholder'),
                    floatingText = $elem.attr('data-label'),
                    extraClasses = $elem.attr('data-class'),
                    animationCss = {
                        '-webkit-transition': 'all ' + transDuration + 's ' + transEasing,
                        '-moz-transition': 'all ' + transDuration + 's ' + transEasing,
                        '-o-transition': 'all ' + transDuration + 's ' + transEasing,
                        '-ms-transition': 'all ' + transDuration + 's ' + transEasing,
                        'transition': 'all ' + transDuration + 's ' + transEasing
                    }

                // Validate
                if ($elem.prop('tagName').toUpperCase() !== 'INPUT' &&
                    $elem.prop('tagName').toUpperCase() !== 'TEXTAREA' &&
                    $elem.prop('tagName').toUpperCase() !== 'SELECT') {
                    return;
                }
                if ($elem.prop('tagName').toUpperCase() == 'INPUT' &&
                    !settings.typeMatches.test($elem.attr('type'))) {
                    return;
                }

                // Create an ID if there isn't one
                if (!elementID) {
                    while (!elementID || $('#' + elementID).length) {
                        elementID = Math.floor(Math.random() * 1000) + 1;
                    }
                    $elem.attr('id', elementID);
                }

                // do some saity checks
                if (!extraClasses)
                    extraClasses = '';

                if (!placeholderText || placeholderText === '')
                    placeholderText = "You forgot to add placeholder attribute!";

                if (!floatingText || floatingText === '')
                    floatingText = placeholderText;

                // deal to the markup
                $elem.wrap('<div class="floatlabel-wrapper" style="position:relative"></div>');
                $elem.before('<label for="' + elementID + '" class="label-floatlabel ' + settings.labelClass + ' ' + extraClasses + '">' + floatingText + '</label>');
                $label = this.$label = $elem.parent().find('label').css({'display':'none'});

                // save the original state of the elements
                styleAttrCache[elementID] = $elem.attr('style') == undefined ? '' : $elem.attr('style');

                // Check value on event
                $elem
                    .off('keyup.labelizr')
                    .off('blur.labelizr')
                    .off('change.labelizr')
                    .on('keyup.labelizr blur.labelizr change.labelizr', function(e) {
                        self.checkValue(e);
                    });

                // Blur Callback
                $elem
                    .off('blur.labelizr')
                    .on('blur.labelizr', function() {

                        var state = $elem.is('.active-floatlabel') ? '-active' : '';

                        $elem.removeClass('focus-floatlabel');
                        $label.removeClass('focus-floatlabel');

                        if (!settings.classSwitchOnly) {
                            $elem.css(self.cssConf('field' + state));
                            $label.css(self.cssConf('label' + state));
                        }

                    });

                // Focus Callback
                $elem
                    .off('focus.labelizr')
                    .on('focus.labelizr', function() {

                        var state = $elem.is('.active-floatlabel') ? '-active' : '';

                        $elem.addClass('focus-floatlabel');
                        $label.addClass('focus-floatlabel');

                        if (!settings.classSwitchOnly) {
                            $elem.css(self.cssConf('field-focus', 'field' + state));
                            $label.css(self.cssConf('label-focus', 'label' + state));
                        }

                    });

                // resize callback
                // might be best to namespace this per element to prevent multiple callbacks
                var ev = this.hasOrientationChange() ? 'orientationchange.labelizr' : 'resize.labelizr';
                $(window)
                    .off(ev)
                    .on(ev, function(e) {

                        // find the currently focused element
                        var $cur = $(':focus');

                        // do some initial cleanup
                        $label
                            .removeClass('active-floatlabel')
                            .removeClass('focus-floatlabel');

                        $elem
                            .trigger('blur')
                            .data('flout', '0')
                            .removeClass('active-floatlabel')
                            .removeClass('focus-floatlabel');

                        // flush the css cache and reset the styles
                        self.resetInlineStyles(elementID);
                        self.flushCssCache(elementID);

                        // reset the label to the initial state
                        $label.css({'display':'none'});

                        // clear existing timeouts
                        if (resizeTimeoutHandles[elementID] != undefined)
                            clearTimeout(resizeTimeoutHandles[elementID]);

                        // set a timeout on reinitalising things
                        resizeTimeoutHandles[elementID] = setTimeout(function() {

                            // lets just make sure it's set to undefined
                            resizeTimeoutHandles[elementID] = undefined;

                            // apply styles if required
                            if (!settings.classSwitchOnly) {
                                $label.css(animationCss).css(self.cssConf('label'));
                                $elem .css(animationCss).css(self.cssConf('field'));
                            }

                            // recheck the value
                            self.checkValue();

                            //look not attr that stops focus data-fl-no-focus
                            if (!$cur.data("fl-no-focus")) {
                                // refocus only
                                $cur.trigger('focus');
                            }

                        }, 300);

                    }).trigger(ev);

            },

            isAndroid: function() {
                return /Android/.test(navigator.userAgent);
            },

            hasOrientationChange: function() {
                return 'onorientationchange' in window;
            },

            flushCssCache: function(id) {
                if (id == undefined) cssCache = {};
                else cssCache[id] = undefined;
            },

            resetInlineStyles: function(id) {
                $('#' + id).attr('style', styleAttrCache[id]);
                $('label[for="' + id + '"]').attr('style','');
            },

            cssConf: function(type, base) {

                // vars
                var $elem = this.$element;
                var $label = $elem.parent().find('label');
                var id = $elem.attr('id');

                // build the css cache
                if (cssCache[id] == undefined) {

                    // initalise the cache for this element
                    cssCache[id] = {};

                    // Initial State Field CSS
                    cssCache[id]['field'] = $.extend({}, {
                        'padding-top': $elem.css('padding-top'),
                        'height': $elem.outerHeight()
                    }, this.settings.css['field']);

                    // Initial State Label CSS
                    cssCache[id]['label'] = $.extend({}, {
                        'top': $elem.css('padding-top'),
                        'left': $elem.css('padding-left'),
                        'font-size': $elem.css('font-size'),
                        'font-weight': $elem.css('font-weight'),
                        'color': $elem.css('color'),
                        'height': $elem.css('line-height'),
                        'display':'none'
                    }, this.settings.css['label']);

                    // Active State Field CSS
                    cssCache[id]['field-active'] = $.extend({}, {
                        'padding-top': parseInt($elem.css('padding-top')) + $label.outerHeight(),
                        'height': $elem.outerHeight() + $label.outerHeight()
                    }, this.settings.css['field-active']);

                    // Active State Label CSS
                    cssCache[id]['label-active'] = $.extend({}, {

                    }, this.settings.css['label-active']);

                    // Focus State Field CSS
                    cssCache[id]['field-focus'] = $.extend({}, {

                    }, this.settings.css['field-focus']);

                    // Focus State Label CSS
                    cssCache[id]['label-focus'] = $.extend({}, {

                    }, this.settings.css['label-focus']);

                }

                return base == undefined || !base
                    ? cssCache[id][type]
                    : $.extend({}, cssCache[id][base], cssCache[id][type]);

            },

            checkValue: function(e) {

                if (e) {
                    var keyCode = e.keyCode || e.which;
                    if (keyCode === 9) {
                        return;
                    }
                }

                var $elem = this.$element,
                    currentFlout = $elem.data('flout');

                if ($elem.val() !== "")
                    $elem.data('flout', '1');

                if ($elem.val() === "")
                    $elem.data('flout', '0');

                if ($elem.data('flout') === '1' && currentFlout !== '1')
                    this.showLabel();

                if (
                    $elem.data('flout') === '0' &&
                    currentFlout !== '0' && (
                        $elem.prop('tagName').toUpperCase() !== 'SELECT' ||
                        (
                            $elem.prop('tagName').toUpperCase() === 'SELECT' &&
                            this.settings.alwaysDisplay.indexOf('select') === -1
                        )
                    )
                ) this.hideLabel();

            },

            showLabel: function() {

                var self = this, labelCss, fieldCss;

                self.$label.css({'display': 'block'});

                if (!self.settings.classSwitchOnly) {

                    if (self.$element.is('.focus-floatlabel')) {
                        labelCss = self.cssConf('label-focus', 'label-active');
                        fieldCss = self.cssConf('field-focus', 'field-active');
                    } else {
                        labelCss = self.cssConf('label-active');
                        fieldCss = self.cssConf('field-active');
                    }

                    self.$label.css(labelCss);
                    self.$element.css(fieldCss);
                }

                self.$label.addClass('active-floatlabel');
                self.$element.addClass('active-floatlabel');

            },

            hideLabel: function() {

                var self = this;

                if (!self.settings.classSwitchOnly) {
                    self.$label.css(self.cssConf('label'));
                    self.$element.css(self.cssConf('field'));
                }

                self.$label.removeClass('active-floatlabel');
                self.$element.removeClass('active-floatlabel');

                // consider changing this to:
                // self.$label.one('transitionend.move webkitTransitionEnd.move oTransitionEnd.move otransitionend.move MSTransitionEnd.move', function(e) {});
                window.setTimeout(function() {
                    self.$label.css({'display': 'none'});
                }, self.settings.transitionDuration * 1000);

            }
        };

        $.fn[pluginName] = function(options) {
            return this.each(function() {
                if (!$.data(this, "plugin_" + pluginName)) {
                    $.data(this, "plugin_" + pluginName, new Plugin(this, options));
                }
            });
        };
    });

}));
