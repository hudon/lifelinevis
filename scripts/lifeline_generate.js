var procs = [ '20489', '565287', '129965', '345589' ];
var procNames = [ 'pipe', 'firefox-bin', 'io-pkt-v4-hc', 'chrome' ];
var threads = [ '0', '1', '2', '3', '4' ];
var tags = [ '1', '2', '3', '4', '5' ];
var time = 100;

var lifeline = [];

for (var i = 0; i < 200; i++) {
    var randomnum, time, sourceIndex, targetIndex, tagindex,
        sthreadIndex, tthreadIndex, link;

    randomnum = Math.floor(Math.random() * 10);
    if (Math.random() > 0.5) {
        time += randomnum * 2;
    }

    sourceIndex = Math.floor(Math.random() * procs.length);
    targetIndex = Math.floor(Math.random() * procs.length);

    sthreadIndex = Math.floor(Math.random() * 2);
    tthreadIndex = Math.floor(Math.random() * 2);

    tagindex = Math.floor(Math.random() * 2);

    link = {
                "tagName": tags[tagindex],
                "srcProcessName": procNames[sourceIndex],
                "srcProcessId": procs[sourceIndex],
                "srcThreadId": threads[sthreadIndex],
                "dstProcessName": procNames[targetIndex],
                "dstProcessId": procs[targetIndex],
                "dstThreadId": threads[tthreadIndex],
                "time": time
            };
    lifeline.push(link);
}

var life = JSON.stringify(lifeline);
