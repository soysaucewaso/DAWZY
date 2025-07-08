from flask import Flask, request
import os

app = Flask(__name__)
message = ""

@app.route('/message', methods=['GET', 'POST'])
def handle_message():
    global message
    if request.method == 'POST':
        message = request.data.decode('utf-8')
        return 'OK'
    return message

@app.route('/command')
def get_command():
    if os.path.exists("command.txt"):
        with open("command.txt") as f:
            return f.read()
    return ""

if __name__ == '__main__':
    app.run(port=5005) 