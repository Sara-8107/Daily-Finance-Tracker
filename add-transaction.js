document.querySelector('input[type="date"]').value = new Date().toISOString().split('T')[0];

document.getElementById("transaction-form").addEventListener("submit", async function(e) {
    e.preventDefault();

    // Create the data object from the form
    const formData = new FormData(this);
    const transaction = {
        amount: Number(formData.get('amount')),
        type: formData.get('type'), // will get "income" or "expense"
        category_id: Number(formData.get('category_id')),
        description: formData.get('description'),
        transaction_date: formData.get('transaction_date')
    };

    try {
        // Send to Flask API instead of LocalStorage
        const response = await fetch('http://127.0.0.1:5000/api/add-transaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transaction)
        });

        const data = await response.json();
        if (response.ok) {
            alert("Transaction saved to database!");
            window.location.href = "Expense tracker.html"; // Redirect back to dashboard to see changes
        } else {
            alert("Error: " + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert("Could not connect to the server.");
    }
});