/*jslint nomen: true, browser: true*/
/*global define*/
define([
    'jquery',
    'underscore'
], function ($, _) {
    'use strict';

    function parseLifeline(lifeline, mode, interactions) {
        var processStats, data, Process;

        Process = _.makeClass();
        Process.prototype.init = function (pname, pid, tid, received,
            sent) {

            this.pname = pname;
            this.pid = pid;
            this.tid = tid;
            this.received = received;
            this.sent = sent;
        };

        function getProcessObj(pid, tid, data) {
            for (var i = 0; i < data.length; i++) {
                var process = data[i];

                if (process.pid == pid && process.tid == tid) {
                    return process;
                }
            }
            return null;
        }

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

        // First, we calculate all the multiple interactions
        // Assumption: can later store this to prevent recalculating
        _.each(lifeline, function (lifeEvent) {
            var pid, tid, process, pname, data;

            pid = lifeEvent.srcProcessId;
            tid = lifeEvent.srcThreadId;
            process = getProcessObj(pid, tid, processStats);

            if (process == null) {
                pname = lifeEvent.srcProcessName;
                process = new Process(pname, pid, tid, 0, 1);
                processStats.push(process);
            } else {
                process.sent += 1;
            }

            pid = lifeEvent.dstProcessId;
            tid = lifeEvent.dstThreadId;
            process = getProcessObj(pid, tid, processStats);

            if (process == null) {
                pname = lifeEvent.dstProcessName;
                process = new Process(pname, pid, tid, 1, 0);
                processStats.push(process);
            } else {
                process.received += 1;
            }
        });

        data = [];
        var dindex = 0;

        // getting data into correct format based on set modes
        _.each(processStats, function (process) {
            var p;

            if (mode) {
                p = getProcess(process.pname, data);

                if (p == null) {
                    p = [process.pname, 0];
                    data[dindex] = [];
                    data[dindex] = p;
                    dindex += 1;
                }
            } else {
                p = getProcess(process.pname, data);

                if (p == null) {
                    var name = process.pname + ' tid:' + process.tid;
                    p = [name, 0];
                    data[dindex] = [];
                    data[dindex] = p;
                    dindex += 1;
                }
            }

            if (interactions == 'sent') {
                p[1] += process.sent;
            } else if (interactions == 'received') {
                p[1] += process.received;
            } else {
                p[1] += process.sent + process.received;
            }
        });
        return data;
    }
    return { parse: parseLifeline };
});

