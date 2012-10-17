import subprocess
import time
import getopt
import sys

def get_process_thread_ids(ps):
    threadids = []
    pids = []
    for line in ps.readlines():
        tokens = line.split()
        threadids.append(tokens[0])
        if tokens[1] not in pids:
            pids.append(tokens[1])
    return threadids, pids

def assigntag(process_name):
    try:
        if not process_name:
            process_name = "firefox"
        firefox = subprocess.Popen(process_name)
        firefox.wait()
        time.sleep(5)
        ps = subprocess.Popen(["ps","-elf", "-o tid,pid,comm"], stdout=subprocess.PIPE)
        grep = subprocess.Popen(["grep", process_name], stdin=ps.stdout,
                stdout=subprocess.PIPE)
        ps.stdout.close()
        grep.wait()
        threadids, pids = get_process_thread_ids(grep.stdout)
        for threadid in threadids:
            assigntag = subprocess.Popen(["./assigntag", "-t2", "-p" + pids[0],
                "-r" + threadid])
            assigntag.wait()
        print("TAGGER: assigntag complete")
    except OSError:
        print("Error: failed to assign tag")

def to_json(showtag_output):
    i = -1
    result = "[\n"
    for line in showtag_output.readlines():
        i += 1
        if i == 0:
            continue
        elif i % 2 != 0:
            continue
        words = line.split()
        json = {"tagName": words[0], "srcProcessId": words[1], "srcThreadId":
                words[2], "dstProcessId": words[3], "dstThreadId":
                words[4], "time": long(words[5]) }
        result += str(json) + '\n'
    result += "]"
    return result

def showtag():
    result = ""
    try:
        showtag = subprocess.Popen(["./showtag", "-s2"], stdout=subprocess.PIPE)
        showtag.wait()
        showtag_output = showtag.stdout
        result = to_json(showtag_output)
        print("TAGGER: showtag complete")
    except OSError:
        result =  '{"myjson":2, "hisjson":4, "yourjson":3}'
    return result

def printJSON(lifeline):
    f = open('./tagger.json', 'w')
    f.write(lifeline+ '\n')
    print ("TAGGER: json saved to file (tagger.json)")

if __name__ == "__main__":
    try:
        opts, args = getopt.getopt(sys.argv, "n")
    except getopt.GetoptError:
        print 'python tagger.py [-n]'
        sys.exit(2)
    newprocess = ''
    for opt, arg in opts:
        if opt == '-n':
            newprocess = 'firefox'
    if newprocess:
        assigntag(newprocess)
    lifeline = showtag()
    printJSON(lifeline)

