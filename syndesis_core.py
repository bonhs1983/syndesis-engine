from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/process', methods=['POST'])
def process():
    if not request.is_json:
        return jsonify({"error": "Invalid content-type, must be application/json"}), 400

    try:
        data = request.get_json(force=True)
    except Exception as e:
        return jsonify({"error": f"JSON parsing error: {str(e)}"}), 400

    message = data.get("message", "")
    return jsonify({"reply": f"Έλαβα το μήνυμα: {message}"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)
