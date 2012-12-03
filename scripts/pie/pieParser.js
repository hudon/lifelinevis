/*jslint nomen: true, browser: true*/
/*global define*/
define([
    'underscore'
], function (_) {
    'use strict';

    function parseLifeline(lifeline, mode, interactions) {
        var processStats;   // list of process objects
        var data;           // list of process arrays [pname, numInteractions]
        var Process;

        Process = _.makeClass();
        Process.prototype.init = function (pname, pid, tid, received,
            sent) {

            this.pname = pname;
            this.pid = pid;
            this.tid = tid;
            this.received = received;
            this.sent = sent;
        };

        // Finds a process object with the given pid and tid attributes in the
        // data (list of process objects)
        function getProcessObj(pid, tid, data) {
            for (var i = 0; i < data.length; i++) {
                var process = data[i];

                if (process.pid == pid && process.tid == tid) {
                    return process;
                }
            }
            return null;
        }

        // Finds a process array ([process name, number of interactions])
        // with the given name in the data (list of process arrays)
        function getProcess(name, data) {
            for (var i = 0; i < data.length; i++) {
                var process = data[i];

                if (process[0] == name) {
                    return process;
                }
            }
            return null;
        }

        processStats = [];

        // First, calculate the sent and received interactions for each thread
        // Assumption: can later store this in the model to prevent recalculating
        _.each(lifeline, function (lifeEvent) {
            var pid, tid, process, pname, data;

            // process that sent a message
            pid = lifeEvent.srcProcessId;
            tid = lifeEvent.srcThreadId;
            process = getProcessObj(pid, tid, processStats);

            if (process === null) {
                pname = lifeEvent.srcProcessName;
                process = new Process(pname, pid, tid, 0, 1);
                processStats.push(process);
            } else {
                process.sent += 1;
            }

            // process that received a message
            pid = lifeEvent.dstProcessId;
            tid = lifeEvent.dstThreadId;
            process = getProcessObj(pid, tid, processStats);

            if (process === null) {
                pname = lifeEvent.dstProcessName;
                process = new Process(pname, pid, tid, 1, 0);
                processStats.push(process);
            } else {
                process.received += 1;
            }
        });

        data = [];
        var dindex = 0;

        // Transform the per thread interactions, calculated above, into a format
        // that is understood by Highcharts; use settings of the controls for
        // formatting process data for the chart
        _.each(processStats, function (process) {
            var p;

            if (mode) {
                p = getProcess(process.pname, data);

                if (p === null) {
                    // initiallize process interactions number to 0
                    p = [process.pname, 0];
                    data[dindex] = p;
                    dindex += 1;
                }
            } else {
                p = getProcess(process.pname, data);

                if (p === null) {
                    var name = process.pname + ' tid:' + process.tid;
                    // initiallize process interactions number to 0
                    p = [name, 0];
                    data[dindex] = p;
                    dindex += 1;
                }
            }

            // increment process interactions by amount set in the graph controls
            if (interactions === 'sent') {
                p[1] += process.sent;
            } else if (interactions === 'received') {
                p[1] += process.received;
            } else {
                p[1] += process.sent + process.received;
            }
        });
        return data;
    }
    return { parse: parseLifeline };
});

