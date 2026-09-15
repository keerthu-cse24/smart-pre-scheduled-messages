from flask import Flask,render_template,request,jsonify
import mysql.connector
import os
import requests
from dotenv import load_dotenv
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
ENV_FILE = BASE_DIR / ".env"

print("ENV FILE:", ENV_FILE)
print("ENV EXISTS:", ENV_FILE.exists())

load_dotenv(ENV_FILE, override=True)
WHATSAPP_ACCESS_TOKEN=os.getenv("WHATSAPP_ACCESS_TOKEN")
WHATSAPP_PHONE_NUMBER_ID=os.getenv("WHATSAPP_PHONE_NUMBER_ID")
WHATSAPP_RECIPIENT_NUMBER=os.getenv("WHATSAPP_RECIPIENT_NUMBER")
print("Token loaded:",bool(WHATSAPP_ACCESS_TOKEN))
print("Phone ID loaded:",bool(WHATSAPP_PHONE_NUMBER_ID))
print("Phone ID length:",len(WHATSAPP_PHONE_NUMBER_ID)if WHATSAPP_PHONE_NUMBER_ID else 0)
WHATSAPP_API_URL="https://graph.facebook.com/v25.0/"+WHATSAPP_PHONE_NUMBER_ID+"/messages"
print("API URL:",WHATSAPP_API_URL)
from apscheduler.schedulers.background import BackgroundScheduler
app = Flask(__name__)
scheduler = BackgroundScheduler()
def send_whatsapp_message(to, message):
    headers = {
        "Authorization": f"Bearer {WHATSAPP_ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }

    data = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "template",
        "template": {
            "name": "scheduled_message",
            "language": {
                "code": "en_US"
            }
        }
    }

    response = requests.post(
        WHATSAPP_API_URL,
        headers=headers,
        json=data
    )

    print("Sending WhatsApp template...")
    print("STATUS CODE:", response.status_code)
    print("WhatsApp API Response:", response.json())
def check_scheduled_messages():
    print("Scheduler checking...")
    db = mysql.connector.connect(
        host="localhost",
        user="root",
        password="manikeerthu@11",
        database="whatsapp_timer"
    )

    cursor = db.cursor()

    cursor.execute("""
        SELECT id, msg, scheduled_time
        FROM messages
        WHERE status = 'Scheduled'
        AND scheduled_time <= NOW()
    """)

    messages = cursor.fetchall()
    print("Messages found:",messages)

    for message in messages:
        print("Scheduled message ready:", message[1])
        send_whatsapp_message(WHATSAPP_RECIPIENT_NUMBER,message[1])

        cursor.execute(
            "UPDATE messages SET status = 'Processed' WHERE id = %s",
            (message[0],)
        )

    db.commit()
    cursor.close()
    db.close()


scheduler.add_job(
    check_scheduled_messages,
    "interval",
    seconds=10
)
scheduler.start()
@app.route("/")
def home():
    return render_template("index.html")
@app.route("/history")
def history():
    db = mysql.connector.connect(
        host="localhost",
        user="root",
        password="manikeerthu@11",
        database="whatsapp_timer"
    )

    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT id, contact_name, phone_number, msg, scheduled_time, status
        FROM messages
        ORDER BY scheduled_time DESC
    """)

    messages = cursor.fetchall()

    cursor.close()
    db.close()

    return jsonify(messages)
@app.route("/delete_message/<int:message_id>", methods=["DELETE"])
def delete_message(message_id):
    db = mysql.connector.connect(
        host="localhost",
        user="root",
        password="manikeerthu@11",
        database="whatsapp_timer"
    )

    cursor = db.cursor()

    cursor.execute(
        "DELETE FROM messages WHERE id = %s",
        (message_id,)
    )

    db.commit()

    cursor.close()
    db.close()

    return jsonify({
        "success": True,
        "message": "Message deleted successfully!"
    })
@app.route("/schedule", methods=["POST"])
def schedule():
    contact_name = request.form.get("contact_name")
    phone_number = request.form.get("phone_number")
    message = request.form.get("message")
    print("MESSAGE RECEIVED:",message)
    date = request.form.get("date")
    time = request.form.get("time")

    photo = request.files.get("photo")
    video = request.files.get("video")

    scheduled_time = f"{date} {time}"

    photo_path = None
    video_path = None

    if photo and photo.filename:
        photo_path = "uploads/" + photo.filename
        photo.save(photo_path)

    if video and video.filename:
        video_path = "uploads/" + video.filename
        video.save(video_path)

    db = mysql.connector.connect(
        host="localhost",
        user="root",
        password="manikeerthu@11",
        database="whatsapp_timer"
    )

    cursor = db.cursor()

    sql = """
    INSERT INTO messages
    (contact_name, phone_number, msg, scheduled_time, status, photo_path, video_path)
    VALUES (%s, %s, %s, %s, %s, %s, %s)
    """

    cursor.execute(
        sql,
        (contact_name, phone_number, message, scheduled_time, "Scheduled", photo_path, video_path)
    )
    print("SAVED:",message,scheduled_time)   
        

    db.commit()

    cursor.close()
    db.close()

    return jsonify({
        "success": True,
        "message": "Message saved successfully!"
    })

@app.route("/contacts", methods=["GET"])
def contacts():
    db = mysql.connector.connect(
        host="localhost",
        user="root",
        password="manikeerthu@11",
        database="whatsapp_timer"
    )

    cursor = db.cursor(dictionary=True)

    cursor.execute("""
    SELECT contact_name, phone_number
    FROM contacts
    ORDER BY contact_name
""")

    contacts = cursor.fetchall()

    cursor.close()
    db.close()

    return jsonify(contacts)
@app.route("/add_contact", methods=["POST"])
def add_contact():
    contact_name = request.form.get("contact_name")
    phone_number = request.form.get("phone_number")

    db = mysql.connector.connect(
        host="localhost",
        user="root",
        password="manikeerthu@11",
        database="whatsapp_timer"
    )

    cursor = db.cursor()

    cursor.execute("""
        INSERT INTO contacts (contact_name, phone_number)
        VALUES (%s, %s)
    """, (contact_name, phone_number))

    db.commit()

    cursor.close()
    db.close()

    return jsonify({
        "success": True,
        "message": "Contact saved successfully!"
    })
print(app.url_map)
if __name__ == "__main__":
    app.run(debug=True)