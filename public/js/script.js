var TMW = window.TMW || {};

TMW.TwitterPoll = {
	socket : null,

	state : {
		pageType : null,
		qID : null,
	},


	init : function () {

		this.makeSocketConnection();

		var $pageContainer = $('.container');

		this.state.pageType = $pageContainer.getAttribute('data-page-type');

		if (this.state.pageType === 'question') {
			this.state.qID = $('#question').getAttribute('data-questionurl');
			this.EventListeners.onPageStart();

			this.checkHeaderHeight();
		}

		TMW.AdaptiveImage.init(window);

		//SwiftClick.attach (document.body);

	},

	makeSocketConnection : function () {

		var connectionURL = window.location.hostname;

		this.socket = io.connect(connectionURL);

	},

	checkHeaderHeight : function () {

		var throttledResize = _.throttle(resizeHeader, 100);

		window.onresize = throttledResize;

		function resizeHeader () {

			if (matchMedia('(min-width: 600px)').matches) {
				var descriptionHeight = $('.page-header-description').clientHeight;

				_.each($('.social-button'), function (item) {
					item.style.height = descriptionHeight + 'px';
				});
			} else {
				_.each($('.social-button'), function (item) {
					item.style.height = 'auto';
				});
			}
		}

		resizeHeader();

	},

	setupScreen : function (state) {

		var pollCats = $('.question-category'),
			numOfCats = pollCats.length,
			percentageColumn,
			term,
			currentState = state[TMW.TwitterPoll.state.qID];

		//log('App state', currentState);

		_.each(pollCats, function (cat, index) {
			term = cat.getAttribute('data-term');
			percentageColumn = currentState.tagsData[term].percentage;

			//log('Category percentage', term, percentageColumn);

			switch (TMW.TwitterPoll.state.qID) {
				case 'happiness':
				case 'shower-or-bath':
				case 'console-wars-ps4-xbox':
					cat.style.width = percentageColumn + '%';
					break;
				case 'girls':
				case 'xfactor-2013':
					var subPercentage = 30 + ((70/100) * percentageColumn);
					cat.getElementsByClassName('category-visual-counter')[0].style.height = subPercentage + '%';
					break;
				default:
					cat.getElementsByClassName('category-visual-counter')[0].style.height = percentageColumn + '%';
			}

			//This is fired once we anticipate the page has animated in
			window.setTimeout(function () {
				cat.className += ' animatein';
				TMW.TwitterPoll.EventListeners.onTweet();
			}, 1000);
		});

	},

	EventListeners : {
		onPageStart : function () {

			//will receive this event when a connection is made
			TMW.TwitterPoll.socket.on('data', TMW.TwitterPoll.setupScreen);


		},
		onTweet : function () {

			var tweetText,
				total,
				key,
				percentage,
				idFriendlyKey,
				pollWrapper,
				pollVisualCounter,
				pollTotal;

			//this handles the tweets we receive from our server
			TMW.TwitterPoll.socket.on('tweet', function(state) {

				var relevantState = state[TMW.TwitterPoll.state.qID];
				//tweetText = newTweet.text;

				for (var key in relevantState.tagsData) {

					var idFriendlyKey = key;

					//log(key, percentage, state.symbols[key].total, state.symbols[key].isHashTag);

					if (TMW.TwitterPoll.isHashTag(key)) {
						idFriendlyKey = key.substr(1);
					}

					TMW.TwitterPoll.updateVisuals(idFriendlyKey, relevantState.tagsData[key]);

				}

				$('#last-update').innerHTML = new Date().toTimeString();

			});

		}
	},

	updateVisuals : function (key, tagData) {

		var percentage = tagData.percentage,

			pollWrapper = $('#' + key),
			pollVisualCounter = $('#' + key + ' .category-visual-counter'),
			pollTotal = $('#' + key + ' .question-category-votes'),
			pollPercentage = $('#' + key + ' .question-category-percentage'),

		//make the votes readale if they go into the thousands
			votes = this.makeVotesReadable(tagData.votes);

		switch (TMW.TwitterPoll.state.qID) {
			case 'happiness':
			case 'shower-or-bath':
			case 'console-wars-ps4-xbox':
				pollWrapper.style.width = percentage + '%';
				pollTotal.innerHTML = '(' + votes + ')';
				pollPercentage.innerHTML = (Math.round( percentage * 10 ) / 10) + '%';
				break;
			case 'girls':
			case 'xfactor-2013':
				//make each percentage  a percentage of 50% rather than 100% to keep visual on screen a certain amount
				var subPercentage = 30 + ((70/100) * percentage);
				pollVisualCounter.style.height = subPercentage + '%';
				pollTotal.innerHTML = '(' + votes + ')';
				pollPercentage.innerHTML = (Math.round( percentage * 10 ) / 10) + '%';
				break;
			default:
				pollVisualCounter.style.height = percentage + '%';
				pollTotal.innerHTML = '(' + votes + ')';
				pollPercentage.innerHTML = (Math.round( percentage * 10 ) / 10) + '%';
		}

	},

	makeVotesReadable : function (votes) {

		return addCommas(votes);

	},

	isHashTag : function (text) {
		if (text.indexOf('#') !== -1) {
			return true;
		}
		return false;
	}
};


