import socketio from 'socket.io';
import os from 'os';

export default class Sockets {
  constructor(server, path) {
    const io = socketio(server);
    this.messages(path, io);
  }

  messages(path, io) {
    io
      .of(path)
      .on('connection', (socket) => {

        socket.on('getMem', () => {
          const  mem = this.getMemory();
          socket.emit('gotMem', { memoryUsagePercentage : mem });
        });

        socket.on('getCpu', () => {
          const startMeasure = this.cpuAverage();
          setTimeout(() => {
            const endMeasure = this.cpuAverage(),
                idleDifference = endMeasure.idle - startMeasure.idle,
                totalDifference = endMeasure.total - startMeasure.total,
                percentageCPU = 100 - ~~(100 * idleDifference / totalDifference);
            socket.emit('gotCpu', { cpuUsagePercentage : percentageCPU });
          }, 100);
        });

      });
  }

  getMemory() {
    const free = os.freemem(),
        total = os.totalmem(),
        used = total - free,
        percentage = used / total * 100;

    return Math.round(percentage * 10) / 10;
  }

  cpuAverage() {
    const cpus = os.cpus(),
        len = cpus.length;
    let totalIdle = 0,
        totalTick = 0,
        i = 0,
        type;

    for (i; i < len; i++) {
      const cpu = cpus[i];
      for (type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    }
    return {
      idle  : totalIdle / len,
      total : totalTick / len
    };
  }

}
