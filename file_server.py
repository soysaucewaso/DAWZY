from flask import Flask
import os

app = Flask(__name__)

@app.route('/command')
def get_command():
    if os.path.exists("command.txt"):
        with open("command.txt") as f:
            return f.read()
    return ""

if __name__ == "__main__":
    app.run(port=5006) 