/*	Adaptive Image method
:	-------------------------
:	Borrows heavily from Scott Jehls picturefill.js
:	https://github.com/scottjehl/picturefill
:
:	but is structured differently in HTML and slight tweaks to work a bit 'tidier'
:	with respect to drupal and the adaptive image module
:
:
:	Function List
:	1. init
:	2. adaptiveChecker
********************************************************/
TMW.AdaptiveImage = {

	init : function(w) {

		// Run on resize and domready (w.load as a fallback)
		if( w.addEventListener ) {
			w.addEventListener( "DOMContentLoaded", function(){
				TMW.AdaptiveImage.adaptiveChecker();
				// Run once only
				w.removeEventListener( "load", TMW.AdaptiveImage.adaptiveChecker, false );
			}, false );
			w.addEventListener( "load", TMW.AdaptiveImage.adaptiveChecker, false );
		}
		else if( document.attachEvent ){
			w.attachEvent( "onload", function () {
				TMW.AdaptiveImage.adaptiveChecker();
			} );
		}

	},


	adaptiveChecker : function (elements) {

		var ps = elements || window.document.getElementsByTagName( "div" );
		// Loop the pictures
		for( var i = 0, il = ps.length; i < il; i++ ) {
			if( ps[ i ].getAttribute( "data-adaptive" ) !== null &&
				ps[ i ].style.display !== 'none' ) {
				var selected_breakpoint = 'max',
					breakpoints = ps[ i ].getAttribute("data-adaptive-image-breakpoints");

				if (breakpoints) {
					breakpoints = breakpoints.split(' ');

					for( var j = 0, br = breakpoints.length; j < br; j++ ){
						if (document.documentElement.clientWidth <= Number(breakpoints[j]) &&
							(selected_breakpoint == 'max' || Number(breakpoints[j]) < Number(selected_breakpoint))) {
							selected_breakpoint = breakpoints[j];
						}
					}
				}

				//get the image path for the right breakpoint
				imgPath = ps[ i ].getAttribute('data-img-' + selected_breakpoint);

				// Find any existing img element in the adaptive element
				var picImg = ps[ i ].getElementsByTagName( "img" )[ 0 ];

				if( imgPath ){
					if( !picImg ){
						picImg = document.createElement( "img" );
						picImg.alt = ps[ i ].getAttribute( "data-alt" );
						ps[ i ].appendChild( picImg );
					}

					picImg.src =  imgPath;
				}
				else if( picImg ){
					ps[ i ].removeChild( picImg );
				}
			}
		}
	}
}


/**
 * Add commas to
 * @param {[type]} nStr [description]
 */
		function addCommas(nStr){
		  nStr += '';
		  x = nStr.split('.');
		  x1 = x[0];
		  x2 = x.length > 1 ? '.' + x[1] : '';
		  var rgx = /(\d+)(\d{3})/;
		  while (rgx.test(x1)) {
			x1 = x1.replace(rgx, '$1' + ',' + '$2');
		  }
		  return x1 + x2;
		}


//  ================
//  === EASY LOG ===
//  ================
// usage: log('inside coolFunc', this, arguments);
// paulirish.com/2009/log-a-lightweight-wrapper-for-consolelog/
		window.log = function f() {
				log.history = log.history || [];
				log.history.push(arguments);
				if (this.console) {
						var args = arguments,
								newarr;
						try {
								args.callee = f.caller;
						} catch (e) {}
						newarr = [].slice.call(args);
						if (typeof console.log === 'object')  {
							log.apply.call(console.log, console, newarr);
						} else {
							console.log.apply(console, newarr);
						}
				}
		};

