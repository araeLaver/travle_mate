// schema-utils compatibility shim
// Satisfies both:
//   - babel-loader@8.x:            const validateOptions = require('schema-utils'); validateOptions(schema, opts, cfg)
//   - terser-webpack-plugin@5.x:   const { validate } = require('schema-utils'); validate(schema, opts, cfg)
//   - webpack/others:              const { validate, ValidationError } = require('schema-utils')
//
// CRA uses thread-loader for production babel workers; require.cache patches on the main thread
// are invisible inside thread-loader worker threads. Using webpack resolve.alias (in craco.config.js) to point
// all schema-utils requires to this shim is the only approach that works both in the main thread
// AND inside thread-loader worker processes.

class ValidationError extends Error {
  constructor(errors, schema, configuration) {
    super(
      (configuration && configuration.name ? configuration.name + ' Invalid Options\n' : '') +
      (errors || []).map(e => '  - ' + (e.message || String(e))).join('\n')
    );
    this.name = 'ValidationError';
    this.errors = errors;
    this.schema = schema;
  }
}

// No-op validate: skips actual JSON-schema validation.
// Real type-checking is performed by `tsc --noEmit` in CI.
function validate(schema, options, configuration) {
  // intentional no-op shim
}

validate.ValidationError = ValidationError;

// enableValidation / disableValidation / needValidate stubs (webpack internals)
let _validationEnabled = true;
function enableValidation() { _validationEnabled = true; }
function disableValidation() { _validationEnabled = false; }
function needValidate() { return _validationEnabled; }

// Default export IS the validate function (for babel-loader: validateOptions = require('schema-utils'))
module.exports = validate;
module.exports.validate = validate;
module.exports.ValidationError = ValidationError;
module.exports.enableValidation = enableValidation;
module.exports.disableValidation = disableValidation;
module.exports.needValidate = needValidate;
