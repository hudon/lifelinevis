import subprocess
import time

def to_thread_id(ps):
    threadids = []
    for line in ps.readlines():
        tokens = line.split()
        threadids.append(tokens[0])
    return threadids

def assigntag():
    try:
        firefox = subprocess.Popen("firefox")
        firefox.wait()
        time.sleep(5)
        ps = subprocess.Popen(["ps","-elf", "-o tid,pid,comm"], stdout=subprocess.PIPE)
        grep = subprocess.Popen(["grep", "firefox"], stdin=ps.stdout,
                stdout=subprocess.PIPE)
        ps.stdout.close()
        grep.wait()
        threadids = to_thread_id(grep.stdout)
        for threadid in threadids:
            assigntag = subprocess.Popen(["./assigntag", "-t2", "-p499749",
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
    assigntag()
    lifeline = showtag()
    printJSON(lifeline)

