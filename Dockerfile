# Χρησιμοποιούμε επίσημη Python image
FROM python:3.11-slim

# Ορίζουμε working directory μέσα στο container
WORKDIR /app

# Αντιγράφουμε τα requirements πρώτα (για caching)
COPY requirements.txt .

# Εγκαθιστούμε τις βιβλιοθήκες
RUN pip install --no-cache-dir -r requirements.txt

# Αντιγράφουμε όλο τον κώδικα
COPY . .

# Δημιουργούμε τον φάκελο για τη βάση δεδομένων
RUN mkdir -p /app/instance

# Δίνουμε δικαιώματα εγγραφής
RUN chmod 777 /app/instance

# Κάνουμε expose το port 5000
EXPOSE 5000

# Ορίζουμε environment variables
ENV FLASK_APP=app.py
ENV FLASK_ENV=production

# Τρέχουμε την εφαρμογή
CMD ["python", "app.py"]