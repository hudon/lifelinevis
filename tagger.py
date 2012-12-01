import subprocess
import time
import getopt
import sys
import string

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
        time.sleep(12)
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

def get_proc_name(pid):
    ps = subprocess.Popen(["ps","-p", pid, "-o", "comm"], stdout=subprocess.PIPE)
    ps.wait()
    line_num = 0
    for line in ps.stdout:
        line_num += 1
        tokens = line.split()
        if line_num > 1:
            path = tokens[0]
            executable = path.split("/")[-1]
            return executable
    return ""

def to_json(showtag_output):
    i = -1
    res = []
    jsons = []
    for line in showtag_output.readlines():
        i += 1
        if i == 0:
            continue
        elif i % 2 != 0:
            continue
        words = line.split()

        r = []
        r.append('"tagName":"' + words[0] + '"')

        r.append('"srcProcessName":"' + get_proc_name(words[1]) + '"')
        r.append('"srcProcessId":"' + words[1] + '"')
        r.append('"srcThreadId":"' + words[2] + '"')

        r.append('"dstProcessName":"' + get_proc_name(words[3]) + '"')
        r.append('"dstProcessId":"' + words[3] + '"')
        r.append('"dstThreadId":"' + words[4] + '"')

        r.append('"time":' + words[5])

        res.append("{" + string.join(r, ",") + "}")
    return "[" + string.join(res, ",\n") + "]"

def showtag():
    result = ""
    try:
        # NOTE: This uses a slightly modified showtag scripts, that prints
        # nicer output. Modify to_json according to your showtags.c output
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

def usage():
    print 'python tagger.py [-n]'
    print '  -n    use this option to start firefox and assign tags to it.'
    print '        Without the option, no process will be started and'
    print '        tags will not be assigned (but a new lifeline will'
    print '        still be printed to tagger.json'
    sys.exit(2)

if __name__ == "__main__":
    try:
        opts, args = getopt.getopt(sys.argv[1:], "n")
    except getopt.GetoptError:
        usage()
    newprocess = ''
    for opt, arg in opts:
        if opt == "-n":
            newprocess = 'firefox'
        elif opt == '-h':
            usage()
    if newprocess:
        assigntag(newprocess)
    lifeline = showtag()
    printJSON(lifeline)

