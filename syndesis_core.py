from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/process', methods=['POST'])
def process():
    data = request.get_json()
    message = data.get("message", "")
    return jsonify({"reply": f"Έλαβα το μήνυμα: {message}"})

if __name__ == '__main__':
    app.run()
