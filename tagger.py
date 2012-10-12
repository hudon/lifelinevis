import subprocess

def assigntag():
    # do assign tag
    print("assigning tag!")

def showtag():
    #TODO call showtag, parse input, return json string
    print ("Here is a lifeline:")
    return '{"myjson":2, "yourjson":3}'

def printJSON(lifeline):
    f = open('./tagger.json', 'w')
    f.write(lifeline+ '\n')
    print("Here is JSON")

if __name__ == "__main__":
    assigntag()
    lifeline = showtag()
    printJSON(lifeline)

