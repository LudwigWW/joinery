function randomInt(start, end, hashN) {
    const range = Math.abs(end-start);
    hashN.nn += 1;
    return Math.floor(start + mb(hashN.hn+hashN.nn)() * range);
}

function randomZeroToOne(hashN) {
    hashN.nn += 1;
    return mb(hashN.hn+hashN.nn)();
}

function mb(a) { // mulberry32
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}