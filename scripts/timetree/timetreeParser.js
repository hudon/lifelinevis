/*jslint nomen: true, browser: true, devel: true*/
/*global $,_,d3*/
'use strict';

// Prepares the lifeline data to be displayed as a tree
define([
    'jquery',
    'underscore'
], function ($, _) {
    var Node;

    // Every bucket is a group of nodes that we will be aligning vertically
    // because their timings are similar
    Node = _.makeClass();
    Node.prototype.init = function (pname, pid, tid, vistime,
            time, tagname, children) {
        children = children || [];
        this.pid = pid;
        this.pname = pname;
        this.tid = tid;
        this.time = time;
        // Vis time is the time used for visualization (scaled or translated
        // real time)
        this.vistime = vistime;
        // for visualization of different tags in the tree
        this.tagname = tagname;
        this.children = children;
        this.bucketLevel = 0;

        // This is the weight of the edge from this node to the parent. A
        // weight of X means that there were X identical edges found while
        // building the tree.
        this.numConnections = 1;
    };
    Node.prototype.addChild = function (childNode, grandchildren) {
        this.children.push(childNode);
    };

    // finding a parent - check all nodes on the level
    function findParent(node, bucket) {
        return _.find(bucket, function (bNode) {
            return node.pid === bNode.pid && node.tid === bNode.tid
                && node.tagname === bNode.tagname;
        });
    }

    function findNode(node, container, nodeLevel) {
        return _.find(container, function (cNode) {
            return node.pid === cNode.pid && node.tid === cNode.tid &&
                node.tagname === cNode.tagname && nodeLevel === cNode.bucketLevel;
        });
    }

    function addToBucket(buckets, level, node) {
        buckets[level] = buckets[level] || [];
        buckets[level].push(node);
    }

    function parseLifelineData(lifeline, resolution, mode, start, end) {
        var minTime, treeLifeline, buckets, dummyNode, startTime, endTime;

        treeLifeline = [];
        buckets = [];

        lifeline = _.sortBy(lifeline, function (node) {
            return node.time;
        });

        minTime = _.min(lifeline, function (node) {
            return node.time;
        }).time;

        // Save original time and copy a scaled version of it so that we
        // can deal with smaller numbers.
        _.each(lifeline, function (node) {
            node.vistime = node.time / minTime;
        });

        if ((typeof start !== 'undefined') && (typeof end !== 'undefined')) {
            startTime = parseInt(start);
            endTime = parseInt(end);

            if (startTime >= 0 && endTime >= startTime) {
                lifeline = _.filter(lifeline, function (node) {
                    return startTime < node.time && node.time < endTime;
                });
            } else {
                // TODO error
            }
        }

        _.each(lifeline, function (node) {
            var existingChildren, existingNode, existingParent, childNode,
                parentNode, childLevel, parentLevel, tree, bucket;

            childNode = new Node(node.dstProcessName, node.dstProcessId, node.dstThreadId,
                    node.vistime, node.time, node.tagName);

            // Technically, the 'vistime' and the 'time' here would be wrong
            // since they are at the parent. However, this node will only
            // be used if we are not able to find an existing node in the
            // tree to act as parent. Child nodes have the correct time on them (the time
            // at which a tag was received)
            parentNode = new Node(node.srcProcessName, node.srcProcessId, node.srcThreadId,
                    undefined, undefined, node.tagName);

            // Decide which bucket the child should be in based off of how
            // many time periods (buckets) fit before it.
            parentLevel = childLevel = Math.round(node.vistime * resolution);

            // find parent process: look through each level down to roots
            while (parentLevel > 0) {
                // Levels represent tree depth (based off time)
                parentLevel -= 1;
                // select bucket and ensure one exists
                bucket = buckets[parentLevel] || [];
                // there might exist a prent already
                existingParent = findParent(parentNode, bucket);
                if (typeof existingParent !== 'undefined') {
                    parentNode = existingParent;
                    break;
                }
            }

            // If we're not using the existing parent, there is additional
            // setup to do for the new parent
            if (typeof existingParent === 'undefined') {
                parentNode.bucketLevel = childLevel - 1;
                addToBucket(buckets, parentNode.bucketLevel, parentNode);
                treeLifeline.push(parentNode);
            }

            if (mode) {
                existingChildren = parentNode.children;
                existingNode = findNode(childNode, existingChildren, childLevel);

                // If we find a node, this means we have found a duplication
                // parent-child relationship, so we'll just increment the
                // weight of the edge
                if (typeof existingNode !== 'undefined') {
                    existingNode.numConnections += 1;
                } else {
                    parentNode.addChild(childNode);
                    childNode.bucketLevel = childLevel;
                    addToBucket(buckets, childLevel, childNode);
                }
            } else {
                parentNode.addChild(childNode);
                childNode.bucketLevel = childLevel;
                addToBucket(buckets, childLevel, childNode);
            }
        });

        dummyNode = new Node();
        _.each(treeLifeline, function (tree) {
            dummyNode.addChild(tree, tree.children);
        });

        return dummyNode;
    }

    return { parse: parseLifelineData };
});

