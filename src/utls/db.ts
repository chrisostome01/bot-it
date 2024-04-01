import sqlite3 from "sqlite3";

export const db = new sqlite3.Database("./src/utls/messages.db");
db.serialize(() => {
  db.run(
    "CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, chat_id INTEGER, content TEXT, role TEXT)"
  );
});

export async function getAllMessages() {
  return await new Promise((resolve, reject) => {
    const query = "SELECT * FROM messages";
    db.all(query, (err, rows) => {
      if (err) {
        console.error("Error fetching messages:", err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

export async function createMessage(messageid: number, content: string, role: string) {
  db.run("INSERT INTO messages (chat_id, content, role) VALUES (?, ?, ?)", [
    messageid,
    content,
    role
  ]);
}


