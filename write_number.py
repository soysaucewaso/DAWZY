import time

filename = "command.txt"
counter = 1

while True:
    with open(filename, "w") as f:
        f.write(str(counter))
    print(f"Wrote {counter} to {filename}")
    counter += 1
    time.sleep(5) 