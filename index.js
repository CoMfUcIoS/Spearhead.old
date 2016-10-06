import _         from 'lodash';
import { spawn } from 'child_process';
import chimera   from './chimera/index.js';

const { util }  = chimera.initialize(),
    modules = {
      cerberus : spawn('babel-node', ['cerberus/index.js']),
      medusa   : spawn('babel-node', ['medusa/index.js'])
    };

_.forOwn(modules, function(module, name) {
  module.stdout.on('data', (data) => {
    util.log(`${name} -> ${data}`);
  });

  module.stderr.on('data', (data) => {
    util.log(`${name} -> ERROR: ${data}`);
  });

  module.on('close', (code) => {
    util.log(`${name} -> FATAL ERROR: child process ${name} exited with code ${code}`);
  });
});
