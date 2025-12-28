from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3

app = Flask(__name__)
CORS(app)

def get_db_connection():
    conn = sqlite3.connect('fintracker.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''CREATE TABLE IF NOT EXISTS Users (
        user_id INTEGER PRIMARY KEY, username TEXT, email TEXT, password TEXT)''')
    
    cursor.execute('''CREATE TABLE IF NOT EXISTS Category (
        category_id INTEGER PRIMARY KEY, category_name TEXT, category_type TEXT)''')

    cursor.execute('''CREATE TABLE IF NOT EXISTS Transactions (
        transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount REAL NOT NULL,
        transaction_date TEXT NOT NULL,
        description TEXT,
        type TEXT,
        user_id INTEGER NOT NULL,
        category_id INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES Users(user_id),
        FOREIGN KEY (category_id) REFERENCES Category(category_id))''')
    
    # Initial Data Check
    cursor.execute("SELECT COUNT(*) FROM Category")
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO Users VALUES (1, 'Safa', 'safa@gmail.com', '12345')")
        cursor.executemany("INSERT INTO Category VALUES (?, ?, ?)", 
                           [(1, 'Food', 'Expense'), (2, 'Transport', 'Expense'), (3, 'Salary', 'Income')])
    conn.commit()
    conn.close()

# --- ROUTES ---

@app.route('/api/dashboard', methods=['GET'])
def dashboard():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT SUM(amount) FROM Transactions WHERE type LIKE 'Income'")
    income = cursor.fetchone()[0] or 0
    cursor.execute("SELECT SUM(amount) FROM Transactions WHERE type LIKE 'Expense'")
    expense = cursor.fetchone()[0] or 0
    conn.close()
    return jsonify({"total_income": income, "total_expense": expense, "remaining": income - expense})

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT t.*, c.category_name FROM Transactions t JOIN Category c ON t.category_id = c.category_id ORDER BY transaction_date DESC")
    transactions = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(transactions)

@app.route('/api/add-transaction', methods=['POST'])
def add_transaction():
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""INSERT INTO Transactions (amount, type, category_id, description, transaction_date, user_id)
                      VALUES (?, ?, ?, ?, ?, 1)""", 
                   (data['amount'], data['type'].capitalize(), data['category_id'], data['description'], data['transaction_date']))
    conn.commit()
    conn.close()
    return jsonify({"message": "Added successfully"}), 201

# --- NEW: EDIT TRANSACTION ---
@app.route('/api/transaction/<int:id>', methods=['PUT'])
def edit_transaction(id):
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""UPDATE Transactions 
                      SET amount=?, type=?, category_id=?, description=?, transaction_date=?
                      WHERE transaction_id=?""",
                   (data['amount'], data['type'].capitalize(), data['category_id'], data['description'], data['transaction_date'], id))
    conn.commit()
    conn.close()
    return jsonify({"message": "Updated successfully"}), 200

# --- NEW: DELETE TRANSACTION ---
@app.route('/api/transaction/<int:id>', methods=['DELETE'])
def delete_transaction(id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM Transactions WHERE transaction_id=?", (id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Deleted successfully"}), 200

if __name__ == "__main__":
    init_db()
    app.run(debug=True, port=5000)