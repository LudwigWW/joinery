const { cube, cylinder, sphere } = require('@jscad/modeling').primitives

const options = {
    height: 5.1,
    radius: 3.7
}

const main = () => {
  return cylinder({radius: options.radius, height: options.height, segments: 6})
}


module.exports = { main }