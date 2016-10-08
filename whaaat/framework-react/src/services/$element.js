/**
 * @module framework
 * @submodule $element
 * @namespace framework
 *
 * @returns {Object} service component
 */

const $element = (function() {
  let _util,
      _obj,
      _config;

  /*!
   * Creates a form and appends it to the body with the action,
   * method and target populated.
   *
   * @method _initialiseForm
   * @private
   * @param  {String} action The url of the form to submit to data to
   * @param  {String} method The method of the form to use when submitting (post / get)
   * @param  {String} target Where the form should submit the data (_self, _parent, _blank)
   * @return {String}        The id of the form to use when creating the inputs
   */
  function _initialiseForm(action, method, target) {
    if (_util.toType(action) === 'undefined') {
      _util.log('$element.form : initialise : There was no action passed');
      return false;
    }

    const id = 'form_' + Date.now();
    let node = document.createElement('FORM');
    node.setAttribute('action', action);
    node.setAttribute('method', method || 'post');
    node.setAttribute('target', target || '_self');
    node.setAttribute('id', id);
    document.getElementsByTagName('body')[0].appendChild(node);
    return id;
  }

  /*!
   * Creates the input and appends it to an element with the id passed in.
   *
   * @method _createInput
   * @private
   * @example _createInput(formId, field, value, type)
   *    {String} formId    The id of the element used to append the input to
   *    {String} field     The string to be used to populate the name and id of the input
   *    {String} value     The value that the input should be set to
   *    {String} type      The type of input that should created.
   * @param  {Array} arguments    The arguments of the function
   * @return {Object}         The HTML element of the input created
   */
  function _createInput() {
    const [formId, field, value, type] = arguments;
    if (_util.toType(formId) === 'undefined') {
      _util.log('$element.form : createInput : There was no form ID passed');
      return false;
    }

    let node = document.createElement('INPUT');
    node.setAttribute('type', type || 'string');
    node.setAttribute('id', field);
    node.setAttribute('name', field);
    node.setAttribute('value', value);
    return document.getElementById(formId).appendChild(node);
  }

  /**
   * The $element service
   *
   * @class $element
   */
  return {

    /*!
     * Module dependencies
     *
     * @hidden
     * @type {Array}
     */
    requires : [
      'util',
      'config'
    ],

    /*!
     * Module initialization function
     *
     * @method _init_
     * @hidden
     * @param  {Array} requires Dependencies injections
     */
    _init_ : function(requires) {
      /*eslint-disable dot-notation*/
      _util   = requires['util'];
      _config = requires['config'];
      _obj    = _util.object;
      /*eslint-enable dot-notation*/
    },

    /**
     * Gets an element from the dom according to the id
     *
     * @method  get
     * @public
     * @param  {String}         id The id of the element we want
     * @return {Object|Boolean}    Element or false if not found
     */
    get : function(id) {
      const element = document.getElementById(id);

      if (!element) {
        _util.log('$element : get : There is no element with id : ' + id);
        return false;
      }

      return document.getElementById(id);
    },

    /**
     * Adds a class to an element
     *
     * @method  addClass
     * @public
     * @param {Object} domNode   HTML element
     * @param {String} className Class we want to add
     */
    addClass : function(domNode, className) {
      if (domNode instanceof SVGElement) {
        this.svg.addClass(domNode, className);
        return;
      }
      if (!(domNode instanceof HTMLElement)) {
        return;
      }
      const classNames = domNode.className.split(' '),
          movingIndex = classNames.indexOf(className);
      if (movingIndex < 0) {
        domNode.className += ' ' + className;
      }
    },

    /**
     * Removes a class from an element
     *
     * @method removeClass
     * @public
     * @param  {Object} domNode   HTML element
     * @param  {String} className Class we want to remove
     */
    removeClass : function(domNode, className) {
      if (domNode instanceof SVGElement) {
        this.svg.removeClass(domNode, className);
        return;
      }
      if (!(domNode instanceof HTMLElement)) {
        return;
      }
      const classNames = domNode.className.split(' '),
          movingIndex = classNames.indexOf(className);
      if (movingIndex > 0) {
        classNames.splice(movingIndex, 1);
        domNode.className = classNames.join(' ');
      }
    },

    /**
     * Toggles a class to an element
     *
     * @method toggleClass
     * @public
     * @param  {Object} domNode      HTML Element
     * @param  {String} className    Class we want to toggle
     */
    toggleClass : function(domNode, className) {
      if (domNode instanceof SVGElement) {
        this.svg.toggleClass(domNode, className);
        return;
      }
      if (!(domNode instanceof HTMLElement)) {
        return;
      }
      const classNames = domNode.className.split(' '),
          movingIndex = classNames.indexOf(className);
      if (movingIndex > 0) {
        this.removeClass(domNode, className);
      } else {
        this.addClass(domNode, className);
      }
    },

    /**
     * Checks if an element has a class on it.
     *
     * @method hasClass
     * @param  {Object}  domNode   HTML Element
     * @param  {String}  className Class we want to search
     * @return {Boolean}           True if we found it, false otherwise
     */
    hasClass : function(domNode, className) {
      if (domNode instanceof SVGElement) {
        this.svg.hasClass(domNode, className);
        return false;
      }
      const classNames = domNode.className.split(' '),
          classIndex = classNames.indexOf(className);

      return (classIndex > 0);
    },

    /**
     * Checks if element is visible in a list
     * (verticaly)
     *
     * @method  visibleInList
     * @public
     * @param  {Object}   el  HTML element
     * @return {Boolean}      True if its visible, false otherwise
     */
    visibleInList : function(el) {
      let rect   = el.getBoundingClientRect(),
          top    = rect.top,
          height = rect.height;

      el = el.parentNode;

      do {
        rect = el.getBoundingClientRect();
        if (top <= rect.bottom === false) {
          return false;
        }
        // Check if the element is out of view due to a container scrolling
        if ((top + height) <= rect.top) {
          return false;
        }
        el = el.parentNode;
      } while (el !== document.body);
      // Check its within the document viewport
      return top <= document.documentElement.clientHeight;
    },

    /**
     * Creates the form from the object passed in, loops through the inputs array
     * and populates to form tag with the inputs.
     *
     * @param  {Object} formObj     The Object holding all form data
     *    @param  {String} formObj.action     The string used as the action on the form tag
     *    @param  {String} formObj.method     The string used as the method on the form tag
     *    @param  {String} formObj.target     The string used as the target on the form tag
     *    @param  {Array} formObj.inputs      The Array of inputs to loop around
     *       @param  {Object} input      The Object of input data
     *          @param  {String} input.field       The string used as the field for the input
     *          @param  {String} input.value       The string used as the value for the input
     *          @param  {String} input.type        The string used as the type for the input
     * @return {Object}         The object contains the submit function so the form can be submitted
     */
    createForm : function(formObj) {
      const { action, method, target, inputs } = formObj,
          formId = _initialiseForm(action, method, target);
      let inputLength = inputs.length,
          i = 0;

      for (i; i < inputLength; i++) {
        let { field, value, type } = inputs[i];
        _createInput(formId, field, value, type);
      }

      return {
        submit : function() {
          document.getElementById(formId).submit();
        }
      };
    },

    /**
     * The $element.svg component
     *
     * @class $element.svg
     */
    svg : {
      /**
       * Checks an svg element if it contains the specific class
       *
       * @method  hasClass
       * @public
       * @param  {Object}  svgEl     Svg Element
       * @param  {String}  className Class
       * @return {Boolean}           True if it contains it, false otherwise
       */
      hasClass : function(svgEl, className) {
        return new RegExp('(\\s|^)' + className + '(\\s|$)').test(svgEl.getAttribute('class'));
      },

      /**
       * Removes class from an svg element
       *
       * @method  removeClass
       * @public
       * @param  {Object}  svgEl     Svg Element
       * @param  {String}  className Class
       */
      removeClass : function(svgEl, className) {
        const removedClass = svgEl.getAttribute('class').replace(new RegExp('(\\s|^)' + className + '(\\s|$)', 'g'), '$2');
        if (this.hasClass(svgEl, className)) {
          svgEl.setAttribute('class', removedClass);
        }
      },

      /**
       * Adds a class on an svg element
       *
       * @method  addClass
       * @public
       * @param  {Object}  svgEl     Svg Element
       * @param  {String}  className Class
       */
      addClass : function(svgEl, className) {
        if (!this.hasClass(svgEl, className)) {
          svgEl.setAttribute('class', svgEl.getAttribute('class') + ' ' + className);
        }
      },

      /**
       * Toggles a class from an svg el
       *
       * @method  toggleClass
       * @public
       * @param  {Object}  svgEl     Svg Element
       * @param  {String}  className Class
       */
      toggleClass : function(svgEl, className) {
        if (this.hasClass(svgEl, className)) {
          this.removeClass(svgEl, className);
        } else {
          this.addClass(svgEl, className);
        }
      }
    }
  };
});

export default $element;
