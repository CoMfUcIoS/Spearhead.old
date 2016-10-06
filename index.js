import _ from 'lodash';
import { spawn } from 'child_process';

const modules = {
  cerberus : spawn('babel-node', ['cerberus/index.js']),
  medusa   : spawn('babel-node', ['medusa/index.js'])
};

_.forOwn(modules, function(module, name) {
  module.stdout.on('data', (data) => {
    console.log(`${name} -> ${data}`);
  });

  module.stderr.on('data', (data) => {
    console.log(`${name} -> ERROR: ${data}`);
  });

  module.on('close', (code) => {
    console.log(`${name} -> FATAL ERROR: child process ${name} exited with code ${code}`);
  });
});
