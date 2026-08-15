"use strict";

const ERROR_CODE = "ERR_VWYS_IMAGE_SIZE_DISABLED";
const ERROR_MESSAGE =
  "The unused image-size parser is disabled. Use the validated Sharp media pipeline instead.";

function disabledImageSize() {
  const error = new Error(ERROR_MESSAGE);
  error.code = ERROR_CODE;
  throw error;
}

function disableTypes() {
  return undefined;
}

const types = Object.freeze([]);

module.exports = disabledImageSize;
module.exports.default = disabledImageSize;
module.exports.imageSize = disabledImageSize;
module.exports.disableTypes = disableTypes;
module.exports.types = types;
module.exports.ERROR_CODE = ERROR_CODE;
