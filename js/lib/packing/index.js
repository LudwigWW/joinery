
import XorShift from './math/xorshift.js'
import Vector from './math/vector.js'
import Part from './part.js'
import Bin from './bin.js'
import Packer from './packer.js'

// export {
//   XorShift,
//   Vector,
//   Part,
//   Bin,
//   Packer
// }

// Create a namespace
const Fit = {
  Packer,
  Part,
  Bin,
  Vector,
  XorShift
};

export default Fit;

// // Create a namespace on the window object
// window.Fit = window.Fit || {};

// window.Fit.Packer = Packer;
// window.Fit.Part = Part;
// window.Fit.Bin = Bin;
// window.Fit.Vector = Vector;
// window.Fit.XorShift = XorShift;