//  ===========================
//  === Allow bind for IE9< ===
//  ===========================
		if(!function(){}.bind){
		  Function.prototype.bind = function(){
			var me = this
			, shift = [].shift
			, he = shift.apply(arguments)
			, ar = arguments
			return function(){
			  return me.apply(he, ar);
			}
		  }
		}

//  ============================================
//  === getElementsByClassName for everyone! ===
//  ============================================
		if (typeof document.getElementsByClassName!='function') {
			document.getElementsByClassName = function() {
				var elms = document.getElementsByTagName('*');
				var ei = new Array();
				for (i=0;i<elms.length;i++) {
					if (elms[i].getAttribute('class')) {
						ecl = elms[i].getAttribute('class').split(' ');
						for (j=0;j<ecl.length;j++) {
							if (ecl[j].toLowerCase() == arguments[0].toLowerCase()) {
								ei.push(elms[i]);
							}
						}
					} else if (elms[i].className) {
						ecl = elms[i].className.split(' ');
						for (j=0;j<ecl.length;j++) {
							if (ecl[j].toLowerCase() == arguments[0].toLowerCase()) {
								ei.push(elms[i]);
							}
						}
					}
				}
				return ei;
			}
		}


//  ==================
//  === Swiftclick ===
//  ==================
	function SwiftClick (contextEl)
	{
		this.options =
		{
				elements: {a:"a", div:"div", span:"span", button:"button"},
				maxTouchDrift: 20
		};

		// SwiftClick is only used if both touch and orientationchange are supported.
		if (! ("onorientationchange" in window && "ontouchstart" in window)) return;

		var _self                                                        = this,
				_swiftContextEl                                        = contextEl,
				_swiftContextElOriginalClick        = _swiftContextEl.onclick,
				_currentSwiftEl                                        = "undefined",
				_currentlyTrackingTouch                        = false,
				_touchStartPoint                                = {x:0, y:0},
				_touchEnd                                                = "undefined",
				_shouldSynthesizeClickEvent                = true;

		// check if the swift el already has a click handler and if so hijack it so it get's fired after SwiftClick's, instead of beforehand.
		if (typeof _swiftContextElOriginalClick === "function")
		{
				_swiftContextEl.addEventListener ("click", hijackedSwiftElClickHandler, false);
				_swiftContextEl.onclick = null;
		}

		function hijackedSwiftElClickHandler (event)
		{
				_swiftContextElOriginalClick (event);
		}

		// add listeners.
		_swiftContextEl.addEventListener ("touchstart", touchStartHandler, false);
		_swiftContextEl.addEventListener ("touchend", touchEndHandler, false);

		function touchStartHandler (event)
		{
				var nodeName = event.target.nodeName.toLowerCase (),
						touch = event.changedTouches[0];

				// store touchstart positions so we can check for changes later (within touchend handler).
				_touchStartPoint.x = touch.pageX;
				_touchStartPoint.y = touch.pageY;

				// don't synthesize an event if we are already tracking, or if the node is not an acceptable type (the type isn't in the dictionary).
				if (_currentlyTrackingTouch || typeof _self.options.elements[nodeName] === "undefined")
				{
						_shouldSynthesizeClickEvent = false;
						return true;
				}

				_currentlyTrackingTouch = true;
				_currentSwiftEl = event.target;
		}

		function touchEndHandler (event)
		{
				_touchEnd = event.changedTouches[0];

				// cancel touch if the node type is unacceptable (not in the dictionary), or if the touchpoint position has drifted significantly.
				if (!_shouldSynthesizeClickEvent ||
						Math.abs (_touchEnd.pageX - _touchStartPoint.x) > _self.options.maxTouchDrift ||
						Math.abs (_touchEnd.pageY - _touchStartPoint.y) > _self.options.maxTouchDrift)
				{
						// reset vars to default state before returning early, effectively cancelling the creation of a synthetic click event.
						_currentlyTrackingTouch = false;
						_shouldSynthesizeClickEvent = true;
						return true;
				}

				event.preventDefault ();
				_currentSwiftEl.focus (); // TODO : is this working correctly?
				synthesizeClickEvent ();

				_currentlyTrackingTouch = false;
		}

		function synthesizeClickEvent ()
		{
				// Synthesize a click event, with an extra attribute so it can be tracked
				var clickEvent = document.createEvent ("MouseEvents");
				clickEvent.initMouseEvent ("click", true, true, window, 1, _touchEnd.screenX, _touchEnd.screenY, _touchEnd.clientX, _touchEnd.clientY, false, false, false, false, 0, null);

				_currentSwiftEl.dispatchEvent (clickEvent);
		}

		// add an array of node names (strings) for which swift clicks should be synthesized.
		_self.addNodeNamesToTrack = function (nodeNamesArray)
		{
				var i = 0,
						length = nodeNamesArray.length,
						currentNodeName;

				for (i; i < length; i++)
				{
						if (typeof nodeNamesArray[i] !== "string") throw new TypeError ("all values within the 'nodeNames' array must be of type 'string'");

						currentNodeName = nodeNamesArray[i].toLowerCase;
						_self.options.elements[currentNodeName] = currentNodeName;
				}
		};
	}

	// Use a basic implementation of the composition pattern in order to create new instances of SwiftClick.
	SwiftClick.attach = function (el)
	{
			"use strict";
			return new SwiftClick (el);
	};


	// check for AMD/Module support, otherwise define SwiftClick as a global variable.
	if (typeof define !== "undefined" && define.amd)
	{
			// AMD. Register as an anonymous module.
			define (function()
			{
					"use strict";
					return SwiftClick;
			});

	}
	else if (typeof module !== "undefined" && module.exports)
	{
			module.exports = SwiftClick.attach;
			module.exports.SwiftClick = SwiftClick;
	}
	else
	{
			window.SwiftClick = SwiftClick;
	}


