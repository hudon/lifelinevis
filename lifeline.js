(function () {
    'use strict';
    /*jslint browser: true*/
    
    // Vertex: a process thread; Edge: the event of sending/recieving a tag
    function Vertex(pid, tid, time) {
        this.pid = pid;
        this.tid = tid;
        this.time = time;
    }
    
    function Node(vertex, children) {
        this.vertex = vertex;
        this.children = children;
        
        this.addChild = addChild;
        function addChild(childVertex) {
            var childNode = new Node(childVertex, []);
            this.children.push(childNode);
        }
    }
    
    function BucketNode(vertex, treeNum) {
        this.vertex = vertex;
        this.treeNum = treeNum;
    }

    var lifeline = [], util = {};

    window.addEventListener('load', windowLoadHandler, false);

    function loadLifeline() {
        util.ajaxget('/lifeline.json', function (response) {
            lifeline = JSON.parse(response);
        }, false);
    }
    
    var treeLifeline = [];  // tree-like representation of the lifeline
    var buckets = [];       // nodes per level
    var timePeriod = 1;
    
    function parseLifelineData() {
        for (var i=0; i<lifeline.length; i++) {
        
            var node = lifeline[i];
            var vert = new Vertex(node.dstProcessId, node.dstThreadId, node.time);
            var parent = new Vertex(node.srcProcessId, node.srcThreadId, node.time);
            var p_bucket_node;
            
            var level = Math.floor(node.time/timePeriod);                           // actual tree level based on time
            // find parent process: look through each level down to roots
            while (level >= 0) {
                var bucket = buckets[level] ? buckets[level] : []; 
                p_bucket_node = findParent(level, parent, bucket);
                if (p_bucket_node.treeNum) break;
                level -= 1;
            }
            
            // have a parent, go to parent in identified tree and add the child -- update parent in bucket
            if (p_bucket_node.treeNum) {
                var tree = treeLifeline[p_bucket_node.treeNum];                 // a root Node 
                addTreeChild(tree, 0, level, p_bucket_node.vertex, vert);       
                addToBucket(level+1, vert, tree_loc);                           // add child to the right bucket
            
            // do not have a parent in our current trees, create a new root == level 0
            } else {
                var rootNode = new Node(parent, []);
                rootNode.addChild(vert);
                treeLifeline.push(rootNode);
                addToBucket(0, parent, treeLifeline.length-1);
                addToBucket(1, vert, treeLifeline.length-1);
            }
        }
    }
    // return tree, time
    // finding a parent - check all vertices on the level
    function findParent(level, vertex, bucket) {
        for (var i=0; i<bucket.length; i++) {
            var bNode = bucket[i];
            if (vertex.pid == bNode.vertex.pid && vertex.tid == bNode.vertex.tid) {
                return bNode;
            }
        }
        return -1;
    }
    
    function addTreeChild(tree, curLevel, goalLevel, parentVertex, childVertex) {
        if (curLevel == goalLevel) {
            var vertex = tree.vertex;
            if (vertex.pid == parentVertex.pid && vertex.tid == parentVertex.tid && vertex.time == parentVertex.time) {
                tree.addChild(childVertex);
                return;
            }
        } else {
            var children = tree.children;
            for (var i=0; i<children.length; i++) {
                addTreeChild(children[i], curLevel+1, goalLevel, parentVertex, childVertex);
            }
        }
    }
    
    function addToBucket(level, vertex, treeNum) {
        var bucket = buckets[level] ? buckets[level] : [];
        if (bucket.length > 0) {
            for (var i=0; i<bucket.length; i++) {
                var bNode = bucket[i];
                if (vertex.pid == bNode.vertex.pid && vertex.tid == bNode.vertex.tid) { // check if similar node is already in the bucket
                    bNode.treeNum = treeNum;
                    return;
                }
            }
        } else {
           buckets[level] = [];
        }
        var bNode = new BucketNode(vertex, treeNum);
        buckets[level].push(bNode);
    }

    function redrawLifelineUI() {
        var node, container, i,
            div = document.getElementById('lifeline');
        /*for (i = 0; i < lifeline.length; i += 1) {

            node = lifeline[i];

            // create node UI
            container = document.createElement('p');
            container.appendChild(document.createTextNode(JSON.stringify(node)));

            div.appendChild(container);

        }*/
    }

    function windowLoadHandler() {
        loadLifeline();
        parseLifelineData();
        //redrawLifelineUI();
    }

    window.addEventListener('load', windowLoadHandler, false);

    /* Utilities */

    util.ajaxget = function (url, callback, async) {
        var r = util.getAjaxRequest(callback);
        r.open("GET", url, async);
        r.send(null);
    };

    util.getAjaxRequest = function (callback) {
        var ajaxRequest;

        try {
            ajaxRequest = new XMLHttpRequest();
        } catch (e) {
            /*global ActiveXObject*/
            try {
                ajaxRequest = new ActiveXObject("Msxml2.XMLHTTP");
            } catch (e2) {
                try {
                    ajaxRequest = new ActiveXObject("Microsoft.XMLHTTP");
                } catch (e3) {
                    return null;
                }
            }
        }

        ajaxRequest.onreadystatechange = function () {
            if (ajaxRequest.readyState === 4) {
                // TODO error response checking
                callback(ajaxRequest.responseText);
            }
        };

        return ajaxRequest;
    };

}());

