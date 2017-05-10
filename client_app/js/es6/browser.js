(() => {

    const { emitter } = require("./emitter.js");

    const { example } = require('./bob.js');

    emitter.emit('fdg:graph:loaded', example);

})();