/**
 * A mixin to assist in managing 3d matrix transformations on a dom element
 */

var Transformations = exports.Transformations = {
  /**
   * initialize the transformations mixin
   */
  initTransformations: function(options) {
    this.setOptions(options);
    this.pushMatrix();
  },

  /**
   * handle the options passed into init or commit
   */
  setOptions: function(options) {
    for (var key in options) {
      this['_' + key] = options[key];
    }
  },

  /**
   * set the transition duration to use for the transition
   */
  setDuration: function(duration) {
    this._duration = duration;
    return this;
  },

  /**
   * set the timing function to be used for the transition
   */
  setTiming: function(timing) {
    this._timing = timing;
    return this;
  },

  /**
   * set the opacity to be applied at the next commit
   */
  setOpacity: function(opacity) {
    this._opacity = opacity;
    return this;
  },

  /**
   * rotate the current matrix
   */
  rotate: function() {
    var o = this._normalizeArguments.apply(this, arguments);
    this.setCurrentMatrix(this.getCurrentMatrix().rotate(o.x, o.y, o.z));
    return this;
  },

  /**
   * scale the current matrix
   */
  scale: function() {
    var o = this._normalizeArguments.apply(this, arguments);
    this.setCurrentMatrix(this.getCurrentMatrix().scale(o.x, o.y, o.z));
    return this;
  },

  /**
   * perform a translation on the current matrix
   */
  translate: function() {
    var o = this._normalizeArguments.apply(this, arguments);
    this.setCurrentMatrix(this.getCurrentMatrix().translate(o.x, o.y, o.z));
    return this;
  },

  /**
   * retrieve the top matrix from the stack
   */
  getCurrentMatrix: function() {
    if (this._matrices.length === 0) {
      this.pushMatrix();
    }
    return this._matrices[this._matrices.length - 1];
  },

  /**
   * update the top matrix on the stack
   */
  setCurrentMatrix: function(val) {
    if (this._matrices.length === 0) {
      this.pushMatrix();
    }
    this._matrices[this._matrices.length - 1] = val;
    return this;
  },

  /**
   * push a matrix onto the stack. If no argument is provide an empty
   * matrix is automatically created
   */
  pushMatrix: function(matrix) {
    this._matrices = this._matrices || [];
    this._matrices.push(matrix || new WebKitCSSMatrix());
    return this;
  },

  /**
   * remove a matrix from the stack
   */
  popMatrix: function() {
    this._matrices.pop();
    return this;
  },

  /**
   * retrieve the current cumulative translation
   */
  cumulativeTranslation: function() {
    var transform = this.cumulativeTransformation();
    return {
      x: transform.m41,
      y: transform.m42,
      z: transform.m43
    }
  },

  /**
   * retrieve the current cumulative scale
   */
  cumulativeScale: function() {
    var transform = this.cumulativeTransformation();
    return {
      x: transform.m11,
      y: transform.m22,
      z: transform.m33
    }
  },

  /**
   * calculate the cumulative transformation matrix
   */
  cumulativeTransformation: function() {
    if (this._matrices.length === 0) {
      return new WebKitCSSMatrix();
    }
    var matrix = this._matrices.reduce(function(memo, value) {
      return memo.multiply(value);
    });
    return matrix;
  },

  /**
   * apply the current stack of transformations
   * @param {Object}  options
   *        {Boolean} skipTransition - skip the transition for the current
   *                  commit
   */
  commit: function(options) {
    options = options || {};
    var skipTransition = options.skipTransition;
    delete options.skipTransition;
    var onFinish = options.onFinish;
    delete options.onFinish;
    this.setOptions(options || {});

    // optionally skip the transition for this commit only
    if (skipTransition) {
      this._el.style.webkitTransitionProperty = '';
    } else {
      this._el.style.webkitTransitionProperty       = '-webkit-transform, opacity';
      this._el.style.webkitTransitionDuration       = this._formatDuration(this._duration);
      this._el.style.webkitTransitionTimingFunction = this._timing;
    }

    if (onFinish) {
      if (skipTransition || !this._duration) {
        onFinish();
      } else {
        var el = this._el;
        this._el.addEventListener('webkitTransitionEnd', function() {
          el.removeEventListener('webkitTransitionEnd', arguments.callee);
          onFinish();
        });
      }
    }

    this._el.style.webkitTransform = this.cumulativeTransformation().toString();
    if (typeof this._opacity !== 'undefined') {
      this._el.style.opacity = this._opacity;
    }
    return this;
  },

  /**
   * take the passed in arguments and convert them to a normalized object
   * with x, y, z properties
   * a single number argument will be converted to x:num, y:num, z:num
   * three number arguments will be converted to x:num1, y:num2, z:num2
   * an object argument will be left intact
   */
  _normalizeArguments: function() {
    var args = Array.prototype.slice.call(arguments, 0);
    if (args.length > 1) {
      return {x: args[0], y: args[1], z: args[2]};
    } else if (Object(args[0]) === args[0]) {
      return args[0];
    } else {
      return {x: args[0], y: args[0], z: args[0]};
    }
  },

  _formatDuration: function() {
    return this._duration + 's, ' + this._duration + 's';
  }
};
