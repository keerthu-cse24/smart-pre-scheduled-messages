console.log("JS WORKING");

function scheduleMessage() {
    const contactName = document.getElementById("contact_name").value;
    const phoneNumber = document.getElementById("phone_number").value;
    console.log("SCHEDULE BUTTON CLICKED");
    const message = document.getElementById("message").value;
    const date = document.getElementById("date").value;
    const result = document.getElementById("result")
    const hour = document.getElementById("hour").value;
    const minute = document.getElementById("minute").value;
    const ampm = document.getElementById("ampm").value;

if (hour === "" || minute === "") {
    result.textContent = "Please enter a valid time.";
    result.classList.remove("success");
    return;
}

let hour24 = parseInt(hour);

if (ampm === "AM" && hour24 === 12) {
    hour24 = 0;
}

if (ampm === "PM" && hour24 !== 12) {
    hour24 += 12;
}

    const time = `${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    const photo = document.getElementById("photo");
    const video = document.getElementById("video");
    const phone = document.getElementById("phone_number").value.trim();

    if (!/^\d{10,15}$/.test(phone)) {
    result.textContent = "Please enter a valid WhatsApp number.";
    result.classList.remove("success");
    return;
    }
    const selectedDateTime = new Date(date + "T" + time);
    const currentDateTime = new Date();

    if (selectedDateTime <= currentDateTime) {
    result.textContent = "Please select a future date and time.";
    result.classList.remove("success");
    return;
    }

    if (contactName === "" || phoneNumber === "" || message === "" || date === "" || time === "") {
        result.textContent = "Please fill all fields.";
        return;
    }

    const formData = new FormData();

    formData.append("contact_name", contactName);
    formData.append("phone_number", phoneNumber);
    formData.append("message", message);
    formData.append("date", date);
    formData.append("time", time);

    if (photo.files[0]) {
        formData.append("photo", photo.files[0]);
    }

    if (video.files[0]) {
        formData.append("video", video.files[0]);
    }

    console.log("SENDING REQUEST TO / schedule");
    fetch("/schedule", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        result.textContent = data.message;
        result.classList.add("success");
    })
    .catch(error => {
        result.textContent = error;
        console.log(error);
    });
}
document.getElementById("contact_name").addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        document.getElementById("phone_number").focus();
    }
});

document.getElementById("phone_number").addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        document.getElementById("message").focus();
    }
});

document.getElementById("message").addEventListener("keydown", function(event) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        document.getElementById("date").focus();
    }
});

document.getElementById("date").addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        document.getElementById("hour").focus();
    }
});

document.getElementById("hour").addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        document.getElementById("minute").focus();
    }
});

document.getElementById("minute").addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        document.getElementById("ampm").focus();
    }
});

document.getElementById("ampm").addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        document.querySelector("button").focus();
    }
});


function loadContacts() {
    fetch("/contacts")
        .then(response => response.json())
        .then(contacts => {
            const contactList = document.getElementById("contacts");
            contactList.innerHTML = "";

            if (contacts.length === 0) {
                contactList.innerHTML = "<p>No contacts saved yet.</p>";
                return;
            }

            contacts.forEach(contact => {
                const item = document.createElement("p");
                item.textContent = contact.contact_name + " - " + contact.phone_number;
                item.style.cursor = "pointer";

                item.addEventListener("click", function() {
                    document.getElementById("contact_name").value = contact.contact_name;
                    document.getElementById("phone_number").value = contact.phone_number;
                    document.getElementById("message").focus();
                });

                contactList.appendChild(item);
            });
        })
        .catch(error => {
            console.log("CONTACT ERROR:", error);
        });
}

//loadContacts();
function showContactForm() {
    const name = prompt("Enter contact name:");
    if (name === null || name.trim() === "") return;

    const number = prompt("Enter WhatsApp number:");
    if (number === null || number.trim() === "") return;

    const formData = new FormData();

    formData.append("contact_name", name.trim());
    formData.append("phone_number", number.trim());

    fetch("/add_contact", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);

        if (data.success) {
            loadContacts();

            document.getElementById("contact_name").value = name.trim();
            document.getElementById("phone_number").value = number.trim();
            document.getElementById("message").focus();
        }
    })
    .catch(error => {
        console.log("ERROR DETAILS:", error);
        alert("Failed to save contact.");
    });
}
let savedContacts = [];
let selectedContactIndex = -1;

function loadContactSuggestions() {
    fetch("/contacts")
        .then(response => response.json())
        .then(contacts => {
            savedContacts = contacts;
        })
        .catch(error => console.log("CONTACT ERROR:", error));
}

loadContactSuggestions();

const contactInput = document.getElementById("contact_name");
const suggestionBox = document.getElementById("contact_suggestions");

contactInput.addEventListener("input", function() {
    const text = contactInput.value.toLowerCase().trim();

    suggestionBox.innerHTML = "";
    selectedContactIndex = -1;

    if (text === "") return;

    const matches = savedContacts.filter(contact =>
        contact.contact_name.toLowerCase().includes(text)
    );

    matches.forEach((contact, index) => {
        const item = document.createElement("div");

        item.textContent = contact.contact_name;

        item.addEventListener("click", function() {
            contactInput.value = contact.contact_name;
            document.getElementById("phone_number").value = contact.phone_number;
            suggestionBox.innerHTML = "";
            document.getElementById("message").focus();
        });

        suggestionBox.appendChild(item);
    });
});

contactInput.addEventListener("keydown", function(event) {
    const items = suggestionBox.children;

    if (items.length === 0) return;

    if (event.key === "ArrowDown") {
        event.preventDefault();

        selectedContactIndex =
            (selectedContactIndex + 1) % items.length;

        updateSelectedContact(items);
    }

    if (event.key === "ArrowUp") {
        event.preventDefault();

        selectedContactIndex =
            (selectedContactIndex - 1 + items.length) % items.length;

        updateSelectedContact(items);
    }

    if (event.key === "Enter") {
        event.preventDefault();

        if (selectedContactIndex >= 0) {
            items[selectedContactIndex].click();
        }
    }
});


function updateSelectedContact(items) {
    for (let i = 0; i < items.length; i++) {
        items[i].classList.remove("selected");
    }

    if (selectedContactIndex >= 0) {
        items[selectedContactIndex].classList.add("selected");
    }
}
function showHistory() {
    fetch("/history")
        .then(response => response.json())
        .then(messages => {
            const history = document.getElementById("history");

            history.innerHTML = "";

            if (messages.length === 0) {
                history.innerHTML = "<p>No message history yet.</p>";
                return;
            }

            messages.forEach(message => {
                const card = document.createElement("div");
                card.className = "history-card";
                const deleteButton = document.createElement("button");
deleteButton.textContent = "Delete";
deleteButton.type = "button";

deleteButton.onclick = function() {
    fetch("/delete_message/" + message.id, {
        method: "DELETE"
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showHistory();
        }
    });
};


                card.innerHTML = `
                    <div class="history-contact">
                        ${message.contact_name}
                    </div>

                    <p>${message.msg}</p>

                    <p>📅 ${message.scheduled_time}</p>

                    <p class="history-status">
                        Status: ${message.status}
                    </p>
                `;
                card.appendChild(deleteButton);

                history.appendChild(card);
            });
        })
        .catch(error => {
            console.log("HISTORY ERROR:", error);
        });
}
