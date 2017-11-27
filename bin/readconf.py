import re

class ConfDict:
  def __init__(this, initdict):
    this.dict = initdict
  def __getattr__(self, name):
    if name in self.dict:
      return self.dict[name]
    else:
      raise AttributeError("'%s' object has no attribute '%s'" % (self.__class__.__name__, name))

def read(filename):
  fp = open(filename, 'r')
  results = {}
  match_result = None
  def try_match(regexp, line):
    match_result = re.match(regexp, line)
    return match_result
  while True:
    line = fp.readline()
    if not line:
      break
    line = re.sub("\n$", "", line)
    if not line:
      continue
    line = re.sub("#[\w\W]*$", "", line)
    spos = re.search("[\:\=]", line)
    if spos is None:
      name = line
      value = None
    else:
      spos = spos.start(0)
      name = line[0:spos].strip()
      value = line[spos+1:].strip()
      converted = False
      m = re.match("^\"([^\"]*)\"$", value)
      if not converted and m:
        converted = True
        value = m.group(1)
      m = re.match("^\'([^\']*)\'$", value)
      if not converted and m:
        converted = True
        value = m.group(1)
      m = re.match("^([\+\-]?\d*(\.\d*))$", value)
      if not converted and m:
        converted = True
        value = m.group(1)
        if m.group(2) is None:
          value = int(value)
        else:
          value = float(value)
      if not converted and value == "true":
        converted = True
        value = True
      if not converted and value == "false":
        converted = True
        value = False
      if not converted and value == "null":
        converted = True
        value = None
      if not converted:
        value = None
    results[name] = value
  return ConfDict(results)

def read_default():
  import os
  currdir = os.path.split(os.path.realpath(__file__))[0]
  path = os.path.join(currdir, 'config.conf')
  return read(path)
