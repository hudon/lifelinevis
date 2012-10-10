var node = {}
//var lifeline = [new Node(0,1,1,1,10), new Node(2,0,1,1,12)]

function Node(pid, tid, pidSource, tidSource, time) {
  if (!(this instanceof Node)) {
    return new Node();
  }

  this.srcProcessId = pidSource;
  this.srcThreadId = tidSource;
  this.processId = pid;
  this.threadId = tid;
  this.time = time;
}
