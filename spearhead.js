// We dont use this file at all

// import pm2       from 'pm2';
// import chimera   from './chimera/index.js';

// const { util }  = chimera.initialize();
// pm2.connect(function(err) {
//   if (err) {
//     util.error(err);
//     process.exit(2);
//   }

//   pm2.start([{
//     name        : 'cerberus',
//     script      : 'cerberus/index.js',
//     watch       : true,
//     interpreter : 'babel-node'
//   }, {
//     name        : 'medusa',
//     script      : 'medusa/index.js',
//     watch       : true,
//     interpreter : 'babel-node'
//   }], function(error, apps) {
//     pm2.disconnect();   // Disconnect from PM2
//     if (error) {
//       throw error;
//     }
//   });
// });


// Old implementation
// import _         from 'lodash';
// import { spawn } from 'child_process';
// import chimera   from './chimera/index.js';

// const { util }  = chimera.initialize(),
//     modules = {
//       cerberus : spawn('babel-node', ['cerberus/index.js']),
//       medusa   : spawn('babel-node', ['medusa/index.js'])
//     };

// _.forOwn(modules, function(module, name) {
//   module.stdout.on('data', (data) => {
//     util.log(`${name} -> ${data}`);
//   });

//   module.stderr.on('data', (data) => {
//     util.log(`${name} -> ERROR: ${data}`);
//   });

//   module.on('close', (code) => {
//     util.log(`${name} -> FATAL ERROR: child process ${name} exited with code ${code}`);
//   });
// });