/*! matchMedia() polyfill - Test a CSS media type/query in JS. Authors & copyright (c) 2012: Scott Jehl, Paul Irish, Nicholas Zakas, David Knight. Dual MIT/BSD license */

	window.matchMedia || (window.matchMedia = function() {
		"use strict";

		// For browsers that support matchMedium api such as IE 9 and webkit
		var styleMedia = (window.styleMedia || window.media);

		// For those that don't support matchMedium
		if (!styleMedia) {
			var style       = document.createElement('style'),
				script      = document.getElementsByTagName('script')[0],
				info        = null;

			style.type  = 'text/css';
			style.id    = 'matchmediajs-test';

			script.parentNode.insertBefore(style, script);

			// 'style.currentStyle' is used by IE <= 8 and 'window.getComputedStyle' for all other browsers
			info = ('getComputedStyle' in window) && window.getComputedStyle(style, null) || style.currentStyle;

			styleMedia = {
				matchMedium: function(media) {
					var text = '@media ' + media + '{ #matchmediajs-test { width: 1px; } }';

					// 'style.styleSheet' is used by IE <= 8 and 'style.textContent' for all other browsers
					if (style.styleSheet) {
						style.styleSheet.cssText = text;
					} else {
						style.textContent = text;
					}

					// Test if media query is true or false
					return info.width === '1px';
				}
			};
		}

		return function(media) {
			return {
				matches: styleMedia.matchMedium(media || 'all'),
				media: media || 'all'
			};
		};
	}());

//  ===========================================
//  === globals Element:true, NodeList:true ===
//  ===========================================

		$ = (function (document, $) {
			var element = Element.prototype,
				nodeList = NodeList.prototype,
				forEach = 'forEach',
				trigger = 'trigger',
				each = [][forEach],

				dummyEl = document.createElement('div');

			nodeList[forEach] = each;

			element.on = function (event, fn) {
				this.addEventListener(event, fn, false);
				return this;
			};

			nodeList.on = function (event, fn) {
				each.call(this, function (el) {
					el.on(event, fn);
				});
				return this;
			};

			element.trigger = function (type, data) {
				var event = document.createEvent('HTMLEvents');
				event.initEvent(type, true, true);
				event.data = data || {};
				event.eventName = type;
				event.target = this;
				this.dispatchEvent(event);
				return this;
			};

			nodeList.trigger = function (event) {
				each.call(this, function (el) {
					el[trigger](event);
				});
				return this;
			};

			$ = function (s) {
				var r = document.querySelectorAll(s || '☺'),
					length = r.length;
				return length == 1 ? r[0] : !length ? nodeList : r;
			};

			$.on = element.on.bind(dummyEl);
			$.trigger = element[trigger].bind(dummyEl);

			return $;
		})(document);



TMW.TwitterPoll.init();